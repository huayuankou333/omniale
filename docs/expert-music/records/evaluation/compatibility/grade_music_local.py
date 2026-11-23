from pathlib import Path
import sys,json,hashlib,subprocess
sys.stdout.reconfigure(encoding='utf8')
sys.path.insert(0,'F:/OmniALE-cases/remote-control')
from remote import connect
from music_transport import adapt, VERSION as TRANSPORT_VERSION
BASE='/data2/adminweihunj/omniale_hyk/evaluations/gpt-6.2-sol-hard-v2-20261123'
ROOT=Path('D:/omniale/case/D6教育训练与学习应用/case6e-expert-music-learning-hard-v2')
RUN=ROOT/'evaluations/gpt-6.2-sol-hard-v2-20261123'
for name in ['output','evaluation']:(RUN/name).mkdir(parents=True,exist_ok=True)
with connect() as c:
 with c.open_sftp() as s:
  with s.open(BASE+'/music/status.json') as f:state=json.load(f)
  if not state.get('finished'):raise SystemExit('Music run not finished; no scoring performed')
  for name in ['status.json','protocol.json','delivery-manifest.json']:s.get(BASE+'/music/'+name,str(RUN/name))
  for name in ['answers.json','evidence.json','README.md']:s.get(BASE+'/music/work/output/'+name,str(RUN/'output'/name))
  mf=json.loads((RUN/'delivery-manifest.json').read_text(encoding='utf8'))
  for name in ['answers.json','evidence.json','README.md']:
   row=next(x for x in mf['files'] if x['path']==name);p=RUN/'output'/name
   assert p.stat().st_size==row['bytes'] and hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256']
  original=RUN/'output/answers.json';qa=RUN/'evaluation'
  original_sha=hashlib.sha256(original.read_bytes()).hexdigest()
  raw=subprocess.run(['C:/Program Files/nodejs/node.exe',str(ROOT/'evaluator/grade_content.mjs'),'--submission',str(original),'--policy','omni_v1'],capture_output=True,text=True,encoding='utf8')
  strict={'original_answers_sha256':original_sha,'literal_submission_accepted':raw.returncode==0,'exit_code':raw.returncode,'stdout':raw.stdout,'stderr':raw.stderr,'score_if_rejected':None}
  if raw.returncode and 'Answer must be a string or null:' not in raw.stderr:raise RuntimeError(raw.stderr)
  converted,changes=adapt(json.loads(original.read_text(encoding='utf8')),json.loads((ROOT/'candidate/questions.json').read_text(encoding='utf8')))
  normalized=qa/'answers.transport-normalized.json';normalized.write_text(json.dumps(converted,ensure_ascii=False,indent=2),encoding='utf8')
  transport={'version':TRANSPORT_VERSION,'literal_original_submission_accepted':raw.returncode==0,'original_answers_sha256':original_sha,'scored_representation_sha256':hashlib.sha256(normalized.read_bytes()).hexdigest(),'changes':changes,'answer_key_or_explanations_used':False,'original_artifact_modified':False,'scorer_modified':False,'reason':'Public formats explicitly include ordered lists, bar-and-beat and beat numbers; the string-only outer validator rejects natural JSON values. This sidecar changes only presentation. Literal rejection remains separately recorded.'}
  (qa/'strict-transport-validation.json').write_text(json.dumps(strict,ensure_ascii=False,indent=2),encoding='utf8')
  (qa/'transport-normalization.json').write_text(json.dumps(transport,ensure_ascii=False,indent=2),encoding='utf8')
  reports=[]
  for policy in ['omni_v1','official_typed_exact','official_reference_exact']:
   out=RUN/'evaluation'/('content-score-'+policy+'.json')
   r=subprocess.run(['C:/Program Files/nodejs/node.exe',str(ROOT/'evaluator/grade_content.mjs'),'--submission',str(normalized),'--policy',policy,'--out',str(out)],capture_output=True,text=True,encoding='utf8')
   if r.returncode:raise RuntimeError(r.stderr)
   data=json.loads(out.read_text(encoding='utf8'));data['answers_sha256']=original_sha;data['scored_representation_sha256']=transport['scored_representation_sha256'];data['transport_normalization']=transport;out.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8');reports.append(data)
  try:s.mkdir(BASE+'/music/evaluation')
  except OSError:pass
  for p in [*qa.glob('content-score-*.json'),qa/'strict-transport-validation.json',qa/'transport-normalization.json',normalized]:s.put(str(p),BASE+'/music/evaluation/'+p.name)
  assert hashlib.sha256(original.read_bytes()).hexdigest()==original_sha
print(json.dumps({'case':'music','local_run':str(RUN),'policies':[{'policy':r['policy'],'score':r['score'],'passed':r['passed']} for r in reports]},ensure_ascii=False))
