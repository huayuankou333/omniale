"""Check score provenance, media, traces and local links for the Charge showcase."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib,json,re,zipfile

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'docs/charge-foley'
def read(p):return json.loads(p.read_text(encoding='utf8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

r=read(SITE/'results.json');p=read(SITE/'protocol.json')
assert r['weights']==p['weights']=={'P':10,'C':50,'T':30,'M':10}
assert not r['calibration_passed'] and not r['certified']
assert r['reweighting_only'] and r['new_model_or_judge_calls']==0
old=read(SITE/'files/scores.previous-P15-C40-T25-M20.json')
scales={'P':2/3,'C':1.25,'T':1.2,'M':.5}
for m,prior in zip(r['models'],old['models']):
    assert m['model']==prior['model'] and len(m['rubric'])==24
    assert abs(sum(x['max_points'] for x in m['rubric'])-100)<1e-8
    assert abs(sum(x['points'] for x in m['rubric'])-m['total'])<1e-8
    for x,y in zip(m['rubric'],prior['rubric']):
        assert x['id']==y['id']
        assert abs(x['points']-y['points']*scales[x['id'][0]])<1e-8
    assert m['uncertain_events']==prior['uncertain_events']
    assert m['events']==prior['events']
    assert m['mix']==prior['mix']

class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[]
    def handle_starttag(self,tag,attrs):
        for key,value in attrs:
            if key in ['href','src','poster'] and value:self.links.append(value)

links_checked=0
for path in SITE.rglob('*.html'):
    parser=Links();parser.feed(path.read_text(encoding='utf8'))
    for url in parser.links:
        if url.startswith(('http:','https:','data:','#','mailto:')):continue
        url=url.split('#')[0].split('?')[0]
        if not url or url.startswith('../'):continue
        assert (path.parent/url).exists(),(path,url)
        links_checked+=1
for item in read(SITE/'files/media-manifest.json'):
    media=SITE/item['web_file'];assert sha(media)==item['web_sha256']
    assert item['source_audio_packet_sha256']==item['web_audio_packet_sha256']
    assert media.stat().st_size<100*1024*1024

total=0
for slug,count in [('luna',45),('sol',95),('deepseek',300)]:
    trace=read(SITE/'records'/slug/'trace.json');assert len(trace['events'])==count;total+=count
    assert not trace['missing_observations']
    for event in trace['events']:
        for img in event.get('result',{}).get('images',[]):
            if img.get('public_url'):assert (SITE/img['public_url']).is_file()
    with zipfile.ZipFile(SITE/'records'/slug/'project-and-manifests.zip') as z:
        assert z.testzip() is None
        assert 'v1/reaper/session.rpp' in z.namelist() and 'v2/shotcut/project.mlt' in z.namelist()
assert total==440
for path in SITE.rglob('*'):
    if path.is_file() and path.suffix in ['.json','.html','.js','.md','.txt','.css']:
        text=path.read_text(encoding='utf8')
        assert not re.search(r'(?<![A-Za-z0-9_])(?:github_pat_[A-Za-z0-9_]{30,}|sk-[A-Za-z0-9_.-]{18,}|hf_[A-Za-z0-9]{20,})',text),path
report={'passed':True,'models':3,'rubric_items_each':24,'weights':r['weights'],'original_judgments_unchanged':True,'trace_events':440,'static_links_checked':links_checked,'media':8,'audio_bitstreams_unchanged':True}
(SITE/'files/site-validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps(report))
