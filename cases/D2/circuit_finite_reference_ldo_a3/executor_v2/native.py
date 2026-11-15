"""Pinned native execution; agent has no host socket or evaluator access."""
import os,json,subprocess,time,uuid
from pathlib import Path
from config import ROOT,CASE,BASE_IMAGE,VERIFIER_IMAGE,save,digest

def capture(cmd,timeout=180):
    started=time.monotonic()
    try:
        p=subprocess.run(cmd,capture_output=True,text=True,errors='replace',timeout=timeout)
        return dict(exit_code=p.returncode,stdout=p.stdout,stderr=p.stderr,wall_seconds=round(time.monotonic()-started,3))
    except subprocess.TimeoutExpired as exc:
        if cmd[:2]==['docker','run'] and '--name' in cmd:
            subprocess.run(['docker','rm','-f',cmd[cmd.index('--name')+1]],capture_output=True,timeout=20)
        def dec(x):return x.decode(errors='replace') if isinstance(x,bytes) else x or ''
        return dict(exit_code=124,stdout=dec(exc.stdout),stderr=dec(exc.stderr)+'\nProcess timed out',wall_seconds=round(time.monotonic()-started,3))

def flags(name,uid=None):
    args=['docker','run','--rm','--name',name,'--network','none','--cpus','2','--memory','4g','--pids-limit','128','--cap-drop','ALL','--security-opt','no-new-privileges','-e','OMP_NUM_THREADS=1','-e','OPENBLAS_NUM_THREADS=1']
    if uid is not None:args+=['--user',f'{uid}:{os.getgid()}','--read-only','--tmpfs','/tmp:rw,nosuid,size=512m']
    return args

def policy(circuit,name=None):
    return capture(['python3',str(ROOT/'task_policy.py'),str(Path(circuit).resolve())],30)

def original(circuit,destination):
    destination=Path(destination);destination.mkdir(parents=True,exist_ok=True)
    logs=destination/'logs';logs.mkdir(exist_ok=True);logs.chmod(0o777)
    image=VERIFIER_IMAGE
    from persistent import run_original
    r=run_original(circuit,destination)
    (destination/'console.log').write_text(r['stdout']+'\n'+r['stderr'])
    save(destination/'execution.json',r)
    ctrf=logs/'new-ctrf.json'
    if not ctrf.is_file():
        raise RuntimeError('Original verifier produced no detailed result: '+r['stderr'][-200:])
    raw=json.loads(ctrf.read_text()); tests=raw['results']['tests']
    checks=[{'name':t['name'],'status':'passed' if t['status']=='passed' else 'blocked' if t.get('message','').startswith('blocked:') else 'failed','message':t.get('message','')} for t in tests]
    return {'checks':checks,'exit_code':r['exit_code'],'wall_seconds':r['wall_seconds'],'frozen_sha256':digest(circuit),'native_processes':None}
