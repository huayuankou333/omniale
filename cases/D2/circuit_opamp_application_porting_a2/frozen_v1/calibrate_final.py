"""Pre-freeze negative controls and timestep convergence, never model feedback."""
import argparse,json,uuid
from concurrent.futures import ThreadPoolExecutor
from config import ROOT,save
from application import cases,simulate,check_metrics
from original_native import evaluate

def controls():
    limits=json.loads((ROOT/'contract.json').read_text())['application_limits'];rows=[]
    for name,indices in [('original_golden',[9]),('nominal_only',[61]),('naive_migration',[9])]:
        design=ROOT/f'controls/{name}.spi';folder=ROOT/'validation/negative_controls'/name
        original=evaluate(design,folder/'original','simle-a2-control-'+uuid.uuid4().hex[:8])
        row={'name':name,'original':original,'applications':[]}
        for idx in indices:
            c=cases()[idx];r=simulate(design,c,folder/f'application_{idx:03d}')
            r['checks']=check_metrics(c,r['metrics'],limits) if 'metrics' in r else {}
            row['applications'].append(r)
        rows.append(row);save(folder/'result.json',row)
        print(json.dumps({'control':name,'original':original['reward'],'app_checks':[r['checks'] for r in row['applications']]}),flush=True)
    save(ROOT/'validation/negative_controls/results.json',rows)

def numerics():
    limits=json.loads((ROOT/'contract.json').read_text())['application_limits']
    def one(job):
        idx,step=job;c=cases()[idx]
        r=simulate(ROOT/'controls/reference.spi',c,ROOT/f'validation/numerics_grid/{idx:03d}_{step}',step)
        r['checks']=check_metrics(c,r['metrics'],limits) if 'metrics' in r else {}
        save(ROOT/f'validation/numerics_grid/{idx:03d}_{step}/checked.json',r)
        print(json.dumps({'numeric_case':idx,'step':step,'checks':r['checks']}),flush=True)
        return {'index':idx,'step':step,'result':r}
    with ThreadPoolExecutor(max_workers=2) as pool:rows=list(pool.map(one,[(i,s) for i in [0,9,61,62] for s in ['50p','25p']]))
    save(ROOT/'validation/numerics_grid/results.json',rows)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('mode',choices=['controls','numerics']);a=p.parse_args()
    controls() if a.mode=='controls' else numerics()
