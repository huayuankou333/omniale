"""Negative controls for measurement definitions before any model run."""
import json
import numpy as np
from config import ROOT,CASE,save
from application import a3,a4,summarize

cfg=json.loads((ROOT/'contract.json').read_text());checks=[]
if CASE=='A3':
    x=np.linspace(0,.02,201);v=1.5
    row={'kind':'dc','supply_v':v,'vset_v':.4}
    y={'v(vout)':np.ones(201),'v(vref)':np.full(201,.4),'i(vrefs)':np.zeros(201),
       'v(vin)':np.full(201,v),'i(vdut)':-(x+90e-6),'v(vinref)':np.full(201,v),'i(vrefrail)':np.full(201,-18e-6)}
    m,c=a3(row,x,y,cfg)
    assert c['finite_dc_tracking'] and c['reference_integrity'] and not c['total_supply_power']
    checks.append('Reference 18uA is included: DUT 90uA cannot pass 100uA system overhead')
    y['i(vdut)']=-(x+60e-6);m,c=a3(row,x,y,cfg);assert c['total_supply_power']
    y['i(vrefs)'][100]=.3e-6;assert not a3(row,x,y,cfg)[1]['reference_integrity']
    checks.append('A single DC load-point reference-current violation fails integrity')
    y['i(vrefs)'][:]=0;y['v(vref)'][100]=float('nan')
    # read_wave, not a3, owns finite-data validation; check parser separately below.
else:
    s=cfg['sampling'];x=np.linspace(0,24*s['period_s'],120001);z=np.zeros_like(x);v=1.8
    row={'kind':'transient','supply_v':v,'rs_p_ohm':5000,'rs_n_ohm':5000,
         'differential_source_sequence_v':[0]*24,'target_output_sequence_v':[0]*24,'scored_cycle_indices':list(range(2,24))}
    vectors=['v(voutp)','v(voutn)','v(sensp)','v(sensn)','v(basep)','v(basen)','v(srcp)','v(srcn)','v(drvp)','v(drvn)','v(vdd)','i(vdd)','v(vocm)','i(vocm)','i(vsensp)','i(vsensn)','v(phi_reset)','i(vreset)','v(phi_track)','i(vtrack)','v(phi_transfer)','i(vtransfer)']
    y={k:z.copy() for k in vectors}
    for k in vectors:
        if k.startswith('v(') and not k.startswith('v(phi_'):y[k][:]=v/2
    y['v(vdd)'][:]=v;y['i(vdd)'][:]=-1e-3
    m,c=a4(row,x,y,cfg);assert all(c.values())
    # All 80ns readouts remain exact, but one late excursion invalidates settling.
    idx=np.argmin(abs(x-(2e-7+70e-9)));y['v(voutp)'][idx]+=.02
    m,c=a4(row,x,y,cfg);assert c['sample_accuracy'] and not c['transfer_settling']
    checks.append('Excursion between readout and settling deadline cannot hide behind correct 80ns samples')
    y['v(voutp)'][idx]-=.02
    # Positive and negative equal source kicks cannot cancel in absolute charge.
    region=(x>=2e-7+44e-9)&(x<=2e-7+47e-9)
    y['v(sensp)'][region]+=.002*np.where(x[region]<2e-7+45.5e-9,1,-1)
    m,c=a4(row,x,y,cfg);assert not c['sensor_disturbance']
    checks.append('Bipolar sensor disturbance is measured without signed cancellation')
    # Power returned on VOCM cannot pay for VDD consumption.
    y['v(sensp)'][:]=v/2;y['i(vdd)'][:]=-.008;y['i(vocm)'][:]=.1
    m,c=a4(row,x,y,cfg);assert not c['system_positive_power']
    checks.append('Returned reference energy does not offset VDD positive power')
    index={'group_case_ids':{g:['p','n'] for g in cfg['added_groups']}}
    # One valid sequence cannot pass history comparison without its pair.
    r={'case':{'id':'p','kind':'transient','pair_key':'test','history':'positive_history'},'complete':True,'checks':{g:True for g in cfg['added_groups']},'metrics':{'reads':[{'cycle':i,'value_v':0} for i in range(2,24)]}}
    groups=summarize(index,[r],cfg)
    assert next(g for g in groups if g['name']=='history_independence')['status']=='incomplete'
    checks.append('Missing negative-history sequence cannot pass paired acceptance')
save(ROOT/'validation/measurement_checks.json',{'passed':True,'case':CASE,'checks':checks})
print(json.dumps({'case':CASE,'measurement_negative_controls_passed':True,'checks':checks}),flush=True)
