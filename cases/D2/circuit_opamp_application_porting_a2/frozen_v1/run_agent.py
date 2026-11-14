"""Real API agents with shell access, native simulation and isolated signoff."""
import argparse
import base64
from datetime import datetime,timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
import uuid

from api_client import call,models
from broker import Broker,canonical
from config import ROOT,AGENT_IMAGE,BASE_IMAGE,VERIFIER_IMAGE,MODELS,LIMITS,BASE_URL,save,digest
from native import capture,policy
from verifier import evaluate

def function(name,description,properties):
    return {'type':'function','name':name,'description':description,'strict':True,
            'parameters':{'type':'object','properties':properties,'required':list(properties),'additionalProperties':False}}

TOOLS=[
 function('terminal','Execute your own shell command inside the persistent isolated Linux design container. Edit /app/circuit.spi and write/run your own Python analyses and testbenches under /app/experiments. ngspice -b runs the real pinned simulator through the audited budget gateway. Output is truncated in this tool response; full logs are retained.',
          {'command':{'type':'string'},'timeout_seconds':{'type':'integer','minimum':1,'maximum':180}}),
 function('read_image','Read an image you generated under /app, for visual analysis of actual simulation outputs.',{'path':{'type':'string'}}),
 function('finish','Freeze the circuit.spi currently on disk and end development. Report your actual measurements and limitations honestly.',{'summary':{'type':'string'}})
]

INSTRUCTIONS='''You are migrating a transistor-level op-amp and its sensor application to 1.2 V.
Read /app/TASK.md, /app/ORIGINAL_TASK.md, /app/contract.json and /app/PORTING_RUNTIME.md.
The original eight AnalogPortBench requirements are mandatory and unchanged.
The initial /app/circuit.spi is a mechanical translation of the supplied 1.8 V
source topology. Diagnose it and redesign sizes, bias, compensation or topology.
Only the last /app/circuit.spi is graded, in the original testbench AND in the
fixed application interfaces. You may not modify the application or its sources.
Use your persistent shell, Python, NumPy, matplotlib and the fixed SKY130 PDK.
Write your own experiments under /app/experiments. ngspice -b TESTBENCH [-o LOG]
[-r RAW] invokes the real audited simulator; store output under /app/experiments.
Each native batch invocation counts once, including invocations in a shell batch.
A batch may contain multiple analyses of the same DUT. Device/model definitions
belong only in circuit.spi. In-process DUT alterations and gateway bypasses are
outside the contract; independent external test sources may be altered.
Budget: 48 model replies, 120 tools, 160 native batches, 131072 output tokens,
32768 output tokens per reply, medium reasoning, 7200 seconds wall time including
API waits. There is no three-candidate cap. Two CPUs and 2 GiB memory per container.
Final independent verification is separate from the development budget. The
reference solution, verifier, Internet, Docker socket and API key are unavailable.
Choose your experiments and call finish with actual measurements and limitations.
'''

def start_container(workspace,broker,name):
    cmd=['docker','run','-d','--name',name,'--network','none','--cpus','2','--memory','2g',
         '--pids-limit','128','--cap-drop','ALL','--security-opt','no-new-privileges',
         '--user',f'{os.getuid()}:{os.getgid()}','--read-only','--tmpfs','/tmp:rw,nosuid,size=512m',
         '-v',f'{workspace}:/app','-v',f'{broker.socket_dir}:/run/sim-gateway:ro']
    public=[p.relative_to(ROOT/'starter') for p in (ROOT/'starter').rglob('*') if p.is_file() and p.name!='circuit.spi']
    public += [Path(p) for p in ['TASK.md','contract.json','AGENT_PROTOCOL.md']]
    for rel in public:
        if (workspace/rel).is_file():cmd+=['-v',f'{workspace/rel}:/app/{rel.as_posix()}:ro']
    cmd+=[AGENT_IMAGE]
    answer=capture(cmd,30)
    if answer['exit_code']:raise RuntimeError(answer['stderr'])

def freeze(folder,broker):
    frozen=folder/'frozen';frozen.mkdir(exist_ok=True)
    source=folder/'workspace/circuit.spi'
    shutil.copy2(source,frozen/'circuit.spi')
    key=hashlib.sha256(canonical(source.read_text()).encode()).hexdigest()
    known=[d['canonical_sha256'] for d in broker.state['designs']]
    valid=policy(frozen/'circuit.spi','simle-a2-final-policy-'+uuid.uuid4().hex[:10])
    save(frozen/'policy.json',valid)
    within_budget=key in known or len(known)<LIMITS['max_designs']
    if valid['exit_code']==0 and key not in known and within_budget:
        entry=dict(number=len(known)+1,canonical_sha256=key,source_sha256=digest(source),first_request='final-freeze')
        broker.state['designs'].append(entry)
        candidate=broker.run/'candidates'/f'{entry["number"]:03d}'
        candidate.mkdir(parents=True,exist_ok=True)
        shutil.copy2(frozen/'circuit.spi',candidate/'circuit.spi')
        save(candidate/'manifest.json',entry)
    save(broker.run/'state.json',broker.state)
    manifest=dict(sha256=digest(source),canonical_sha256=key,policy_valid=valid['exit_code']==0,
                  within_design_budget=within_budget,selection='last agent-authored circuit on disk; no host repair or historical best selection',
                  frozen_at=datetime.now(timezone.utc).isoformat())
    save(frozen/'manifest.json',manifest)
    return manifest

def one(model,key,run):
    folder=run/model;workspace=folder/'workspace';workspace.mkdir(parents=True)
    shutil.copytree(ROOT/'starter',workspace,dirs_exist_ok=True)
    (workspace/'experiments').mkdir(exist_ok=True)
    (workspace/'TASK.md').write_text((ROOT/'TASK.md').read_text())
    shutil.copy2(ROOT/'contract.json',workspace/'contract.json')
    (workspace/'AGENT_PROTOCOL.md').write_text(INSTRUCTIONS)
    broker=Broker(folder/'broker',workspace)
    name='simle-a2-agent-'+uuid.uuid4().hex[:12]
    messages=[{'role':'user','content':(workspace/'TASK.md').read_text()+'\n\nRead /app/AGENT_PROTOCOL.md. Begin your own design and experiments using the terminal.'}]
    usage=[];tool_count=0;finished=False;finish_summary=None;status='running';started=time.monotonic()
    start_container(workspace,broker,name)
    save(folder/'container.json',{'name':name,'image':AGENT_IMAGE,'uid':os.getuid(),'network':'none','api_credentials_inside':False})
    try:
        for turn in range(1,LIMITS['max_responses']+1):
            used=sum(u.get('output_tokens',0) for u in usage)
            if used>=LIMITS['max_output_tokens'] or tool_count>=LIMITS['max_tool_calls'] or time.monotonic()-started>LIMITS['max_wall_seconds']:break
            save(folder/'status.json',{'phase':'inference','model':model,'turn':turn,'tool_calls':tool_count,'designs':len(broker.state['designs']),'native_runs':broker.state['native_runs']})
            print(f'{model} turn={turn} designs={len(broker.state["designs"])} native={broker.state["native_runs"]}',flush=True)
            out=folder/f'turn_{turn:03d}';out.mkdir()
            response=call(key,model,messages,INSTRUCTIONS,TOOLS,out,min(LIMITS['max_output_per_response'],LIMITS['max_output_tokens']-used))
            usage.append(response.get('usage') or {})
            messages.extend(response.get('output',[]))
            calls=[x for x in response.get('output',[]) if x.get('type')=='function_call']
            for k,c in enumerate(calls,1):
                if tool_count>=LIMITS['max_tool_calls']:break
                tool_count+=1;args=json.loads(c['arguments']);image=None
                if c['name']=='terminal':
                    timeout=max(1,min(LIMITS['terminal_timeout'],int(args['timeout_seconds'])))
                    command=args['command']
                    result=capture(['docker','exec','-w','/app',name,'timeout','--signal=TERM','--kill-after=5',str(timeout),'bash','-lc',command],timeout+10)
                    save(out/f'tool_{k}_full.json',{'name':c['name'],'arguments':args,'result':result})
                    for field in ['stdout','stderr']:
                        if len(result[field])>18000:result[field]=result[field][:9000]+'\n[truncated; full output saved in host trace]\n'+result[field][-9000:]
                elif c['name']=='read_image':
                    p=workspace/args['path'].removeprefix('/app/')
                    if not p.resolve().is_relative_to(workspace.resolve()) or p.is_symlink() or not p.is_file() or p.stat().st_size>8*1024*1024:
                        result={'error':'Image must be a regular file under /app, at most 8 MiB'}
                    else:
                        mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'}.get(p.suffix.lower())
                        if mime:
                            image='data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
                            result={'image_path':args['path'],'sha256':digest(p)}
                        else:result={'error':'Use PNG/JPEG/WebP for read_image'}
                elif c['name']=='finish':
                    finished=True;finish_summary=args['summary'];result={'freeze_requested':True}
                else:result={'error':'Unknown tool'}
                result['budget']=dict(designs_used=len(broker.state['designs']),native_runs=broker.state['native_runs'],**{k:LIMITS[k] for k in ['max_designs','max_native_runs']})
                save(out/f'tool_{k}.json',{'name':c['name'],'arguments':args,'result':result})
                messages.append({'type':'function_call_output','call_id':c['call_id'],'output':json.dumps(result,ensure_ascii=False)})
                if image:messages.append({'role':'user','content':[{'type':'input_text','text':'Image returned by your read_image tool:'},{'type':'input_image','image_url':image}]})
                print(f'{model} tool={c["name"]} code={result.get("exit_code","ok")} designs={len(broker.state["designs"])} native={broker.state["native_runs"]}',flush=True)
                if finished:break
            if (workspace/'circuit.spi').exists():shutil.copy2(workspace/'circuit.spi',out/'circuit.spi')
            save(folder/'usage.json',usage)
            save(folder/'checkpoint.json',{'messages':messages,'usage':usage,'turn':turn,'tool_calls':tool_count,'broker':broker.state})
            if finished:break
            if not calls:messages.append({'role':'user','content':'Use terminal to implement and simulate your circuit, or call finish to freeze the current circuit.'})
            messages.append({'role':'user','content':f'Budget now: {broker.state["native_runs"]}/{LIMITS["max_native_runs"]} native runs; {turn}/{LIMITS["max_responses"]} responses. You choose the next experiment. No formal evaluation has run.'})
        from seal import verify
        verify()
        # Stop all agent processes before taking the immutable source snapshot.
        capture(['docker','stop','-t','2',name],15)
        broker.freeze()
        manifest=freeze(folder,broker)
        development_wall=time.monotonic()-started
        save(folder/'status.json',{'phase':'independent_verifier','frozen':manifest})
        if manifest['within_design_budget']:
            result=evaluate(folder/'frozen/circuit.spi',folder/'final_evaluation','simle-a2-final-'+uuid.uuid4().hex[:12])
        else:result={'reward':{'reward':0},'protocol_violation':'Final circuit exceeds the native simulation budget'}
        result.update(requested_model=model,reported_model=response.get('model') if usage else None,
                      tool_calls=tool_count,responses=len(usage),designs_used=len(broker.state['designs']),
                      native_runs=broker.state['native_runs'],explicit_finish=finished,finish_summary=finish_summary,
                      output_tokens=sum(u.get('output_tokens',0) for u in usage),agent_wall_seconds=round(development_wall,3))
        save(folder/'result.json',result);save(folder/'status.json',{'phase':'completed','reward':result.get('reward')})
        print(json.dumps({'model':model,'result':result.get('reward'),'designs':len(broker.state['designs']),'native_runs':broker.state['native_runs']}),flush=True)
        return result
    except Exception as exc:
        save(folder/'infrastructure_error.json',{'error':str(exc).replace(key,'<redacted>')[:2000]})
        raise
    finally:
        capture(['docker','rm','-f',name],20)
        if not broker.closed:broker.freeze()

def main():
    ap=argparse.ArgumentParser();ap.add_argument('mode',choices=['preflight','run']);ap.add_argument('--key-stdin',action='store_true');args=ap.parse_args()
    if args.key_stdin:key=sys.stdin.readline().strip()
    else:
        import getpass
        key=getpass.getpass('API key (memory only): ').strip()
    assert key
    available=models(key)
    assert all(m in available for m in MODELS),'Exact requested model unavailable'
    if args.mode=='preflight':
        print(json.dumps({'models_available':MODELS,'endpoint':BASE_URL}),flush=True);return
    assert json.loads((ROOT/'validation/calibration.json').read_text())['ready'],'Calibration not ready'
    assert json.loads((ROOT/'validation/gateway_checks.json').read_text())['passed'],'Gateway checks not ready'
    from seal import verify
    sealed=verify()
    run=ROOT/'runs_a2'/datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ');run.mkdir(parents=True)
    protocol={'name':'a2-opamp-application-porting-v1','models':MODELS,'limits':LIMITS,'base_image':BASE_IMAGE,
              'agent_image':AGENT_IMAGE,'endpoint':BASE_URL,
              'agent_tools':['terminal','read_image','finish'],'public_diagnostics':'agent-authored and agent-selected; supplied examples define interfaces without a reference circuit',
              'selection':'last on-disk circuit','runs_per_model':1,'host_design_edits':False,
              'hidden_final_feedback':False,'api_credentials_in_agent_container':False,
              'upstream_commit':'5dc16f1c01858664f1912a84abfc06fd4c69f6de',
              'qualification':'Original unmodified eight-check AnalogPortBench signoff AND fixed sensor application requirements',
              'hashes':{p.relative_to(ROOT).as_posix():digest(p) for p in ROOT.glob('*.py')}}
    protocol['image_ids']={image['RepoTags'][0] if image.get('RepoTags') else image['RepoDigests'][0]:image['Id'] for image in json.loads((ROOT/'validation/images.json').read_text())}
    protocol['contract_sha256']=digest(ROOT/'contract.json')
    protocol['upstream_file_hashes']={p.relative_to(ROOT/'upstream').as_posix():digest(p) for p in (ROOT/'upstream').rglob('*') if p.is_file() and '__pycache__' not in str(p)}
    protocol['verifier_image']=VERIFIER_IMAGE
    protocol['all_specifications_frozen_before_model']=True
    protocol['pre_run_seal']=sealed
    protocol['seal_sha256']=digest(ROOT/'seal.json')
    save(run/'protocol.json',protocol);save(ROOT/'latest_a2_run.json',{'path':str(run),'phase':'running'})
    results=[]
    for model in MODELS:
        try:results.append(one(model,key,run))
        except Exception as exc:results.append({'requested_model':model,'infrastructure_error':str(exc).replace(key,'<redacted>')[:1000]})
        save(run/'results.json',results)
    save(ROOT/'latest_a2_run.json',{'path':str(run),'phase':'completed' if all('reward' in r for r in results) else 'infrastructure_error'})
    print('RUN_DONE '+str(run),flush=True)

if __name__=='__main__':main()
