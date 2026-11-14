"""Pre-freeze reference design exploration; never supplied to the tested agent."""
import concurrent.futures
import argparse
import itertools
import json
import os
from pathlib import Path
import re
from string import Template
import sys
import uuid
from config import ROOT,BASE_IMAGE,save,digest
from native import flags,capture
from probe import run

sys.path.append(str(ROOT/'upstream/benchmark'))
from netlist import mos_devices,op_print_lines
from measure import opamp_loop,headroom


def loop(design,folder):
    folder=Path(folder).resolve();folder.mkdir(parents=True,exist_ok=False)
    text=Template((ROOT/'upstream/benchmark/testbenches/opamp_loop.cir.tmpl').read_text()).safe_substitute(
        HEADER='.lib /opt/sky130/continuous/sky130.lib.spice tt',VDD=1.2,IREF='20u',VCM=.9,CL='1p')
    text=text.replace('$DUT',Path(design).read_text())
    devices=mos_devices(text)
    text=text.replace('$OPPRINT',op_print_lines(devices))
    (folder/'test.spi').write_text(text)
    cmd=flags('simle-a2-loop-'+uuid.uuid4().hex[:10],os.getuid())+[
        '-v',f'{folder}:/work','-e','HOME=/tmp','-v',f'{ROOT/"trusted.spiceinit"}:/tmp/.spiceinit:ro',
        '-w','/work',BASE_IMAGE,'ngspice','-b','test.spi','-o','native.log']
    execution=capture(cmd,120)
    result={'execution':execution,'design_sha256':digest(design)}
    if execution['exit_code']==0:
        try:
            metrics=opamp_loop(folder,{},1.2);metrics['n_triode']=headroom(folder,devices)['n_triode']
            result['metrics']=metrics
            result['loop_pass']=all(metrics[k] is not None and metrics[k]>=v for k,v in {'dc_gain_dB':78.4,'ugf_Hz':89e6,'pm_deg':60,'gm_dB':10}.items()) and metrics['power_uW']<=296.4 and metrics['n_triode']==0
        except Exception as exc:result['analysis_error']=str(exc)
    save(folder/'result.json',result)
    return result


def candidate(params):
    text=(ROOT/'controls/original_golden.spi').read_text()
    text='\n'.join(x for x in text.splitlines() if not x.lstrip().startswith('*'))+'\n'
    w,l,rz,cc=params
    text=re.sub(r'(?im)^XN6 .*$',f'XN6 out o1 0 0 sky130_fd_pr__nfet_01v8_lvt W={w} L={l} nf=1 m=1',text)
    text=re.sub(r'(?im)^Rz .*$',f'Rz o1 cz {rz}k',text)
    text=re.sub(r'(?im)^Cc .*$',f'Cc cz out {cc}f',text)
    return text


def candidate2(params):
    wpair,wtail,rz,cc=params
    text=candidate((40,.36,rz,cc))
    text=re.sub(r'(?im)^(XNI[12].*?)W=40 ',rf'\g<1>W={wpair} ',text)
    text=re.sub(r'(?im)^(XNT .*?)W=50 ',rf'\g<1>W={wtail} ',text)
    return text


def candidate3(params):
    wpair,lpair,wtail,rz,cc=params
    text=candidate2((wpair,wtail,rz,cc))
    text=re.sub(r'(?im)^(XNI[12].*?)L=0.5 ',rf'\g<1>L={lpair} ',text)
    text=re.sub(r'(?im)^(XNL[34].*?)W=40 L=1 ',r'\g<1>W=20 L=0.5 ',text)
    text=re.sub(r'(?im)^(XPC[12].*?)W=35 L=0.5 ',r'\g<1>W=24.5 L=0.35 ',text)
    return text


def candidate4(params):
    wn,wp,rz,cc=params
    text=candidate((wn,.36,rz,cc))
    text=re.sub(r'(?im)^XP7 .*$',f'XP7 out o1 vdd vdd sky130_fd_pr__pfet_01v8_lvt W={wp} L=0.5 nf=1 m=1',text)
    return text


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--round',type=int,default=1);args=parser.parse_args()
    out=ROOT/f'validation/sweep_{args.round:02d}';out.mkdir(parents=True,exist_ok=False)
    if args.round==1:
        params=list(itertools.product([40,80,120],[.36,.5],[1.5,2.5,4,6],[400,450]));build=candidate
    elif args.round==2:
        params=list(itertools.product([80,160,240],[50,75],[.75,1.25,1.75],[650,850,1050]));build=candidate2
    elif args.round==3:
        params=list(itertools.product([40,80],[.15,.5],[75,90],[1,1.5],[500,600,700]));build=candidate3
    elif args.round==4:
        params=list(itertools.product([20,40,80],[40,80,120],[.75,1.25,1.75],[450,550]));build=candidate4
    else:
        params=list(itertools.product([40],[.5],[85,90,95],[1.75,2,2.25],[750,800,850]));build=candidate3
    def one(item):
        i,p=item;folder=out/f'{i:03d}';folder.mkdir();design=folder/'circuit.spi';design.write_text(build(p))
        r=loop(design,folder/'original_loop');row={'i':i,'parameters':p,'loop':r,'path':str(design)}
        if r.get('loop_pass'):
            c={'gain':1,'lo':.7,'hi':1.0,'cl_pf':6,'rs_ohm':10000,'cable_ohm':20,'rl_ohm':50000}
            app=run(design,c,folder/'application');row['app']=app
        save(folder/'result.json',row)
        print(json.dumps({'i':i,'parameters':p,'loop_pass':r.get('loop_pass',False),'loop':r.get('metrics'),'app':row.get('app',{}).get('metrics')}),flush=True)
        return row
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        rows=list(pool.map(one,enumerate(params)))
    save(out/'results.json',rows)
    print('SWEEP_COMPLETE',flush=True)


if __name__=='__main__':main()
