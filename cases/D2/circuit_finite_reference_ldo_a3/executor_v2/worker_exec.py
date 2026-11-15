"""Run inside a persistent native sandbox; timeout measures the solver itself."""
import argparse,json,subprocess,time
p=argparse.ArgumentParser();p.add_argument('--timeout',type=int,required=True);p.add_argument('--cwd',required=True);p.add_argument('command',nargs=argparse.REMAINDER);a=p.parse_args()
cmd=a.command[1:] if a.command[:1]==['--'] else a.command
t=time.monotonic()
try:
    r=subprocess.run(cmd,cwd=a.cwd,capture_output=True,text=True,errors='replace',timeout=a.timeout)
    result={'exit_code':r.returncode,'stdout':r.stdout,'stderr':r.stderr}
except subprocess.TimeoutExpired as exc:
    def text(v):return v.decode(errors='replace') if isinstance(v,bytes) else v or ''
    result={'exit_code':124,'stdout':text(exc.stdout),'stderr':text(exc.stderr)+'\nNative solver execution timed out'}
result['wall_seconds']=round(time.monotonic()-t,3)
print(json.dumps(result),flush=True)
