"""Fixed sensor applications and independent waveform measurements for A2."""
import json
import os
import re
from pathlib import Path
import shutil
import uuid
import numpy as np
from config import ROOT,BASE_IMAGE,save,digest
from native import flags,capture


def cases():
    result=[]
    for corner in ['tt','ss','ff']:
        for temp in [-20,27,85]:
            for gain,lo,hi in [(1,.7,1.0),(4,.625,.825)]:
                for cl in [1,3,6]:
                    result.append(dict(kind='tracking',corner=corner,temp=temp,gain=gain,lo=lo,hi=hi,cl_pf=cl))
            result.append(dict(kind='overload',corner=corner,temp=temp,gain=4,cl_pf=6))
    return result


def deck(case,design='circuit.spi',step='100p'):
    gain=case['gain'];kind=case['kind'];cl=case['cl_pf']
    if kind=='tracking':
        lo=case['lo'];hi=case['hi']
        vin=f'VIN sensor 0 dc {lo} PULSE({lo} {hi} 200n 1n 1n 300n 600n)'
        analysis=f'tran {step} 1.4u 0 {step}\nwrdata wave.txt v(sensor) v(inp) v(sensed) v(out) i(VSUP) i(VPIN) i(VNIN)\ndc VIN {lo} {hi} {(hi-lo)/40}\nwrdata dc.txt v(sensor) v(inp) v(sensed) i(VSUP) i(VREF) i(VIN) i(VPIN) i(VNIN)'
    else:
        vin='VIN sensor 0 dc 0.725 PWL(0 0.725 200n 0.725 201n 0.95 300n 0.95 301n 0.725 600n 0.725 601n 0.50 700n 0.50 701n 0.725 1u 0.725)'
        analysis=f'tran {step} 1u 0 {step}\nwrdata wave.txt v(sensor) v(inp) v(sensed) v(out) i(VSUP) i(VPIN) i(VNIN)'
    fb='Rfb sensed innraw 1m' if gain==1 else 'Rf sensed innraw 30k\nRg innraw ref 10k'
    return f'''* A2 fixed sensor application: {kind}, gain {gain}
.lib /opt/sky130/continuous/sky130.lib.spice {case['corner']}
.include {design}
.global vdd
.options method=gear maxord=2 reltol=1e-4 gmin=1e-12 vntol=1e-7 abstol=1e-13
.temp {case['temp']}
VSUP vdd 0 1.2
IREF vdd iref 20u
VREF ref 0 0.75
{vin}
Rs sensor inpraw 10k
VPIN inpraw inp 0
VNIN innraw inn 0
XDUT iref inp inn out dut
Rcable out sensed 20
CL sensed 0 {cl}p
RL sensed ref 50k
{fb}
.control
set wr_singlescale
set wr_vecnames
option numdgt=15
{analysis}
.endc
.end
'''


def read_data(path,columns):
    a=np.loadtxt(path,skiprows=1,ndmin=2)
    if a.shape[1]!=columns or a.shape[0]<100 or not np.isfinite(a).all():
        raise ValueError('Missing, malformed or nonfinite waveform: '+str(path))
    return a


def edge_metrics(t,y,start,end,target,direction,amplitude):
    mask=(t>=start)&(t<=end);tt=t[mask];yy=y[mask]
    if len(tt)<100 or tt[-1]<end-1e-9:raise ValueError('Incomplete edge window')
    bad=np.flatnonzero(abs(yy-target)>0.001)
    settled=0.0 if len(bad)==0 else (float(tt[bad[-1]+1]-start) if bad[-1]+1<len(tt) else None)
    late=yy[tt>=end-20e-9]
    over=max(0.0,float(np.max(direction*(yy-target))))/amplitude
    return {'settling_s':settled,'overshoot_fraction':over,'late_error_max_v':float(np.max(abs(late-target))),
            'late_ripple_v':float(np.ptp(late)),'target_v':target}


def analyze(folder,case):
    wave=read_data(Path(folder)/'wave.txt',8)
    t,sensor,inp,y,out,isup,ipin,inin=wave.T
    if case['kind']=='tracking':
        gain=case['gain'];lo=gain*case['lo']-(gain-1)*.75;hi=gain*case['hi']-(gain-1)*.75
        edges=[(201e-9,490e-9,hi,1),(502e-9,790e-9,lo,-1),(801e-9,1090e-9,hi,1),(1102e-9,1390e-9,lo,-1)]
        dc=np.loadtxt(Path(folder)/'dc.txt',skiprows=1,ndmin=2)
        if dc.shape!=(41,9) or not np.isfinite(dc).all():raise ValueError('Incomplete DC sweep')
        ideal=gain*dc[:,1]-(gain-1)*.75
        vdd_power=1.2*np.maximum(0,-dc[:,4])
        total=vdd_power+.75*np.maximum(0,-dc[:,5])+dc[:,1]*np.maximum(0,-dc[:,6])
        return {
            'dc_error_max_v':float(np.max(abs(dc[:,3]-ideal))),
            'dc_input_current_max_a':float(np.max(abs(dc[:,7:9]))),
            'dc_vdd_power_max_w':float(np.max(vdd_power)),
            'dc_total_positive_power_max_w':float(np.max(total)),
            'steps':[edge_metrics(t,y,a,b,target,d,hi-lo) for a,b,target,d in edges],
        }
    return {'recoveries':[edge_metrics(t,y,a,b,.65,d,1.0) for a,b,d in [(301e-9,590e-9,-1),(701e-9,990e-9,1)]]}


def check_metrics(case,metrics,limits):
    if case['kind']=='overload':
        good=all(x['settling_s'] is not None and x['settling_s']<=limits['overload_recovery_s'] and x['late_error_max_v']<=limits['dc_error_v'] and x['late_ripple_v']<=limits['late_ripple_v'] for x in metrics['recoveries'])
        return {'overload_recovery':good}
    ss=metrics['steps']
    return {
        'application_range_and_loading':metrics['dc_error_max_v']<=limits['dc_error_v'] and metrics['dc_input_current_max_a']<=limits['input_current_a'],
        'application_power':metrics['dc_vdd_power_max_w']<=limits['vdd_power_w'] and metrics['dc_total_positive_power_max_w']<=limits['total_positive_power_w'],
        'application_tracking':all(x['settling_s'] is not None and x['settling_s']<=limits['settling_s'] and x['late_error_max_v']<=limits['dc_error_v'] for x in ss),
        'application_stability':all(x['overshoot_fraction']<=limits['overshoot_fraction'] and x['late_ripple_v']<=limits['late_ripple_v'] for x in ss),
    }


def simulate(design,case,folder,step='100p'):
    folder=Path(folder).resolve();folder.mkdir(parents=True,exist_ok=False)
    shutil.copy2(design,folder/'circuit.spi')
    (folder/'test.spi').write_text(deck(case,step=step))
    command=flags('simle-a2-application-'+uuid.uuid4().hex[:12],os.getuid())+[
        '-v',f'{folder}:/work','-e','HOME=/tmp','-v',f'{ROOT/"trusted.spiceinit"}:/tmp/.spiceinit:ro',
        '-w','/work',BASE_IMAGE,'ngspice','-b','test.spi','-o','native.log']
    execution=capture(command,120)
    result={'case':case,'source_sha256':digest(design),'execution':execution}
    if execution['exit_code']==0:
        try:
            log=(folder/'native.log').read_text(errors='replace')
            if re.search(r'^\s*error\b',log,re.M|re.I):raise ValueError('ngspice reported an error; inspect native.log')
            result['metrics']=analyze(folder,case)
        except Exception as exc:result['analysis_error']=str(exc)
    save(folder/'result.json',result)
    return result
