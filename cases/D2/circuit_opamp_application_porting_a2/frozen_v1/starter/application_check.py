"""Per-bench diagnostic only; this does not run the independent final verifier."""
from pathlib import Path
import json,sys
import numpy as np

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

if __name__=="__main__":
    case=json.loads(Path(sys.argv[1]).read_text())
    metrics=analyze(Path(sys.argv[2]),case)
    limits=json.loads(Path("/app/contract.json").read_text())["application_limits"]
    print(json.dumps({"metrics":metrics,"checks":check_metrics(case,metrics,limits)},indent=2))
