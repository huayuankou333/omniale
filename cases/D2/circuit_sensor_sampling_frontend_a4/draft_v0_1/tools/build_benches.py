"""Emit A4 fixed acquisition benches. Does not run ngspice or certify the design."""
import argparse
import hashlib
import itertools
import json
from pathlib import Path
import shutil


def safe_path(value):
    text=str(Path(value).resolve()).replace('\\','/')
    if any(c in text for c in ('"','\n','\r')):
        raise ValueError('SPICE paths cannot contain quotes or newlines')
    return text


def pwl(points):
    # Emit strictly increasing times; coincident command corners share one value.
    values={round(t,18):v for t,v in points}
    ordered=sorted(values.items())
    if any(t<0 for t,v in ordered):
        raise ValueError('Negative waveform time')
    return 'PWL('+' '.join(f'{t:.12g} {v:.12g}' for t,v in ordered)+')'


def clock_wave(start, stop, edge, period, cycles, high):
    points=[(0,high if start==0 else 0)]
    for i in range(cycles):
        base=i*period
        if i or start:
            points.extend([(base+start,0),(base+start+edge,high)])
        points.extend([(base+stop,high),(base+stop+edge,0)])
    points.append((cycles*period,0))
    return pwl(points)


def sensor_wave(seq, sign, supply, sampling):
    previous=supply/2 + sign*seq[0]/2
    points=[(0,previous)]
    for i,value in enumerate(seq):
        new=supply/2+sign*value/2
        t=i*sampling['period_s']+sampling['command_update_start_s']
        points.extend([(t,previous),(t+sampling['command_edge_s'],new)])
        previous=new
    points.append((len(seq)*sampling['period_s'],previous))
    return pwl(points)


def generate(root, output, dut, model):
    cfg=json.loads((root/'contract.json').read_text(encoding='utf-8'))
    sampling=cfg['sampling']; sensor=cfg['sensor']; output.mkdir(parents=True,exist_ok=True)
    fixture=output/'sample_switch.spi'
    shutil.copyfile(root/'public/fixtures/sample_switch.spi',fixture)
    base_points=[]
    for corner,supply,temp in itertools.product(cfg['corners'],cfg['supplies_v'],cfg['temperatures_c']):
        for rs in sensor['symmetric_rs_pairs_ohm']:
            base_points.append((corner,supply,temp,*rs))
    for corner,supply,temp in cfg['representative_points']:
        for rs in sensor['asymmetric_rs_pairs_ohm']:
            base_points.append((corner,supply,temp,*rs))
    assert len(base_points)==len(set(base_points))==66
    rows=[]
    vectors=['v(voutp)','v(voutn)','v(sensp)','v(sensn)','v(basep)','v(basen)',
             'v(srcp)','v(srcn)','v(drvp)','v(drvn)', 'v(vdd)','i(vdd)',
             'v(vocm)','i(vocm)','i(vsensp)','i(vsensn)',
             'v(phi_reset)','i(vreset)','v(phi_track)','i(vtrack)','v(phi_transfer)','i(vtransfer)']
    for corner,v,temp,rp,rn in base_points:
        key=f'{corner}_{v:g}V_{temp:+d}C_R{rp}_{rn}'.replace('.','p')
        for history in [*sampling['history_levels_v'],'noise']:
            kind='noise' if history=='noise' else 'transient'
            ident=f'{kind}_{key}_{history}'
            folder=output/ident; folder.mkdir(exist_ok=True)
            seq=[sampling['history_levels_v'][history]]*sampling['preamble_cycles']+sampling['probe_sequence_v'] if kind=='transient' else []
            if kind=='transient':
                sigp=sensor_wave(seq,1,v,sampling); sign=sensor_wave(seq,-1,v,sampling)
                reset=clock_wave(sampling['reset_on_start_s'],sampling['reset_off_start_s'],sampling['clock_edge_s'],sampling['period_s'],len(seq),v)
                track=clock_wave(sampling['track_on_start_s'],sampling['track_off_start_s'],sampling['clock_edge_s'],sampling['period_s'],len(seq),v)
                transfer=clock_wave(sampling['transfer_on_start_s'],sampling['transfer_off_start_s'],sampling['clock_edge_s'],sampling['period_s'],len(seq),v)
                maximum=cfg['transient_max_step_s']
                analysis=f'tran {maximum:.12g} {len(seq)*sampling["period_s"]:.12g} 0 {maximum:.12g}\nwrdata wave.dat '+ ' '.join(vectors)
            else:
                sigp=f'DC {v/2:.12g} AC 1'; sign=f'DC {v/2:.12g}'
                reset=track=f'DC {v:.12g}'; transfer='DC 0'
                analysis='noise v(drvp,drvn) VSENSP dec 80 10 10G\nprint onoise_total\nwrdata noise_total.dat onoise_total'
            # Baseline source is independent: its power is deliberately not charged to DUT.
            basep=sigp.replace(' AC 1',''); basen=sign
            deck=f'''* A4 {ident}; fixed source/sampling fixture; cwd=this folder.
.lib "{safe_path(model)}" {corner}
.include "{safe_path(dut)}"
.include "{safe_path(fixture)}"
.temp {temp}
.options reltol=1e-4 abstol=1e-12 vntol=1e-7 method=gear maxord=2
VSS vss 0 0
VDD vdd vss {v:.12g}
VOCM vocm vss {v/2:.12g}
IREF vdd iref {cfg['iref_a']:.12g}
VSENSP srcp vss {sigp}
VSENSN srcn vss {sign}
RSP srcp sensp {rp}
RSN srcn sensn {rn}
CPADP sensp vss {sensor['pad_capacitance_f']:.12g}
CPADN sensn vss {sensor['pad_capacitance_f']:.12g}
VSBASEP bsrcp vss {basep}
VSBASEN bsrcn vss {basen}
RBASEP bsrcp basep {rp}
RBASEN bsrcn basen {rn}
CBASEP basep vss {sensor['pad_capacitance_f']:.12g}
CBASEN basen vss {sensor['pad_capacitance_f']:.12g}
XINTERFACE vss vdd sensn sensp vocm drvn drvp sensor_interface
XOTA vss iref vdd vinn vinp vocm voutn voutp sampling_feedback_ota
CSP bp vinp {sampling['cs_f']:.12g}
CSN bn vinn {sampling['cs_f']:.12g}
CFP voutn vinp {sampling['cf_f']:.12g}
CFN voutp vinn {sampling['cf_f']:.12g}
CLP voutp vss {sampling['cl_f']:.12g}
CLN voutn vss {sampling['cl_f']:.12g}
VRESET phi_reset vss {reset}
VTRACK phi_track vss {track}
VTRANSFER phi_transfer vss {transfer}
XRSTP voutn vinp phi_reset vss sle_sample_switch supply={v:.12g}
XRSTN voutp vinn phi_reset vss sle_sample_switch supply={v:.12g}
XTRKP drvp bp phi_track vss sle_sample_switch supply={v:.12g}
XTRKN drvn bn phi_track vss sle_sample_switch supply={v:.12g}
XXFRP vocm bp phi_transfer vss sle_sample_switch supply={v:.12g}
XXFRN vocm bn phi_transfer vss sle_sample_switch supply={v:.12g}
.control
set wr_singlescale
set wr_vecnames
set numdgt=15
{analysis}
.endc
.end
'''
            (folder/'bench.cir').write_text(deck,encoding='utf-8')
            row={'id':ident,'kind':kind,'pair_key':key,'history':history,'corner':corner,'supply_v':v,'temperature_c':temp,'rs_p_ohm':rp,'rs_n_ohm':rn,'deck':f'{ident}/bench.cir','wave':f'{ident}/wave.dat' if kind=='transient' else f'{ident}/noise_total.dat','vectors':vectors if kind=='transient' else ['onoise_total'],'scale':'time_s' if kind=='transient' else 'noise_integral_plot_scale','differential_source_sequence_v':seq,'target_output_sequence_v':[sampling['gain']*x for x in seq], 'scored_cycle_indices':list(range(sampling['warmup_cycles'],len(seq))) if seq else []}
            rows.append(row)
    assert len(rows)==cfg['added_runs']['total']
    tids=[r['id'] for r in rows if r['kind']=='transient']
    nids=[r['id'] for r in rows if r['kind']=='noise']
    groups={g:nids if g=='acquisition_phase_noise' else tids for g in cfg['added_groups']}
    index={'case':'A4','contract_sha256':hashlib.sha256((root/'contract.json').read_bytes()).hexdigest(),
           'fixture_sha256':hashlib.sha256(fixture.read_bytes()).hexdigest(),'simulations_executed':False,
           'original_suite_included':False,'cases':rows,'group_case_ids':groups}
    (output/'index.json').write_text(json.dumps(index,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    return index


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--dut',type=Path,default=Path('/app/circuit.spi'))
    p.add_argument('--model',type=Path,default=Path('/opt/sky130/continuous/sky130.lib.spice'))
    a=p.parse_args()
    index=generate(Path(__file__).resolve().parents[1],a.out.resolve(),a.dut,a.model)
    print(json.dumps({'case':'A4','generated_cases':len(index['cases']),'simulations_executed':False}))
