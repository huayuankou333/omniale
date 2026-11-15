"""Freeze-preserving original plus added full-matrix verification."""
import argparse,json,importlib.util
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from config import ROOT,CASE,save,digest
from native import policy,original
from application import generate,run_one,summarize

def evaluate(design,destination,name=None):
    design=Path(design).resolve();destination=Path(destination).resolve();destination.mkdir(parents=True,exist_ok=False)
    cfg=json.loads((ROOT/'contract.json').read_text());sha=digest(design)
    checked=policy(design);save(destination/'policy.json',checked)
    doc=design.parent/'DESIGN.md'
    valid_doc=doc.is_file() and all(__import__('re').search(r'^#{1,6}\s+'+section+r'\s*$',doc.read_text(),__import__('re').M) for section in cfg['required_design_sections'])
    report={'case':CASE,'submission_valid':bool(checked['exit_code']==0 and valid_doc),'submission_sha256':sha,'infrastructure_error':None}
    save(destination/'documentation_check.json',{'present':doc.is_file(),'required_sections_present':bool(valid_doc),'document_sha256':digest(doc) if doc.is_file() else None})
    if report['submission_valid']:
        try:
            old=original(design,destination/'original');report['original']=old['checks']
            if old['exit_code']!=0:raise RuntimeError('Original verifier process failed')
            save(destination/'original.json',old)
            from persistent import pool
            if len(pool().entries)<2:pool().add()
            app=destination/'application';index=generate(app)
            def one(row):
                answer=run_one(design,app,row,cfg)
                print(json.dumps({'phase':'application','id':row['id'],'complete':answer['complete'],'checks':answer['checks'],'failure':answer.get('failure')}),flush=True)
                return answer
            # Two independent sequential streams, each native process restricted
            # to the declared resources. No agent feedback after source freeze.
            with ThreadPoolExecutor(max_workers=2) as pool:rows=list(pool.map(one,index['cases']))
            report['added']=summarize(index,rows,cfg)
            infra=[r['infrastructure_error'] for r in rows if r.get('infrastructure_error')]
            if infra:report['infrastructure_error']=infra[0]
            save(destination/'application_summary.json',{'groups':report['added'],'cases':rows,'required_runs':len(index['cases']),'complete_runs':sum(r['complete'] for r in rows)})
        except Exception as exc:
            report['infrastructure_error']=str(exc)
    assert digest(design)==sha,'Frozen source changed'
    spec=importlib.util.spec_from_file_location('score',ROOT/'tools/score.py');score=importlib.util.module_from_spec(spec);spec.loader.exec_module(score)
    result=score.aggregate(cfg,report)
    result['reward']={'reward':result['task_success'],'spec_score':result['score']}
    result.update(contract_sha256=digest(ROOT/'contract.json'),frozen_sha256=sha)
    save(destination/'trusted_score_input.json',report);save(destination/'result.json',result)
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--design',required=True);p.add_argument('--out',required=True);a=p.parse_args()
    print(json.dumps(evaluate(a.design,a.out),ensure_ascii=False),flush=True)
