"""Pre-run checks for the actual isolated A2 model toolchain."""
import json
import shutil
import uuid
from pathlib import Path
from broker import Broker
from config import ROOT,LIMITS,save
from native import capture
from run_agent import start_container,freeze


def main():
    folder=ROOT/'validation'/('gateway-'+uuid.uuid4().hex[:8]);workspace=folder/'workspace';workspace.mkdir(parents=True)
    shutil.copytree(ROOT/'starter',workspace,dirs_exist_ok=True)
    shutil.copy2(ROOT/'TASK.md',workspace/'TASK.md')
    shutil.copy2(ROOT/'contract.json',workspace/'contract.json')
    shutil.copy2(ROOT/'controls/reference.spi',workspace/'circuit.spi')
    (workspace/'experiments').mkdir(exist_ok=True)
    source='''* A2 actual native gateway test
.lib /opt/sky130/continuous/sky130.lib.spice tt
.include /app/circuit.spi
.global vdd
VSUP vdd 0 1.2
IREF vdd iref 20u
VINP inp 0 0.9
XDUT iref inp out out dut
CL out 0 1p
.control
set wr_singlescale
set wr_vecnames
op
print v(out)
wrdata /app/experiments/op.txt v(out)
quit
.endc
.end
'''
    (workspace/'experiments/op.spi').write_text(source)
    limits=dict(LIMITS,max_native_runs=4)
    broker=Broker(folder/'broker',workspace,limits=limits)
    name='simle-a2-gateway-check-'+uuid.uuid4().hex[:8];checks=[]
    def check(label,command,predicate):
        r=capture(['docker','exec','-w','/app',name,'bash','-lc',command],150)
        ok=bool(predicate(r));save(folder/(label+'.json'),{'result':r,'passed':ok});checks.append({'name':label,'passed':ok})
        print(json.dumps(checks[-1]),flush=True)
        if not ok:raise AssertionError(label+': '+r['stdout'][-1200:]+r['stderr'][-1200:])
    start_container(workspace,broker,name)
    try:
        check('native_version','ngspice --version',lambda r:r['exit_code']==0 and 'ngspice-46' in r['stdout'])
        check('public_contract_readonly',"python3 - <<'PY'\nfrom pathlib import Path\nfor p in ['TASK.md','contract.json','application_check.py']:\n try:Path('/app',p).write_text('tamper')\n except OSError:continue\n raise AssertionError(p+' was writable')\nprint('public files protected')\nPY",lambda r:r['exit_code']==0)
        reference=(ROOT/'controls/reference.spi').read_text()
        for i in range(4):
            extra='' if i==0 else f'RGATECHECK iref out {i}G\n'
            (workspace/'circuit.spi').write_text(reference.replace('.ends dut',extra+'.ends dut'))
            check(f'candidate_{i+1}_allowed','ngspice -b /app/experiments/op.spi',lambda r:r['exit_code']==0 and (workspace/'experiments/op.txt').exists())
        assert broker.state['native_runs']==4 and len(broker.state['designs'])==4
        check('native_limit_enforced','ngspice -b /app/experiments/op.spi',lambda r:r['exit_code']!=0 and 'budget exhausted' in r['stderr'])
        # Validate forbidden mutations independently of the exhausted run counter.
        from broker import validate_deck
        rejected={}
        for label,modified in [('dut_alter',source.replace('op\n','alter @xdut.fake[w]=10\nop\n')),('external_model',source.replace('.global vdd','.model shadow nmos\n.global vdd'))]:
            p=workspace/f'experiments/{label}.spi';p.write_text(modified)
            try:validate_deck(p,workspace);rejected[label]=False
            except ValueError:rejected[label]=True
        assert all(rejected.values());checks.extend({'name':k+'_rejected','passed':v} for k,v in rejected.items())
        p=workspace/'experiments/external_alter.spi';p.write_text(source.replace('op\n','alter VINP 0.8\nop\n'));validate_deck(p,workspace)
        checks.append({'name':'external_test_source_alter_allowed','passed':True})
        check('agent_isolation',"python3 - <<'PY'\nimport os,json,socket,importlib.util\nfrom pathlib import Path\ns=socket.socket();s.settimeout(2)\ntry:s.connect(('1.1.1.1',443));internet=True\nexcept OSError:internet=False\nprint(json.dumps({'uid':os.getuid(),'internet':internet,'numpy':bool(importlib.util.find_spec('numpy')),'matplotlib':bool(importlib.util.find_spec('matplotlib')),'verifier':Path('/opt/port-upstream').exists(),'reference':Path('/app/controls/reference.spi').exists(),'docker_socket':Path('/var/run/docker.sock').exists(),'credentials':any('API_KEY' in k for k in os.environ)}))\nPY",lambda r:r['exit_code']==0 and json.loads(r['stdout'])['uid']!=0 and all(json.loads(r['stdout'])[k] for k in ['numpy','matplotlib']) and not any(json.loads(r['stdout'])[k] for k in ['internet','verifier','reference','docker_socket','credentials']))
        capture(['docker','stop','-t','2',name],15);broker.freeze();manifest=freeze(folder,broker)
        assert manifest['policy_valid'] and manifest['within_design_budget']
        checks.append({'name':'fourth_candidate_can_be_frozen','passed':True})
        save(ROOT/'validation/gateway_checks.json',{'passed':all(c['passed'] for c in checks),'checks':checks,'evidence_path':str(folder),'broker':broker.state})
        print('GATEWAY_COMPLETE',flush=True)
    finally:
        capture(['docker','rm','-f',name],20)
        if not broker.closed:broker.freeze()


if __name__=='__main__':main()
