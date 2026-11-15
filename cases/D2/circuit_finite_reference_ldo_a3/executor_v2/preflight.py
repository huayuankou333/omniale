"""Runtime smoke, original regression and fixture sign checks; not feasibility proof."""
import argparse,json,shutil,uuid
from pathlib import Path
from config import ROOT,CASE,save
from native import policy,original
from application import generate,run_one,read_wave,a4

def main():
    dest=ROOT/'validation'/('preflight-'+uuid.uuid4().hex[:8]);dest.mkdir(parents=True)
    cfg=json.loads((ROOT/'contract.json').read_text());design=dest/'circuit.spi'
    source=(ROOT/'controls/original_reference.spi').read_text()
    if CASE=='A4':
        source+='''\n.subckt sensor_interface vss vdd sensn sensp vocm drvn drvp
Rconnectionp sensp drvp 0.001
Rconnectionn sensn drvn 0.001
.ends sensor_interface
'''
    design.write_text(source)
    p=policy(design);save(dest/'policy.json',p)
    assert p['exit_code']==0,p['stdout']+p['stderr']
    orig=original(design,dest/'original');save(dest/'original_result.json',orig)
    assert all(r['status']=='passed' for r in orig['checks']), 'Original known reference did not pass unchanged verifier'
    app=dest/'application';index=generate(app);results=[]
    for kind in (['dc','psr','step','startup'] if CASE=='A3' else ['transient','noise']):
        if kind=='startup':row=next(r for r in index['cases'] if r['kind']==kind and r['corner']=='tt')
        else:row=next(r for r in index['cases'] if r['kind']==kind and r['corner']=='tt' and r['supply_v']==(1.8 if CASE=='A4' else 1.5) and r['temperature_c']==27)
        r=run_one(design,app,row,cfg);results.append(r)
        print(json.dumps({'case':CASE,'kind':kind,'complete':r['complete'],'checks':r['checks'],'failure':r.get('failure')}),flush=True)
    ideal=None
    if CASE=='A4':
        # Independent source/switch sign verification only; forbidden as solution.
        ideal_design=dest/'ideal_fixture_control.spi'
        ideal_design.write_text('''* Researcher fixture calibration only; not an allowed solution.
.subckt sampling_feedback_ota vss iref vdd vinn vinp vocm voutn voutp
Eplus xp vocm vinp vinn 50000
Eminus xn vocm vinn vinp 50000
Rplus xp voutp 1
Rminus xn voutn 1
Riref iref vss 10k
.ends sampling_feedback_ota
.subckt sensor_interface vss vdd sensn sensp vocm drvn drvp
Ebufp drvp vss sensp vss 1
Ebufn drvn vss sensn vss 1
.ends sensor_interface
''')
        row=next(r for r in index['cases'] if r['kind']=='transient' and r['corner']=='tt' and r['supply_v']==1.8 and r['temperature_c']==27)
        ideal=run_one(ideal_design,app,row,cfg);save(dest/'ideal_sign_control.json',ideal)
        assert ideal['complete'],'Ideal sign control did not run'
        # Finite gain + explicit clock feedthrough may leave a small residual;
        # allow 20mV to verify only sign and scale, not claim calibrated success.
        assert ideal['metrics']['sample_error_v']<.02,'Fixed switched-capacitor sign/gain differs from public target'
    passed=all(r['complete'] for r in results)
    result={'runtime_smoke_passed':passed,'original_reference_passed':True,
            'original_checks':len(orig['checks']),'reference_adaptation_feasibility_proven':False,
            'new_envelope_reference_runs':[{'kind':r['case']['kind'],'complete':r['complete'],'checks':r['checks'],'failure':r.get('failure')} for r in results],
            'ideal_fixture_sign_control':bool(ideal and ideal['complete']) if CASE=='A4' else None,
            'evidence':str(dest),'qualification':'Operational pilot. No allowed-device design is yet proven to pass both full suites.'}
    save(ROOT/'validation/preflight.json',result)
    print(json.dumps(result),flush=True)
    assert passed,'At least one added bench did not produce valid measurements'

if __name__=='__main__':main()
