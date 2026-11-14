"""Export sealed case and auditable model results without credentials or bulky waveforms."""
import hashlib,json,zipfile
from pathlib import Path
from config import ROOT,save,digest
from seal import verify
from broker import canonical

def main():
    sealed=verify();latest=json.loads((ROOT/'latest_a2_run.json').read_text())
    assert latest['phase']=='completed',latest
    run=Path(latest['path']);folder=run/'gpt-6.1-sol';read=lambda p:json.loads(p.read_text())
    result=read(folder/'result.json');state=read(folder/'broker/state.json');manifest=read(folder/'frozen/manifest.json')
    turns=sorted(p for p in folder.glob('turn_*') if (p/'inference.json').exists());models=[];matching=[];interactions=[]
    for turn in turns:
        inference=read(turn/'inference.json');models.append(inference['reported_model'])
        calls=[c for c in read(turn/'response.json').get('output',[]) if c.get('type')=='function_call'];actual=[]
        for i,c in enumerate(calls,1):
            p=turn/f'tool_{i}.json'
            if not p.exists():continue
            tool=read(p);matching.append(tool['name']==c['name'] and tool['arguments']==json.loads(c['arguments']));actual.append(tool)
        interactions.append({'turn':turn.name,'inference':inference,'tools':actual})
    public={p.relative_to(ROOT/'starter').as_posix():digest(p)==digest(folder/'workspace'/p.relative_to(ROOT/'starter')) for p in (ROOT/'starter').rglob('*') if p.is_file() and p.name!='circuit.spi' and '__pycache__' not in str(p)}
    public.update({p:digest(ROOT/p)==digest(folder/'workspace'/p) for p in ['TASK.md','contract.json']})
    final=folder/'frozen/circuit.spi';snapshots=[t/'circuit.spi' for t in turns if (t/'circuit.spi').exists()]
    checks={'sealed_source_unchanged':True,'model_identity_reported_correctly':bool(models) and set(models)=={'gpt-6.1-sol'},'executed_arguments_match_model_calls':bool(matching) and all(matching),'final_is_last_on_disk':digest(snapshots[-1])==digest(final)==digest(folder/'workspace/circuit.spi')==manifest['sha256']==result['frozen_sha256'],'native_count_consistent':state['native_runs']==result['native_runs'] and state['native_runs']<=160,'public_files_unchanged':all(public.values()),'final_design_recorded':hashlib.sha256(canonical(final.read_text()).encode()).hexdigest() in {d['canonical_sha256'] for d in state['designs']}}
    input_tokens=sum(read(t/'inference.json')['usage'].get('input_tokens',0) for t in turns)
    retries=list(folder.glob('turn_*/transport_*.json'))
    audit={'passed':all(checks.values()),'checks':checks,'public_file_checks':public,'input_tokens_sum':input_tokens,'output_tokens':result['output_tokens'],'transport_retry_records':len(retries),'reported_models':sorted(set(models)),'identity_scope':'API reported identity; model weights were not independently inspected','run':str(run),'frozen_sha256':digest(final)}
    save(run/'trace_audit.json',audit);save(run/'tool_trace.json',interactions)
    out=ROOT/'delivery';out.mkdir(exist_ok=True)
    save(out/'A2_Sol_result.json',result);save(out/'A2_trace_audit.json',audit)
    selected=[run/'protocol.json',run/'results.json',run/'trace_audit.json',run/'tool_trace.json',folder/'result.json',folder/'usage.json',folder/'container.json',folder/'broker/state.json']
    selected+=list((folder/'frozen').glob('*'))+list((folder/'broker/candidates').rglob('*'))
    selected+=list(folder.glob('turn_*/*.json'))+list(folder.glob('turn_*/circuit.spi'))
    selected+=list(folder.glob('broker/request_*/*.json'))
    selected+=[p for p in (folder/'final_evaluation').rglob('*') if p.suffix in ('.json','.spi','.cir','.log')]
    with zipfile.ZipFile(out/'A2_Sol_evidence.zip','w',zipfile.ZIP_DEFLATED) as z:
        for p in sorted(set(selected)):
            if p.is_file():z.write(p,p.relative_to(run).as_posix())
    with zipfile.ZipFile(out/'A2_case.zip','w',zipfile.ZIP_DEFLATED) as z:
        for rel in sealed['files']:z.write(ROOT/rel,rel)
        z.write(ROOT/'seal.json','seal.json')
        for p in (ROOT/'validation').rglob('*'):
            if p.is_file() and p.suffix=='.json' and not any(x.startswith('gateway-') for x in p.parts):z.write(p,p.relative_to(ROOT).as_posix())
    # Each generated test.spi is immediately submitted by the calibration runner,
    # including attempts that could not open their log or were manually stopped.
    logs=set((ROOT/'validation').rglob('test.spi'))
    logs.update((ROOT/'validation').rglob('opamp_loop.log'));logs.update((ROOT/'validation').rglob('opamp_tran.log'))
    gateway_native=sum(read(p).get('native_runs',0) for p in (ROOT/'validation').glob('gateway-*/broker/state.json'))
    groups={}
    for p in logs:
        key=p.relative_to(ROOT/'validation').parts[0];groups[key]=groups.get(key,0)+1
    inventory={'researcher_native_batch_attempts':len(logs),'gateway_native_invocations':gateway_native,'total_before_model':len(logs)+gateway_native,'by_validation_group':groups,'includes_failed_aborted_and_numerical_diagnostic_attempts':True,'model_development_native_invocations':result['native_runs'],'model_final_evaluation_planned_invocations':65,'model_final_evaluation_observed_invocations':len(list((folder/'final_evaluation').rglob('native.log')))+len(list((folder/'final_evaluation').rglob('opamp_loop.log')))+len(list((folder/'final_evaluation').rglob('opamp_tran.log')))}
    save(out/'A2_compute_inventory.json',inventory)
    print(json.dumps({'audit':audit,'budget':{k:result.get(k) for k in ['responses','tool_calls','designs_used','native_runs','output_tokens','agent_wall_seconds']},'reward':result['reward'],'inventory':inventory,'delivery':str(out)},indent=2))

if __name__=='__main__':main()
