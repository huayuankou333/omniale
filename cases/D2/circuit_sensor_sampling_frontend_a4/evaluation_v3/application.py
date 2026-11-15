"""Trusted new-envelope simulator and waveform measurements for A3/A4."""
from pathlib import Path
import importlib.util,json,math,re,shutil,uuid
import numpy as np
from config import ROOT,CASE,BASE_IMAGE,save,digest
from native import capture,flags

def generate(destination):
    spec=importlib.util.spec_from_file_location('decks',ROOT/'tools/build_benches.py')
    gen=importlib.util.module_from_spec(spec);spec.loader.exec_module(gen)
    destination=Path(destination).resolve()
    index=gen.generate(ROOT,destination,Path('/app/circuit.spi'),Path('/opt/sky130/continuous/sky130.lib.spice'))
    # The generation program uses absolute paths, while the trusted evaluator
    # mount is /eval. Only fixed fixture paths are relocated; no DUT edits.
    for row in index['cases']:
        p=destination/row['deck'];text=p.read_text()
        text=text.replace(str(destination).replace('\\','/'),'/eval')
        p.write_text(text)
    return index

def window(x,y,lo,hi):
    if not (x[0] <= lo+1e-17 and x[-1]>=hi-1e-17 and hi>=lo):
        raise ValueError('Waveform does not cover required measurement window')
    mask=(x>lo)&(x<hi)
    return np.r_[lo,x[mask],hi],np.r_[np.interp(lo,x,y),y[mask],np.interp(hi,x,y)]

def peak(x,y,lo,hi):
    _,v=window(x,y,lo,hi);return float(np.max(np.abs(v)))

def integrate(x,y,lo,hi):
    t,v=window(x,y,lo,hi);return float(np.trapz(v,t))

def at(x,y,t):
    if t<x[0]-1e-17 or t>x[-1]+1e-17:raise ValueError('Missing requested sample')
    return float(np.interp(t,x,y))

def read_wave(path,row):
    array=np.loadtxt(path,skiprows=1,ndmin=2)
    expected=1+len(row['vectors'])*(2 if row['kind']=='psr' else 1)
    if array.shape[1]!=expected or array.shape[0]<2 or not np.all(np.isfinite(array)):
        raise ValueError(f'Invalid wave shape/finite values {array.shape}; expected {expected} columns')
    x=array[:,0]
    if np.any(np.diff(x)<0):raise ValueError('Nonmonotonic sweep')
    # ngspice may store equal initial coordinates; retain last deterministic row.
    keep=np.r_[np.diff(x)>0,True];array=array[keep];x=array[:,0]
    if len(x)<2 or np.any(np.diff(x)<=0):raise ValueError('Missing sweep extent')
    if row['kind']=='psr':
        y={n:array[:,1+2*i]+1j*array[:,2+2*i] for i,n in enumerate(row['vectors'])}
    else:y={n:array[:,i+1] for i,n in enumerate(row['vectors'])}
    return x,y

def a3(row,x,y,cfg):
    lim=cfg['limits'];kind=row['kind'];supply=row['supply_v'];vset=row['vset_v'];target=2.5*vset
    out=y['v(vout)'];ref=y['v(vref)'];iref=y['i(vrefs)']
    p=np.maximum(-y['v(vin)']*y['i(vdut)'],0)+np.maximum(-y['v(vinref)']*y['i(vrefrail)'],0)
    metrics={};checks={}
    if kind=='dc':
        if len(x)!=201 or not np.allclose(x,np.linspace(0,.02,201),rtol=1e-8,atol=1e-12):raise ValueError('Incomplete 201-point load sweep')
        metrics={'output_error_v':float(np.max(abs(out-target))),'reference_error_v':float(np.max(abs(ref-vset))),'reference_current_a':float(np.max(abs(iref))),'worst_supply_excess_w':float(np.max(p-supply*(x+lim['dc_overhead_current_a'])))}
        checks={'finite_dc_tracking':metrics['output_error_v']<=lim['dc_output_error_v'],
                'reference_integrity':metrics['reference_error_v']<=lim['reference_dc_error_v'] and metrics['reference_current_a']<=lim['reference_dc_current_abs_a'],
                'total_supply_power':metrics['worst_supply_excess_w']<=0}
    elif kind=='psr':
        if x[0]>10 or x[-1]<1e7:raise ValueError('Incomplete AC range')
        for freq in (1000,100000,1000000):
            # Interpolate complex response vs log frequency; the dense grid
            # includes these exact decade frequencies in the frozen setup.
            z=np.interp(np.log10(freq),np.log10(x),out.real)+1j*np.interp(np.log10(freq),np.log10(x),out.imag)
            metrics[f'psr_{freq}_db']=-20*math.log10(max(abs(z),1e-300))
        checks={'finite_reference_psr':metrics['psr_1000_db']>=lim['psr_1khz_db'][str(supply)] and metrics['psr_100000_db']>=lim['psr_100khz_db'] and metrics['psr_1000000_db']>=lim['psr_1mhz_db']}
    elif kind=='step':
        if x[0]>1e-17 or x[-1]<100e-6-1e-17 or np.max(np.diff(x))>cfg['step_max_step_s']*1.01:raise ValueError('Incomplete/undersampled step')
        excursion=max(peak(x,out-target,a,b) for a,b in [(20e-6,41e-6),(60e-6,81e-6)])
        recovery=max(peak(x,out-target,a,b) for a,b in [(41e-6,60e-6),(81e-6,100e-6)])
        iload=np.interp(x,[0,20e-6,21e-6,60e-6,61e-6,100e-6],[.0005,.0005,.02,.02,.0005,.0005])
        avgp=integrate(x,p,0,100e-6)/100e-6;avgi=integrate(x,iload,0,100e-6)/100e-6
        metrics={'step_excursion_v':excursion,'step_recovery_v':recovery,'reference_error_v':peak(x,ref-vset,0,100e-6),'reference_current_a':peak(x,iref,0,100e-6),'average_supply_power_w':avgp,'average_load_a':avgi,'power_limit_w':supply*(avgi+lim['step_average_overhead_current_a'])}
        checks={'coupled_transient_startup':excursion<=lim['step_excursion_v'] and recovery<=lim['step_recovery_v'],
                'reference_integrity':metrics['reference_error_v']<=lim['reference_step_error_v'] and metrics['reference_current_a']<=lim['reference_step_current_abs_a'],
                'total_supply_power':avgp<=metrics['power_limit_w']}
    elif kind=='startup':
        if x[0]>1e-17 or x[-1]<400e-6-1e-17 or np.max(np.diff(x))>cfg['startup_max_step_s']*1.01:raise ValueError('Incomplete/undersampled startup')
        metrics={'peak_v':float(np.max(out)),'tail_error_v':peak(x,out-target,200e-6,400e-6),'reference_tail_error_v':peak(x,ref-vset,200e-6,400e-6),'startup_positive_energy_j':integrate(x,p,0,400e-6)}
        checks={'coupled_transient_startup':metrics['peak_v']<=lim['startup_peak_v'] and metrics['tail_error_v']<=lim['startup_tail_error_v'],
                'reference_integrity':metrics['reference_tail_error_v']<=lim['reference_dc_error_v']}
    return metrics,checks

def a4(row,x,y,cfg):
    s=cfg['sampling'];lim=cfg['limits'];period=s['period_s'];last=len(row['differential_source_sequence_v'])*period
    if x[0]>1e-17 or x[-1]<last-1e-17 or np.max(np.diff(x))>cfg['transient_max_step_s']*1.01:
        raise ValueError('Incomplete/undersampled sampling sequence')
    diff=y['v(voutp)']-y['v(voutn)'];cm=.5*(y['v(voutp)']+y['v(voutn)'])-row['supply_v']/2
    sample_error=hold_error=cm_error=settle_error=kick=charge=tail=0.0;reads=[];settling=[]
    for i in row['scored_cycle_indices']:
        base=i*period;target=row['target_output_sequence_v'][i];err=diff-target
        rd=at(x,diff,base+s['read_time_s']);reads.append({'cycle':i,'value_v':rd,'target_v':target})
        sample_error=max(sample_error,abs(rd-target));hold_error=max(hold_error,peak(x,err,base+s['hold_window_s'][0],base+s['hold_window_s'][1]))
        cm_error=max(cm_error,abs(at(x,cm,base+s['read_time_s'])),peak(x,cm,base+s['hold_window_s'][0],base+s['hold_window_s'][1]))
        settle_error=max(settle_error,peak(x,err,base+s['settling_deadline_s'],base+s['hold_window_s'][1]))
        tt,ee=window(x,err,base+s['transfer_marker_s'],base+s['hold_window_s'][1]);bad=np.flatnonzero(abs(ee)>lim['settling_error_v'])
        if len(bad):
            j=bad[-1];last_bad=tt[j]
            if j+1<len(tt):
                aa=abs(ee[j]);bb=abs(ee[j+1]);last_bad=tt[j]+(lim['settling_error_v']-aa)/(bb-aa)*(tt[j+1]-tt[j]) if bb!=aa else tt[j]
            st=float(last_bad-base-s['transfer_marker_s'])
        else:st=0.0
        settling.append({'cycle':i,'settling_s':st,'still_outside_at_end':bool(len(bad) and bad[-1]==len(ee)-1)})
        for leg in ('p','n'):
            sens=y[f'v(sens{leg})'];baseline=y[f'v(base{leg})'];src=y[f'v(src{leg})'];r=row[f'rs_{leg}_ohm']
            dv=sens-baseline;di=(baseline-sens)/r
            tail=max(tail,abs(at(x,dv,base+s['acquisition_tail_s'])))
            for lo,hi in s['disturbance_windows_s']:
                kick=max(kick,peak(x,dv,base+lo,base+hi))
                charge=max(charge,integrate(x,abs(di),base+lo,base+hi))
    power=np.zeros_like(x)
    for voltage,current in [('v(vdd)','i(vdd)'),('v(vocm)','i(vocm)'),('v(srcp)','i(vsensp)'),('v(srcn)','i(vsensn)'),('v(phi_reset)','i(vreset)'),('v(phi_track)','i(vtrack)'),('v(phi_transfer)','i(vtransfer)')]:
        power+=np.maximum(-y[voltage]*y[current],0)
    avgp=integrate(x,power,s['warmup_cycles']*period,last)/(last-s['warmup_cycles']*period)
    m={'sample_error_v':sample_error,'hold_error_v':hold_error,'sample_common_mode_error_v':cm_error,'settling_window_error_v':settle_error,'maximum_settling_s':max(r['settling_s'] for r in settling),'sensor_peak_disturbance_v':kick,'sensor_charge_abs_c':charge,'sensor_tail_disturbance_v':tail,'system_positive_power_w':avgp,'reads':reads,'settling':settling}
    checks={'sample_accuracy':sample_error<=lim['sample_error_v'] and hold_error<=lim['sample_error_v'] and cm_error<=lim['common_mode_error_v'],
            'transfer_settling':settle_error<=lim['settling_error_v'],
            'sensor_disturbance':kick<=lim['sensor_peak_disturbance_v'] and charge<=lim['sensor_charge_abs_c'] and tail<=lim['sensor_tail_disturbance_v'],
            'system_positive_power':avgp<=lim['system_average_positive_power_w']}
    return m,checks

def run_one(circuit,root,row,cfg,timeout=120):
    folder=root/Path(row['deck']).parent
    from persistent import simulate_application
    result=simulate_application(circuit,root,row,timeout)
    (folder/'stdout.log').write_text(result['stdout']);(folder/'stderr.log').write_text(result['stderr'])
    outcome={'case':row,'execution':{k:v for k,v in result.items() if k not in ('stdout','stderr')},'metrics':{},'checks':{},'complete':False}
    try:
        if result['exit_code']!=0:raise ValueError('Native process exit '+str(result['exit_code']))
        if row['kind']=='noise':
            match=re.search(r'^\s*onoise_total\s*=\s*([-+\deE.]+)',result['stdout'],re.M|re.I)
            if not match:raise ValueError('Missing integrated noise result')
            val=float(match.group(1))
            if not math.isfinite(val) or val<0:raise ValueError('Invalid noise integral')
            outcome.update(metrics={'acquisition_phase_noise_vrms':val},checks={'acquisition_phase_noise':val<=cfg['limits']['acquire_phase_noise_vrms']},complete=True)
        else:
            x,y=read_wave(root/row['wave'],row)
            m,checks=(a3 if CASE=='A3' else a4)(row,x,y,cfg)
            outcome.update(metrics=m,checks=checks,complete=True)
    except Exception as exc:
        outcome['failure']=str(exc)
        text=result['stderr']+'\n'+result['stdout']
        if result['exit_code'] in (125,126,127) or 'Error response from daemon' in text:
            outcome['infrastructure_error']=text[-1500:]
    save(folder/'measurement.json',outcome)
    return outcome

def summarize(index,rows,cfg):
    byid={r['case']['id']:r for r in rows};groups={}
    for group,ids in index['group_case_ids'].items():
        complete=all(i in byid and byid[i]['complete'] for i in ids)
        if group=='history_independence':continue
        passed=complete and all(byid[i]['checks'].get(group,False) for i in ids)
        failed=[i for i in ids if i not in byid or not byid[i].get('checks',{}).get(group,False)]
        groups[group]={'name':group,'status':'passed' if passed else 'failed' if complete else 'incomplete','complete':complete,'required_cases':len(ids),'failed_case_ids':failed}
    history=[]
    if CASE=='A4':
        pairs={}
        for r in rows:
            if r['case']['kind']=='transient':pairs.setdefault(r['case']['pair_key'],{})[r['case']['history']]=r
        good=True;complete=True
        for key,pair in pairs.items():
            a=pair.get('positive_history');b=pair.get('negative_history')
            valid=a and b and a['complete'] and b['complete']
            if not valid:complete=False;good=False;history.append({'pair':key,'complete':False});continue
            da={v['cycle']:v['value_v'] for v in a['metrics']['reads']};db={v['cycle']:v['value_v'] for v in b['metrics']['reads']}
            err=max(abs(da[i]-db[i]) for i in range(8,24))
            ok=err<=cfg['limits']['history_error_v'];good&=ok
            history.append({'pair':key,'complete':True,'error_v':err,'passed':ok})
        required=len(index['group_case_ids']['history_independence'])//2
        complete=complete and len(pairs)==required
        groups['history_independence']={'name':'history_independence','status':'passed' if good and complete else 'failed' if complete else 'incomplete','complete':bool(complete),'required_pairs':required,'pairs':history}
    return [groups[g] for g in cfg['added_groups']]
