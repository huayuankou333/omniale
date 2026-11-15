"""Aggregate trusted evaluator outcomes; this is NOT a waveform verifier.

Input: {case, submission_valid: bool, submission_sha256: str,
 infrastructure_error: null|string,
 original: [{name, status: passed|failed|blocked}],
 added: [{name, status: passed|failed|incomplete, complete: bool}]}
The runner must validate all required cases and waveform evidence before use.
"""
import argparse
import json
import re
from pathlib import Path


def aggregate(cfg, report):
    if report.get('case')!=cfg['case']:
        raise ValueError('case mismatch')
    if type(report.get('submission_valid')) is not bool:
        raise ValueError('submission_valid must be boolean from trusted checker')
    infra=report.get('infrastructure_error')
    base={'case':cfg['case'],'contract_version':cfg['version'],'task_success':0,
          'validated_waveforms_by_this_aggregator':False}
    if infra:
        if not isinstance(infra,str):
            raise ValueError('infrastructure_error must be null or a diagnostic string')
        return {**base,'status':'infra_error','score':None,'reason':infra}
    if not report['submission_valid']:
        return {**base,'status':'invalid_submission','score':0}
    digest=report.get('submission_sha256','')
    if not re.fullmatch(r'[0-9a-f]{64}',digest):
        raise ValueError('valid frozen submission hash required')
    def check_rows(key,expected,allowed):
        rows=report.get(key)
        if not isinstance(rows,list) or len(rows)!=len(expected):
            raise ValueError(f'{key}: all result categories required, including blocked/incomplete')
        if any(not isinstance(r,dict) for r in rows):
            raise ValueError(f'{key}: rows must be objects')
        names=[r.get('name') for r in rows]
        if len(names)!=len(set(names)) or set(names)!=set(expected):
            raise ValueError(f'{key}: names must exactly match contract')
        if any(r.get('status') not in allowed for r in rows):
            raise ValueError(f'{key}: unknown status')
        return rows
    orig=check_rows('original',cfg['original_checks'],{'passed','failed','blocked'})
    added=check_rows('added',cfg['added_groups'],{'passed','failed','incomplete'})
    for r in added:
        if type(r.get('complete')) is not bool:
            raise ValueError('added complete must be a trusted boolean')
        if r['status']=='passed' and not r['complete']:
            raise ValueError('incomplete evidence cannot pass')
        if r['status']=='incomplete' and r['complete']:
            raise ValueError('incomplete status contradicts complete=true')
    o=sum(r['status']=='passed' for r in orig)
    a=sum(r['status']=='passed' for r in added)
    success=int(o==len(orig) and a==len(added) and all(r['complete'] for r in added))
    return {**base,'status':'passed' if success else 'failed','task_success':success,
            'submission_sha256':digest,'original_passed':o,'original_total':len(orig),
            'added_passed':a,'added_total':len(added),
            'complete_added_evidence':all(r['complete'] for r in added),
            'score':round(100*min(o/len(orig),a/len(added)),2)}


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('report',type=Path)
    p.add_argument('--out',type=Path)
    args=p.parse_args()
    root=Path(__file__).resolve().parents[1]
    cfg=json.loads((root/'contract.json').read_text(encoding='utf-8'))
    result=aggregate(cfg,json.loads(args.report.read_text(encoding='utf-8')))
    data=json.dumps(result,indent=2,ensure_ascii=False,allow_nan=False)+'\n'
    if args.out:
        args.out.write_text(data,encoding='utf-8')
    else:
        print(data,end='')
