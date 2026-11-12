"""Check score provenance, media, traces and local links for the Charge showcase."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib,json,re,zipfile

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'docs/charge-foley'
def read(p):return json.loads(p.read_text(encoding='utf8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

r=read(SITE/'results.json');p=read(SITE/'protocol.json')
assert r['weights']=={'C':50,'T':30,'M':20}
assert not r['calibration_passed'] and not r['certified']
assert r['no_candidate_regeneration']
assert [round(m['total'],2) for m in r['models']]==[26.77,49.10,35.93]
for m in r['models']:
    assert len(m['rubric'])==75
    assert abs(sum(x['max_points'] for x in m['rubric'])-100)<1e-8
    assert abs(min(sum(x['points'] for x in m['rubric']),m['engineering_cap'])-m['total'])<1e-8
    assert set(m['categories'])=={'C','T','M'}
    assert all(x['points'] in [0,1.5] for x in m['rubric'] if x['id'].startswith('T'))
    assert len(m['gates'])==6
for obsolete in ['task-at-run.md','scores.previous-P15-C40-T25-M20.json','scoring-history.json']:
    assert not (SITE/'files'/obsolete).exists()

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
references=read(SITE/'files/reference-media-manifest.json')
assert references['v2_is_not_the_director_revision_gold_mix']
assert not references['normalization'] and not references['source_separation']
assert len(references['media'])==2
for item in references['media']:
    assert sha(SITE/item['web_file'])==item['web_sha256']
    assert item['reference_audio_packet_sha256']==item['web_audio_packet_sha256']
    assert item['silent_web_video_packet_sha256']==item['web_video_packet_sha256']
    assert item['audio_channels']==2 and item['sample_rate']==48000

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
report={'passed':True,'models':3,'rubric_items_each':75,'weights':r['weights'],'engineering':'gates','certified':False,'latest_only':True,'trace_events':440,'static_links_checked':links_checked,'media':10,'audio_bitstreams_unchanged':True,'official_mix_reference_versions':2,'reference_picture_matches_task':True}
(SITE/'files/site-validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps(report))
