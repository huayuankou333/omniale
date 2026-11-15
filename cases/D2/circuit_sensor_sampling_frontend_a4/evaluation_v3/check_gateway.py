"""Check actual agent isolation, native gateway, fixture allowlist and run budget."""
import json,shutil,uuid
from pathlib import Path
from config import ROOT,CASE,LIMITS,save
from broker import Broker,validate_deck
from native import capture
from run_agent import start_container

def main():
    dest=ROOT/'validation'/('gateway-'+uuid.uuid4().hex[:8]);ws=dest/'workspace';ws.mkdir(parents=True)
    shutil.copytree(ROOT/'starter',ws,dirs_exist_ok=True)
    for p in ['TASK.md','contract.json']:shutil.copyfile(ROOT/p,ws/p)
    source=(ROOT/'controls/original_reference.spi').read_text()
    if CASE=='A4':source+='\n.subckt sensor_interface vss vdd sensn sensp vocm drvn drvp\nRcp sensp drvp 0.001\nRcn sensn drvn 0.001\n.ends sensor_interface\n'
    (ws/'circuit.spi').write_text(source);(ws/'experiments').mkdir(exist_ok=True)
    deck='''* Gateway reference OP only, not a submitted solution
.lib /opt/sky130/continuous/sky130.lib.spice tt
.include /app/circuit.spi
VSS vss 0 0
'''
    if CASE=='A3':deck+='VDD vin vss 1.8\nVREF vref vss .4\nILOAD vout vss 1m\nXDUT vin vout vss vref capless_ldo\n'
    else:deck+='VDD vdd vss 1.8\nVOCM vocm vss .9\nVINP vinp vss .9\nVINN vinn vss .9\nIREF vdd iref 50u\nXOTA vss iref vdd vinn vinp vocm voutn voutp sampling_feedback_ota\n'
    deck+='.control\nop\nprint all\nquit\n.endc\n.end\n'
    (ws/'experiments/op.cir').write_text(deck)
    b=Broker(dest/'broker',ws,limits={**LIMITS,'max_native_runs':1})
    name='simle-gateway-'+uuid.uuid4().hex[:12];checks=[]
    def check(label,cmd,pred):
        r=capture(['docker','exec','-w','/app',name,'bash','-lc',cmd],180)
        ok=bool(pred(r));save(dest/(label+'.json'),{'result':r,'passed':ok});checks.append({'name':label,'passed':ok})
        assert ok,label+': '+r['stdout'][-700:]+r['stderr'][-700:]
    try:
        start_container(ws,b,name)
        check('native_version','ngspice --version',lambda r:r['exit_code']==0 and 'ngspice-46' in r['stdout'])
        check('native_gateway','ngspice -b /app/experiments/op.cir',lambda r:r['exit_code']==0)
        check('native_budget_enforced','ngspice -b /app/experiments/op.cir',lambda r:r['exit_code']!=0 and 'budget exhausted' in r['stderr'])
        check('isolation',"python3 - <<'PY'\nimport os,socket,json\nfrom pathlib import Path\ns=socket.socket();s.settimeout(1)\ntry:s.connect(('1.1.1.1',443));internet=True\nexcept OSError:internet=False\nassert os.getuid()!=0 and not internet and not Path('/var/run/docker.sock').exists()\nassert not Path('/app/controls').exists() and not Path('/app/researcher').exists()\nassert not any('API_KEY' in k for k in os.environ)\nfor p in ['TASK.md','contract.json','public/MEASUREMENTS.md']:\n try:Path(p).write_text('tamper')\n except OSError:continue\n raise AssertionError(p+' is writable')\nprint('isolated and public files readonly')\nPY",lambda r:r['exit_code']==0)
        # Source and fixture definitions remain distinguishable in gateway.
        modified=ws/'experiments/bad.cir';modified.write_text(deck.replace('op\n','alter @xdut.xbad[w]=1\nop\n'))
        try:validate_deck(modified,ws)
        except ValueError:checks.append({'name':'dut_alter_rejected','passed':True})
        else:raise AssertionError('DUT mutation accepted')
        save(ROOT/'validation/gateway_checks.json',{'passed':True,'checks':checks,'evidence':str(dest),'native_runs':b.state['native_runs']})
        print(json.dumps({'case':CASE,'gateway_checks_passed':True,'checks':checks}),flush=True)
    finally:
        try:capture(['docker','rm','-f',name],20)
        except Exception:pass
        if not b.closed:b.freeze()
        from persistent import close
        close()
if __name__=='__main__':main()
