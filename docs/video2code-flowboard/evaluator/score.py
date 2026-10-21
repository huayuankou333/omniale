"""Strict calculator for an adjudicated evidence report; never grades source code."""
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parent.parent
def score(report,evidence_root):
 rubric=json.loads((ROOT/'evaluator/checklist.json').read_text(encoding='utf8'))
 if report.get('trial_status')!='valid':return {'score':None,'status':'infrastructure_or_incomplete_trial'}
 totals={k:0 for k in rubric['weights']};missing=[]
 def valid_evidence(entry):
  if not isinstance(entry,dict) or not entry.get('observed') or not entry.get('evidence'):return False
  for name in entry['evidence']:
   p=(evidence_root/name).resolve()
   if not p.is_relative_to(evidence_root.resolve()) or not p.is_file():return False
  return True
 for item in rubric['items']:
  if item['scoring']=='binary_probes':
   for probe in item['probes']:
    e=report.get('functional',{}).get(probe['id'])
    if not valid_evidence(e) or type(e.get('pass')) is not bool:missing.append(probe['id']);continue
    totals[item['category']]+=probe['weight']*int(e['pass'])
  else:
   subtotal=0
   for state in item['reference_states']:
    e=report.get('visual',{}).get(item['id'],{}).get(state)
    if not valid_evidence(e) or e.get('score') not in item['allowed']:missing.append(item['id']+'/'+state);continue
    subtotal+=e['score']/len(item['reference_states'])*item['weight']
   totals[item['category']]+=subtotal
 if missing:return {'score':None,'status':'needs_evidence','missing_or_invalid':missing,'partial_totals_not_a_score':totals}
 return {'score':round(sum(totals.values()),2),'status':'scored','categories':{k:round(v,3) for k,v in totals.items()},'rubric_version':rubric['version']}
if __name__=='__main__':
 p=Path(sys.argv[1]);r=json.loads(p.read_text(encoding='utf8'));print(json.dumps(score(r,p.parent),ensure_ascii=False,indent=2))
