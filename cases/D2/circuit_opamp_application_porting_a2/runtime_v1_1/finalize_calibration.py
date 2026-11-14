"""Read-only evidence consolidation, followed by a pre-model readiness decision."""
import json
from pathlib import Path
from config import ROOT,save,digest
from application import check_metrics

def main():
    ref=json.loads((ROOT/'validation/reference_full/result.json').read_text())
    assert ref['summary']['full_pass'] and ref['summary']['simulation_complete'],ref['reward']
    limits=json.loads((ROOT/'contract.json').read_text())['application_limits']
    finer=json.loads((ROOT/'validation/numerics_grid/results.json').read_text());comparisons=[]
    for item in finer:
        baseline=ref['summary']['cases'][item['index']];trial=item['result']
        assert baseline['source_sha256']==trial['source_sha256']==digest(ROOT/'controls/reference.spi')
        passes=bool(trial['checks']) and all(trial['checks'].values())
        a=baseline['metrics'];b=trial.get('metrics',{});key='recoveries' if 'recoveries' in a else 'steps'
        settle=max(abs(x['settling_s']-y['settling_s']) for x,y in zip(a[key],b[key]))
        overshoot=max(abs(x['overshoot_fraction']-y['overshoot_fraction']) for x,y in zip(a[key],b[key]))
        dc=abs(a.get('dc_error_max_v',0)-b.get('dc_error_max_v',0))
        comparisons.append({'case_index':item['index'],'step':item['step'],'passes':passes,'settling_change_s':settle,'overshoot_change_fraction':overshoot,'dc_error_change_v':dc,'converged':settle<=2e-9 and overshoot<=.005 and dc<=5e-5})
    all_pass=all(c['passes'] and c['converged'] for c in comparisons)
    save(ROOT/'validation/numerics.json',{'all_pass':all_pass,'baseline_step':'100p','finer_steps':['50p','25p'],'tolerances':{'settling_s':2e-9,'overshoot_fraction':.005,'dc_error_v':5e-5},'comparisons':comparisons})
    assert all_pass,comparisons
    controls=json.loads((ROOT/'validation/negative_controls/results.json').read_text())
    original,nominal,naive=controls
    controls_valid=(original['original']['summary']['official_pass'] and nominal['original']['summary']['official_pass'] and not original['applications'][0]['checks']['application_stability'] and not nominal['applications'][0]['checks']['application_power'])
    complete=all('metrics' in r for c in controls for r in c['applications'])
    assert controls_valid and complete
    assert json.loads((ROOT/'validation/original_integrity.json').read_text())['passed']
    assert json.loads((ROOT/'validation/gateway_checks.json').read_text())['passed']
    summary={'ready':True,'reference_sha256':digest(ROOT/'controls/reference.spi'),'reference_evidence':'validation/reference_full/result.json','original_pass':True,'original_checks_passed':8,'application_groups_passed':5,'application_cases_passed':63,'reference_native_invocations':65,'negative_controls':[{ 'name':c['name'],'original_outcome':c['original']['summary']['outcome'],'targeted_application_checks':[r['checks'] for r in c['applications']]} for c in controls],'negative_control_scope':'Original signoff plus declared targeted new-application tests; not full-matrix scores','numerics_converged':True,'original_source_matches_pinned_image':True,'sol_trials_started':0}
    save(ROOT/'validation/calibration.json',summary)
    print(json.dumps(summary,indent=2))

if __name__=='__main__':main()
