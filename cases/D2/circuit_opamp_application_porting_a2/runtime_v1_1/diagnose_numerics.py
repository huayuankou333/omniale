"""Pre-freeze numeric diagnostics; all attempts retained."""
import json
from concurrent.futures import ThreadPoolExecutor
from config import ROOT,save
from application import simulate,check_metrics

def main():
    limits=json.loads((ROOT/'contract.json').read_text())['application_limits']
    jobs=[(cl,step) for cl in [1,3] for step in ['50p','25p']]
    def one(job):
        cl,step=job
        c=dict(kind='tracking',corner='tt',temp=-20,gain=1,lo=.7,hi=1.0,cl_pf=cl)
        r=simulate(ROOT/'controls/reference.spi',c,ROOT/f'validation/numeric_diagnosis/c{cl}_{step}',step)
        if 'metrics' in r:r['checks']=check_metrics(c,r['metrics'],limits)
        print(json.dumps({'cl':cl,'step':step,**r}),flush=True)
        return r
    with ThreadPoolExecutor(max_workers=2) as pool:rows=list(pool.map(one,jobs))
    save(ROOT/'validation/numeric_diagnosis/results.json',rows)

if __name__=='__main__':main()
