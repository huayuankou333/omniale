"""Only paths and output capture adapt; the original scorer remains unchanged."""
from pathlib import Path
import json,sys
UP=Path('/opt/port-upstream')
sys.path[:0]=[str(UP/'benchmark'),str(UP/'benchmark/llm')]
import config
import score_answer

def main():
 config.sky130_lib=lambda:Path('/opt/sky130/continuous/sky130.lib.spice')
 config.ngspice=lambda:'ngspice'
 config.BUILD=Path('/logs/verifier/native')
 circuit=Path('/app/circuit.spi').read_text()
 evaluations=[];original=score_answer.evaluate
 def capture(*args,**kwargs):
  result=original(*args,**kwargs);evaluations.append(result);return result
 score_answer.evaluate=capture
 try:result=score_answer.score('T3__opamp_2stg__hard_1_gain_ugf',circuit)
 except (IndexError,ValueError,KeyError,TypeError) as exc:
  result={'outcome':'I','why':['Parser: '+str(exc)]}
 if evaluations:result['evaluation']=evaluations[-1];result['checks']=evaluations[-1].get('checks',[])
 else:result['checks']=[]
 result['limits_passed']=sum(c['pass'] for c in result['checks']);result['limits_total']=8
 result['official_pass']=result['outcome']=='P'
 out=Path('/logs/verifier');out.mkdir(parents=True,exist_ok=True)
 (out/'score.json').write_text(json.dumps(result,indent=2,default=str))
 (out/'reward.json').write_text(json.dumps({'outcome':result['outcome'],'tests_passed':result['limits_passed'],'tests_total':8,'official_pass':result['official_pass'],'qualification':'Original P/F/D/I outcome; no percentage score is defined.'}))
 print(json.dumps(result,indent=2,default=str))
if __name__=='__main__':main()
