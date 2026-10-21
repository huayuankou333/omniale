"""Evidence-validated, model-identity-blind checklist aggregation. No API calls."""
from pathlib import Path
import argparse, json, hashlib, uuid, copy
from contextlib import contextmanager

ROOT=Path(__file__).resolve().parents[1]
KINDS={'candidate_screenshot','candidate_video','execution_log','browser_log'}
def read(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def digest(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
@contextmanager
def fixture_dir():
    base=ROOT/'evaluator'/('scorer-selftest-'+uuid.uuid4().hex)
    base.mkdir()
    try: yield base
    finally:
        # Only this function's exact test file and newly created empty folder.
        assert base.resolve().parent==(ROOT/'evaluator').resolve()
        (base/'evidence.txt').unlink(missing_ok=True)
        base.rmdir()
def requirements(checklist):
    out={}
    assert checklist['total']==100 and sum(i['weight'] for i in checklist['items'])==100
    for group in checklist['items']:
        assert group['weight']>0 and group['assertions']
        for a in group['assertions']:
            assert a['id'] not in out, 'duplicate assertion in checklist'
            out[a['id']]={**a,'weight':group['weight']/len(group['assertions']),'category':group['category']}
    return out
def verify_evidence(manifest,base):
    assert isinstance(manifest['run_id'],str) and manifest['run_id']
    assert len(manifest['candidate_hash'])==64 and all(c in '0123456789abcdef' for c in manifest['candidate_hash'])
    for id,a in manifest['artifacts'].items():
        assert a['kind'] in KINDS, 'reference/source material cannot prove candidate behavior'
        p=(base/a['path']).resolve()
        assert p.is_relative_to(base.resolve()), 'evidence path escapes its directory'
        assert p.is_file() and digest(p)==a['sha256'], f'evidence hash mismatch: {id}'
def judge_rows(judge,manifest,req):
    assert judge['run_id']==manifest['run_id'] and judge['candidate_hash']==manifest['candidate_hash'], 'wrong candidate/run'
    assert isinstance(judge['judge_model'],str) and judge['judge_model'].strip()
    rows={}
    for row in judge['items']:
        id=row['id']; assert id in req and id not in rows, 'unknown/duplicate assertion'
        assert isinstance(row.get('reason'),str) and row['reason'].strip(), 'reason required'
        assert isinstance(row['evidence'],list)
        assert all(e in manifest['artifacts'] for e in row['evidence']), 'unknown evidence'
        assert row['verdict'] in {'scored','unjudgeable'}
        if row['verdict']=='unjudgeable': assert row['credit'] is None
        else:
            allowed={0,1} if req[id]['scale']=='binary' else {0,.25,.5,.75,1}
            assert type(row['credit']) in {int,float} and row['credit'] in allowed, 'invalid credit'
            assert row['evidence'], 'scored assertion needs actual candidate evidence'
        rows[id]=row
    assert rows.keys()==req.keys(), 'missing assertion(s)'
    return rows
def aggregate(checklist,manifest,base,judges,adjudication=None):
    req=requirements(checklist)
    assert manifest['trial_status'] in {'valid','infrastructure_error'}, 'unsupported trial status'
    if manifest['trial_status']=='infrastructure_error':
        return {'status':'infrastructure_error','score':None,'denominator':100,'run_id':manifest['run_id']}
    verify_evidence(manifest,base)
    assert len(judges)==2, 'exactly two independent judges required'
    assert judges[0]['judge_model']!=judges[1]['judge_model'], 'distinct frozen judge models required'
    rows=[judge_rows(j,manifest,req) for j in judges]
    resolutions={}
    if adjudication:
        assert adjudication['run_id']==manifest['run_id'] and adjudication['candidate_hash']==manifest['candidate_hash']
        assert adjudication.get('reviewer'), 'named adjudicator required'
        for r in adjudication['items']:
            assert r['id'] in req and r['id'] not in resolutions
            assert r['evidence'] and all(e in manifest['artifacts'] for e in r['evidence'])
            allowed={0,1} if req[r['id']]['scale']=='binary' else {0,.25,.5,.75,1}
            assert type(r['credit']) in {int,float} and r['credit'] in allowed and r.get('reason')
            resolutions[r['id']]=r
    scores=[];unresolved=[];sub={}
    for id,a in req.items():
        left,right=(r[id] for r in rows)
        missing=left['verdict']=='unjudgeable' or right['verdict']=='unjudgeable'
        disagreement=not missing and abs(left['credit']-right['credit'])>(0 if a['scale']=='binary' else .25)
        if id in resolutions: credit=resolutions[id]['credit'];status='adjudicated'
        elif missing or disagreement:
            unresolved.append({'id':id,'reason':'missing_evidence' if missing else 'judge_disagreement'});continue
        else: credit=(left['credit']+right['credit'])/2;status='agreed'
        points=credit*a['weight'];sub[a['category']]=sub.get(a['category'],0)+points
        scores.append({'id':id,'credit':credit,'weight':a['weight'],'points':points,'status':status})
    return {'run_id':manifest['run_id'],'status':'needs_adjudication' if unresolved else 'final',
      'score':None if unresolved else round(sum(r['points'] for r in scores),2),'denominator':100,
      'adjudicated_weight':round(sum(r['weight'] for r in scores),5),'unresolved':unresolved,
      'categories':{k:round(v,2) for k,v in sub.items()},'assertions':scores,
      'note':'Partial category points are not a renormalized final score.'}

def self_test():
    checklist=read(ROOT/'evaluator/checklist.json');req=requirements(checklist)
    with fixture_dir() as d:
        base=Path(d);(base/'evidence.txt').write_text('SCORER UNIT TEST ONLY; NOT A MODEL RUN')
        m={'run_id':'synthetic-self-test','candidate_hash':'0'*64,'trial_status':'valid','artifacts':{'e':{'path':'evidence.txt','sha256':digest(base/'evidence.txt'),'kind':'execution_log'}}}
        j={'run_id':m['run_id'],'candidate_hash':m['candidate_hash'],'judge_model':'test-A','items':[{'id':id,'verdict':'scored','credit':1,'evidence':['e'],'reason':'synthetic aggregation fixture'} for id in req]}
        k=copy.deepcopy(j);k['judge_model']='test-B'
        assert aggregate(checklist,m,base,[j,k])['score']==100
        z=copy.deepcopy(j)
        for r in z['items']:r['credit']=0
        zz=copy.deepcopy(z);zz['judge_model']='test-B'
        assert aggregate(checklist,m,base,[z,zz])['score']==0
        k['items'][0]['credit']=0
        assert aggregate(checklist,m,base,[j,k])['status']=='needs_adjudication'
        k['items'][0].update(verdict='unjudgeable',credit=None,evidence=[])
        assert aggregate(checklist,m,base,[j,k])['score'] is None
        infra=copy.deepcopy(m);infra['trial_status']='infrastructure_error'
        assert aggregate(checklist,infra,base,[])['score'] is None
        tests=0
        for mutate in [lambda x:x['items'].append(copy.deepcopy(x['items'][0])),lambda x:x.update(run_id='wrong'),lambda x:x['items'][0].update(credit=.5),lambda x:x['items'][0].update(evidence=[])]:
            bad=copy.deepcopy(j);mutate(bad)
            try: judge_rows(bad,m,req)
            except AssertionError: tests+=1
        assert tests==4
        for newpath in ['../escape.txt','missing.txt']:
            bad=copy.deepcopy(m);bad['artifacts']['e']['path']=newpath
            try: verify_evidence(bad,base)
            except AssertionError:tests+=1
        assert tests==6
    return {'pass':True,'assertions':len(req),'tests':['all-pass aggregation 100 (synthetic)','all-fail aggregation 0 (synthetic)','binary disagreement','missing evidence','infra N/A','duplicate/missing/run/credit/evidence constraints','path/hash validation'],'is_model_result':False}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--self-test',action='store_true');p.add_argument('--manifest');p.add_argument('--judges',nargs=2);p.add_argument('--adjudication');p.add_argument('--out');args=p.parse_args()
    if args.self_test:result=self_test()
    else:
        assert args.manifest and args.judges, '--manifest and --judges required'
        result=aggregate(read(ROOT/'evaluator/checklist.json'),read(args.manifest),Path(args.manifest).resolve().parent,[read(x) for x in args.judges],read(args.adjudication) if args.adjudication else None)
    value=json.dumps(result,ensure_ascii=False,indent=2)
    if args.out:Path(args.out).write_text(value+'\n',encoding='utf8')
    print(value)
