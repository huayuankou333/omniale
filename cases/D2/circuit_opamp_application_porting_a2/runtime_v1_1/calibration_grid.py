import concurrent.futures
import json
from pathlib import Path
import uuid
from config import ROOT,save
from original_native import evaluate
from probe import run


def main():
    designs={'fc_fast':'sweep_03/023','ab_small':'sweep_04/004','ab_medium':'sweep_04/020','ab_wide':'sweep_04/038'}
    root=ROOT/'validation/coarse_grid';root.mkdir(parents=True,exist_ok=False)
    jobs=[]
    for name,source in designs.items():
        d=ROOT/'validation'/source/'circuit.spi'
        jobs.append((name,d,None))
        for gain,lo,hi in [(1,.7,1.0),(4,.625,.825)]:
            for corner,temp in [('tt',27),('ss',-20),('ff',85)]:
                jobs.append((name,d,dict(gain=gain,lo=lo,hi=hi,cl_pf=6,rs_ohm=10000,cable_ohm=20,rl_ohm=50000,corner=corner,temp=temp)))
    def one(item):
        name,design,c=item
        if c is None:
            r=evaluate(design,root/name/'original','simle-a2-reference-'+uuid.uuid4().hex[:8])
            row={'name':name,'kind':'original','result':r}
            print(json.dumps({'name':name,'kind':'original','outcome':r['reward'],'metrics':r['summary'].get('metrics')}),flush=True)
        else:
            r=run(design,c,root/name/f'g{c["gain"]}_{c["corner"]}_{c["temp"]}')
            row={'name':name,'kind':'app','result':r};m=r.get('metrics',{});ss=m.get('steps',[])
            print(json.dumps({'name':name,'case':c,'dc_error':m.get('dc_error_max_v'),'power':m.get('dc_power_max_w'),'settle_ns':max((x['settling_s'] or 999) for x in ss)*1e9 if ss else None,'overshoot':max(x['overshoot_fraction'] for x in ss) if ss else None,'error':r.get('analysis_error')}),flush=True)
        return row
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:rows=list(pool.map(one,jobs))
    save(root/'results.json',rows)
    print('GRID_COMPLETE',flush=True)


if __name__=='__main__':main()
