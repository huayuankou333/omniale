"""Check original transients and application stress points before choosing a reference."""
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import uuid
from config import ROOT,save
from original_native import evaluate
from application import simulate,check_metrics


def main():
    rows=json.loads((ROOT/'validation/sweep_05/results.json').read_text())
    good=[r for r in rows if r['loop'].get('loop_pass') and 'metrics' in r.get('app',{})]
    good.sort(key=lambda r:max(x['overshoot_fraction'] for x in r['app']['metrics']['steps']))
    selected=good[:4]
    limits=json.loads((ROOT/'contract.json').read_text())['application_limits']
    root=ROOT/'validation/shortlist';root.mkdir(parents=True,exist_ok=False)
    def one(row):
        i=row['i'];d=Path(row['path']);folder=root/f'{i:03d}'
        original=evaluate(d,folder/'original','simle-a2-candidate-'+uuid.uuid4().hex[:10])
        result={'i':i,'path':str(d),'parameters':row['parameters'],'original':original,'applications':[]}
        print(json.dumps({'i':i,'original':original['reward'],'metrics':original['summary'].get('metrics')}),flush=True)
        if original['summary'].get('official_pass'):
            cs=[]
            for corner,temp in [('tt',27),('ss',-20),('ff',85)]:
                for gain,lo,hi in [(1,.7,1.0),(4,.625,.825)]:
                    cs.append(dict(kind='tracking',corner=corner,temp=temp,gain=gain,lo=lo,hi=hi,cl_pf=6))
                cs.append(dict(kind='overload',corner=corner,temp=temp,gain=4,cl_pf=6))
            for j,c in enumerate(cs):
                a=simulate(d,c,folder/f'app_{j:02d}');a['checks']=check_metrics(c,a['metrics'],limits) if 'metrics' in a else {}
                result['applications'].append(a)
                print(json.dumps({'i':i,'case':c,'checks':a['checks'],'metrics':a.get('metrics'),'analysis_error':a.get('analysis_error')}),flush=True)
        save(folder/'result.json',result)
        return result
    with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(one,selected))
    save(root/'results.json',results)
    print('SHORTLIST_COMPLETE',flush=True)


if __name__=='__main__':main()
