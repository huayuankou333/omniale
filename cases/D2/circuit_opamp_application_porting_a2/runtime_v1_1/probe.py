"""Researcher-only application calibration, before any model trial."""
from pathlib import Path
import argparse
import json
import os
import shutil
import uuid
import numpy as np
from config import ROOT, BASE_IMAGE, save, digest
from native import flags, capture


def deck(case, design='circuit.spi', step='100p'):
    corner=case.get('corner','tt'); vdd=case.get('vdd',1.2)
    temp=case.get('temp',27); gain=case.get('gain',1)
    lo=case.get('lo',.7); hi=case.get('hi',1.0)
    cl=case.get('cl_pf',1); rs=case.get('rs_ohm',0)
    cable=case.get('cable_ohm',0); rl=case.get('rl_ohm',1e12)
    ref=case.get('ref',.75)
    fb='Rfb sensed inn 1m' if gain==1 else f'Rf sensed inn {(gain-1)*10000}\nRg inn ref 10000'
    return f'''* A2 application calibration
.lib /opt/sky130/continuous/sky130.lib.spice {corner}
.include {design}
.global vdd
.options method=gear maxord=2 reltol=1e-4 gmin=1e-12 vntol=1e-7 abstol=1e-13
.temp {temp}
VSUP vdd 0 {vdd}
IREF vdd iref 20u
VREF ref 0 {ref}
VIN sensor 0 dc {lo} PULSE({lo} {hi} 200n 1n 1n 300n 600n)
Rs sensor inp {max(rs,.001)}
XDUT iref inp inn out dut
Rcable out sensed {max(cable,.001)}
CL sensed 0 {cl}p
RL sensed ref {rl}
{fb}
.control
set wr_singlescale
set wr_vecnames
option numdgt=15
tran {step} 1.4u 0 {step}
wrdata wave.txt v(sensor) v(inp) v(sensed) v(out) i(VSUP)
dc VIN {lo} {hi} {(hi-lo)/40}
wrdata dc.txt v(sensor) v(inp) v(sensed) i(VSUP)
.endc
.end
'''


def analyze(folder,case):
    a=np.loadtxt(folder/'wave.txt',skiprows=1); dc=np.loadtxt(folder/'dc.txt',skiprows=1)
    t,sensor,inp,y,out,current=a.T
    g=case.get('gain',1); ref=case.get('ref',.75)
    ideal=g*sensor-(g-1)*ref
    ideal_dc=g*dc[:,1]-(g-1)*ref
    lo=g*case.get('lo',.7)-(g-1)*ref; hi=g*case.get('hi',1.0)-(g-1)*ref
    amp=abs(hi-lo)
    responses=[]
    for edge,target,end in [(201e-9,hi,490e-9),(502e-9,lo,790e-9),(801e-9,hi,1090e-9),(1102e-9,lo,1390e-9)]:
        mask=(t>=edge)&(t<=end)
        ts=t[mask];ys=y[mask]; err=abs(ys-target)
        bad=np.flatnonzero(err>max(.001*amp,0.0002))
        settle=0.0 if len(bad)==0 else (float(ts[bad[-1]+1]-edge) if bad[-1]+1<len(ts) else None)
        responses.append({'settling_s':settle,'final_error_v':float(np.mean(ys[-max(2,len(ys)//10):])-target),'overshoot_fraction':float(max(0,np.max(ys)-target) /amp if target==hi else max(0,target-np.min(ys))/amp),'late_p2p_v':float(np.ptp(ys[-max(2,len(ys)//10):]))})
    return {'dc_error_max_v':float(np.max(abs(dc[:,3]-ideal_dc))),
            'dc_power_max_w':float(np.max(np.maximum(0,-dc[:,4]))*case.get('vdd',1.2)),
            'transient_peak_vdd_current_a':float(np.max(np.maximum(0,-current))),
            'steps':responses}


def run(design,case,folder,step='100p'):
    folder=Path(folder).resolve();folder.mkdir(parents=True,exist_ok=False)
    shutil.copy2(design,folder/'circuit.spi')
    (folder/'test.spi').write_text(deck(case,step=step))
    cmd=flags('simle-a2-probe-'+uuid.uuid4().hex[:10],os.getuid())+[
        '-v',f'{folder}:/work','-e','HOME=/tmp',
        '-v',f'{ROOT/"trusted.spiceinit"}:/tmp/.spiceinit:ro',
        '-w','/work',BASE_IMAGE,'ngspice','-b','test.spi','-o','native.log']
    execution=capture(cmd,120)
    data={'case':case,'design_sha256':digest(design),'execution':execution}
    if execution['exit_code']==0:
        try:data['metrics']=analyze(folder,case)
        except Exception as exc:data['analysis_error']=str(exc)
    save(folder/'result.json',data)
    return data


def main():
    p=argparse.ArgumentParser();p.add_argument('--design',required=True);p.add_argument('--out',required=True);args=p.parse_args()
    rows=[]
    for gain,lo,hi in [(1,.7,1.0),(4,.625,.825)]:
        for cl in [1,3,6,10]:
            case={'gain':gain,'lo':lo,'hi':hi,'cl_pf':cl,'rs_ohm':10000,'cable_ohm':20,'rl_ohm':50000}
            row=run(Path(args.design),case,Path(args.out)/f'g{gain}_c{cl}')
            rows.append(row)
            print(json.dumps(row),flush=True)
    save(Path(args.out)/'results.json',rows)


if __name__=='__main__':main()
