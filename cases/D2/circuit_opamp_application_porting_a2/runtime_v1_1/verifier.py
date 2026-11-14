"""Conjunctive original signoff and application verification on the frozen DUT."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import uuid
from config import ROOT,save,digest
from original_native import evaluate as evaluate_original
from native import policy
from application import cases,simulate,check_metrics


def evaluate(design,destination,name=None):
    design=Path(design).resolve();destination=Path(destination).resolve();destination.mkdir(parents=True,exist_ok=False)
    sha=digest(design);contract=json.loads((ROOT/'contract.json').read_text());limits=contract['application_limits']
    gate=policy(design,'simle-a2-policy-'+uuid.uuid4().hex[:10]);save(destination/'policy.json',gate)
    if gate['exit_code']:
        result={'reward':{'reward':0,'spec_score':0},'summary':{'valid_submission':False,'full_pass':False,'simulation_complete':False,'native_run_count':0},'frozen_sha256':sha}
        save(destination/'result.json',result);return result
    original=evaluate_original(design,destination/'original','simle-a2-original-'+uuid.uuid4().hex[:10])
    grid=cases()
    def one(item):
        i,c=item
        row=simulate(design,c,destination/'application'/f'{i:03d}_{c["kind"]}_{c["corner"]}_{c["temp"]}_g{c["gain"]}_c{c["cl_pf"]}')
        row['checks']=check_metrics(c,row['metrics'],limits) if 'metrics' in row else {}
        print(json.dumps({'application_case':i,'case':c,'checks':row['checks'],'exit_code':row['execution']['exit_code'],'wall_seconds':row['execution']['wall_seconds']}),flush=True)
        return row
    with ThreadPoolExecutor(max_workers=2) as pool:rows=list(pool.map(one,enumerate(grid)))
    groups={k:True for k in ['application_range_and_loading','application_power','application_tracking','application_stability','overload_recovery']}
    for row in rows:
        relevant=['overload_recovery'] if row['case']['kind']=='overload' else [k for k in groups if k!='overload_recovery']
        for key in relevant:groups[key] &= row['checks'].get(key,False)
    original_count=original['summary'].get('limits_passed',0);original_pass=original['summary'].get('official_pass',False)
    original_errors=original['summary'].get('evaluation',{}).get('errors',[])
    complete=original['exit_code']==0 and not original_errors and all('metrics' in r for r in rows)
    score=100*min(original_count/8,sum(groups.values())/len(groups))
    summary={'contract_version':contract['version'],'valid_submission':True,'full_pass':bool(original_pass and all(groups.values()) and complete),
             'spec_score':score,'original_outcome':original['summary'].get('outcome'),'original_pass':original_pass,'original_passed':original_count,'original_total':8,
             'added_checks':{k:{'pass':bool(v)} for k,v in groups.items()},'added_passed':sum(groups.values()),'added_total':len(groups),
             'original':original,'cases':rows,'simulation_complete':complete,'native_run_count':2+len(rows),
             'frozen_sha256':sha,'contract_sha256':digest(ROOT/'contract.json')}
    assert digest(design)==sha,'Frozen design changed during evaluation'
    result={'reward':{'reward':int(summary['full_pass']),'spec_score':score},'summary':summary,'frozen_sha256':sha}
    save(destination/'result.json',result)
    return result


def main():
    p=argparse.ArgumentParser();p.add_argument('--design',required=True);p.add_argument('--out',required=True);args=p.parse_args()
    r=evaluate(args.design,args.out);print(json.dumps({'reward':r['reward'],'summary':{k:v for k,v in r['summary'].items() if k not in ['original','cases']}}),flush=True)


if __name__=='__main__':main()
