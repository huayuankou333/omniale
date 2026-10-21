from pathlib import Path
import json,hashlib,re
ROOT=Path(__file__).resolve().parents[1]
def load(p):return json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def check():
    source=load('provenance.json');c=load('evaluator/checklist.json');protocol=load('protocol.json');r=load('results.json')
    video=ROOT/'public/inputs/demo.mp4'
    assert sha(video)==source['source_sha256']==source['source_lfs_sha256']
    assert video.stat().st_size==source['source_bytes']
    assert source['audio']['decoded_peak']==0 and protocol['budgets']['asr_seconds']==0
    actual=sorted(p.relative_to(ROOT).as_posix() for p in (ROOT/'public').rglob('*') if p.is_file())
    assert actual==sorted(source['candidate_inputs']), 'unexpected candidate input'
    assert sum(i['weight'] for i in c['items'])==100
    cats={k:sum(i['weight'] for i in c['items'] if i['category']==k) for k in ['execution','interaction','visual','usability']}
    assert cats=={'execution':10,'interaction':60,'visual':25,'usability':5}
    ids=[a['id'] for i in c['items'] for a in i['assertions']];assert len(ids)==len(set(ids))==43
    scenarios=load('evaluator/scenarios.json')['scenarios'];sids={s['id'] for s in scenarios}
    for i in c['items']:
        assert i['scenario'] in sids
        a=i['evidence_anchor'];assert (ROOT/a['source']).is_file()
        if 'start_seconds' in a:assert 0<=a['start_seconds']<a['end_seconds']<=source['duration_seconds']
    for frame in load('evaluator/references/index.json'):
        assert (ROOT/'evaluator/references'/frame['path']).is_file()
        assert abs(frame['requested']-frame['actual'])<=1/30
    assert protocol['budgets']['model_logical_turns']==15 and protocol['raw_candidate_image_video_inputs'] is False
    assert len(r['models'])==4 and r['all_below_80'] is None and all(m['score'] is None and m['status']=='not_run' for m in r['models'])
    checked=0
    for p in ROOT.rglob('*'):
        if not p.is_file() or p.suffix not in {'.md','.json','.py','.js','.html','.css','.txt'}:continue
        txt=p.read_text(encoding='utf-8-sig')
        assert not re.search(r'\b(?:sk-[A-Za-z0-9_-]{20,}|github_pat_[A-Za-z0-9_]{20,}|ghp_[A-Za-z0-9]{20,})',txt),f'credential-like content: {p}'
        checked+=1
        if p.suffix=='.html':
            for target in re.findall(r'(?:src|href)="([^"]+)"',txt):
                if target.startswith(('http:','https:','#','data:')):continue
                resolved=(p.parent/target.split('#')[0]).resolve()
                if resolved==ROOT/'validation.json':continue  # This run creates that report.
                assert resolved.is_file(),f'broken local link {target}'
    return {'pass':True,'source_sha256':sha(video),'candidate_files':actual,'items':len(c['items']),'assertions':len(ids),'weights':cats,'reference_frames':42,'text_files_scanned':checked,'model_trials':0,'status':'design_validation_only','limitations':['No original-site/reference-app replay performed','No coding-agent runner integration test','No model or judge calls performed']}
if __name__=='__main__':
    result=check();(ROOT/'validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(json.dumps(result,ensure_ascii=False,indent=2))
