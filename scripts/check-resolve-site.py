"""Validate published evidence and local references. Python standard library only."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote,urlsplit
import json,hashlib,re,math

ROOT=Path(__file__).resolve().parents[1]/'docs/resolve'
def read(p):return json.loads((ROOT/p).read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
r=read('data/report.json');raw=read('files/scores.v2.1.json');manifest=read('files/media-manifest.json')
analysis=read('data/analysis.json')
assert len(analysis['errors'])>=10
assert analysis['pending_model']['status']in ('not_started_authentication_failed','preflight_passed_waiting_bridge','running','evidence_review_pending','completed')
if analysis['pending_model']['status']=='completed':
    pending=analysis['pending_model']
    actual=next(m for m in r['models'] if m['model']==pending.get('model',pending.get('requested_label')))
    assert analysis['pending_model']['score']==actual['score']
else:
    assert analysis['pending_model']['score'] is None
assert all(m['score']is None for m in analysis.get('other_requested_models_not_run',[]))
for m,seconds,source_frames,output_frames in zip(analysis['models'],[1200,2624.16],[7,112],[0,33]):
    assert math.isclose(m['mix_asr_seconds'],seconds)
    assert m['frame_counts'].get('meeting',0)==source_frames
    assert m['frame_counts'].get('output',0)==output_frames
    original=next(x for x in r['models'] if x['model']==m['model'])
    assert sha(ROOT/original['trace_url'])==m['trace_sha256']
for m in analysis['models']:
    original=next(x for x in r['models'] if x['model']==m['model'])
    assert sha(ROOT/original['trace_url'])==m['trace_sha256']
    assert math.isclose(sum(b-a for a,b in m['mix_asr_union']),m['mix_asr_seconds'])
    assert len(m['frame_observations'])==sum(m['frame_counts'].values())
assert r['score_version']=='v2.1-user-adjudication'
assert r['maxima']=={'C':50,'O':40,'E':10}
assert len(r['models'])>=2
baseline={'gpt-6-luna':38.67,'gpt-6.1-sol':83.33}
for model in r['models']:
    expected=baseline.get(model['model'],model['score'])
    assert model['score']==expected
    original=raw['models'].get(model['model'])or read(model['score_url'])
    assert model['items']==original['items']
    assert len(model['items'])==39
    assert len({i['id'] for i in model['items']})==39
    assert round(sum(i['points'] for i in model['items']),2)==expected
    for cat,maxv in r['maxima'].items():
        assert math.isclose(sum(i['weight'] for i in model['items'] if i['category']==cat),maxv)
        assert math.isclose(sum(i['points'] for i in model['items'] if i['category']==cat),model['categories'][cat])
    assert all(0<=i['points']<=i['weight'] for i in model['items'])
    if model['model']in baseline:
        assert [i['points'] for i in model['items'] if i['id'] in ['O09','O10']]==[0,0]
    else:
        assert math.isclose(model['subtitle_neutral_score'],round(model['score']-sum(i['points']for i in model['items']if i['id']in['O09','O10']),2))
        assert original['candidate_sha256_before']==original['candidate_sha256_after']
        if model.get('infrastructure_recovery'):
            recovery=read(f'records/{model["model"]}/infrastructure-recovery.json')
            assert recovery['state']['additional_attempt'] is False
            assert recovery['plan']['editorial_intervention'] is False
            assert recovery['plan']['frozen_code_and_inputs_verified'] is True
            assert recovery['state']['same_pending_tool_call']==recovery['plan']['pending_tool_call']
        evidence=read(f'records/{model["model"]}/judge-evidence-excerpts.json')
        assert evidence['excerpts'] and evidence['annotation_reference_sha256']
    trace=read(model['trace_url'])
    assert len(trace['events'])==model['tool_calls']==model['trace_events']
    for event in trace['events']:
        assert event['tool_call']>0 and event['api_request']>0
        assert event['action']==event['arguments']['action']
        for o in event['observations']:
            p=ROOT/o['src'];assert p.exists(),str(p)
            assert sha(p)==o['sha256']
            assert '/tutorial/' not in o['source'].replace('\\','/')
    assert sha(ROOT/model['project_url'])==model['original_project_sha256']
    web=next(x for x in manifest['final_outputs'] if x['model']==model['model'])
    assert web['original_sha256']==model['original_final_sha256']
    assert sha(ROOT/web['browser_file'])==web['browser_sha256']
current=read('files/scores-current.json')
assert set(current['models'])=={m['model']for m in r['models']}
for model in r['models']:
    assert current['models'][model['model']]['items']==model['items']
availability=read('files/additional-model-preflight.json')
if availability['active']['status']=='completed':
    actual=next(m for m in r['models'] if m['model']==availability['active']['model'])
    assert availability['active']['score']==actual['score']
else:
    assert availability['active']['score'] is None
assert all(m['score'] is None for m in availability['not_run'])

class References(HTMLParser):
    def __init__(self):super().__init__();self.urls=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        for key in ['href','src','poster']:
            if key in a:self.urls.append(a[key])

files=list(p for p in ROOT.rglob('*') if p.is_file());links=0;text_count=0
for p in files:
    assert p.stat().st_size<100*1024*1024,str(p)
    if p.suffix in ['.html','.css','.js','.json','.md','.txt','.py']:
        text_count+=1;text=p.read_text(encoding='utf-8')
        assert not re.search(r'\b(?:github_pat_[A-Za-z0-9_]{20,}|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,})',text),str(p)
        assert not re.search(r'[CD]:[\\/]Users[\\/]33317',text),str(p)
        if p.suffix=='.html':
            parser=References();parser.feed(text)
            for u in parser.urls:
                if urlsplit(u).scheme or u.startswith('#'):continue
                local=unquote(urlsplit(u).path)
                if local:assert (p.parent/local).exists(),(str(p),u)
                links+=1
summary={'pass':True,'models':len(r['models']),'rubric_items_each':39,'scores':[m['score']for m in r['models']],
         'tool_trace_counts':[m['trace_events']for m in r['models']],'files':len(files),'text_files':text_count,'local_html_links':links,
         'checks':['score and category recomputation','O09/O10 user adjudication','all tool events preserved','real observation frame hashes','unchanged original DRP hashes','original/browser media SHA256 links','detailed analysis references actual traces','ASR union and source/output frame counts','unstarted Opus has no score','all HTML local paths','no credential patterns or user directory paths','individual files below100MiB']}
(ROOT/'files/site-validation.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(summary,ensure_ascii=False,indent=2))
