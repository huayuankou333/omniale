"""Pinned native execution and independent task-specific signoff."""
import os,json,subprocess,time
from pathlib import Path
from config import ROOT,PROFILE,BASE_IMAGE,VERIFIER_IMAGE,save,digest

def capture(cmd,timeout=180):
 started=time.monotonic()
 try:
  p=subprocess.run(cmd,capture_output=True,text=True,errors='replace',timeout=timeout)
  return dict(exit_code=p.returncode,stdout=p.stdout,stderr=p.stderr,wall_seconds=round(time.monotonic()-started,3))
 except subprocess.TimeoutExpired as exc:
  if cmd[:2]==['docker','run'] and '--name' in cmd:
   name=cmd[cmd.index('--name')+1]
   if name.startswith('simle-'):subprocess.run(['docker','rm','-f',name],capture_output=True,timeout=20)
  def text(v):return v.decode(errors='replace') if isinstance(v,bytes) else v or ''
  return dict(exit_code=124,stdout=text(exc.stdout),stderr=text(exc.stderr)+'\nProcess timed out',wall_seconds=round(time.monotonic()-started,3))

def flags(name,uid=None):
 result=['docker','run','--rm','--name',name,'--network','none','--cpus','2','--memory','2g','--pids-limit','128','--cap-drop','ALL','--security-opt','no-new-privileges','-e','OMP_NUM_THREADS=1','-e','OPENBLAS_NUM_THREADS=1']
 if uid is not None:result+=['--user',f'{uid}:{os.getgid()}','--read-only','--tmpfs','/tmp:rw,nosuid,size=256m']
 return result

def policy(circuit,name):
 cmd=flags(name,os.getuid())+['-v',f'{Path(circuit).resolve()}:/app/circuit.spi:ro','-v',f'{ROOT/"public_policy"}:/opt/simulationle-policy:ro',BASE_IMAGE,'python3','/opt/simulationle-policy/check.py','/app/circuit.spi']
 return capture(cmd,30)

def evaluate(circuit,destination,name):
 destination=Path(destination).resolve();destination.mkdir(parents=True,exist_ok=True)
 logs=destination/'logs';logs.mkdir(exist_ok=True);logs.chmod(0o777)
 circuit=Path(circuit).resolve();before=digest(circuit)
 cmd=flags(name)+['-v',f'{circuit}:/app/circuit.spi:ro','-v',f'{logs}:/logs/verifier',VERIFIER_IMAGE]
 cmd+=['python3','/opt/trusted/port_worker.py'] if PROFILE['kind']=='port' else ['sh','/tests/test.sh']
 result=capture(cmd,1800)
 (destination/'console.log').write_text(result['stdout']+'\n'+result['stderr'])
 assert digest(circuit)==before,'Frozen source changed'
 restored=capture(flags(name+'-ownership')+['--cap-add','CHOWN','-v',f'{destination}:/output',BASE_IMAGE,'chown','-R',f'{os.getuid()}:{os.getgid()}','/output'],30)
 if restored['exit_code']:raise RuntimeError(restored['stderr'])
 save(destination/'execution.json',result)
 reward=json.loads((logs/'reward.json').read_text()) if (logs/'reward.json').exists() else {}
 if not reward:raise RuntimeError('Verifier did not produce reward; inspect console before any rerun')
 if PROFILE['kind']=='port':summary=json.loads((logs/'score.json').read_text())
 else:
  summary=json.loads((logs/'new-ctrf.json').read_text()) if (logs/'new-ctrf.json').exists() else {}
 info=dict(reward=reward,summary=summary,exit_code=result['exit_code'],wall_seconds=result['wall_seconds'],frozen_sha256=before)
 save(destination/'result.json',info)
 return info
