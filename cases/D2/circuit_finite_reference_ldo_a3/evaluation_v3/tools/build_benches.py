"""Emit A3 fixed application benches. This program never runs a simulator."""
import argparse
import hashlib
import itertools
import json
from pathlib import Path
import shutil


def safe_path(value):
    text = str(Path(value).resolve()).replace('\\', '/')
    if any(x in text for x in ('"', '\n', '\r')):
        raise ValueError('SPICE paths cannot contain quotes or newlines')
    return text


def generate(root, output, dut, model):
    cfg = json.loads((root / 'contract.json').read_text(encoding='utf-8'))
    output.mkdir(parents=True, exist_ok=True)
    fixture = output / 'finite_reference.spi'
    shutil.copyfile(root / 'public/fixtures/finite_reference.spi', fixture)
    rows = []
    for corner, supply, temp in itertools.product(cfg['corners'], cfg['supplies_v'], cfg['temperatures_c']):
        rows.append(dict(kind='dc', corner=corner, supply_v=supply, temperature_c=temp, vset_v=.4))
        rows.append(dict(kind='step', corner=corner, supply_v=supply, temperature_c=temp, vset_v=.4))
    for corner, supply in itertools.product(cfg['corners'], cfg['supplies_v']):
        rows.append(dict(kind='psr', corner=corner, supply_v=supply, temperature_c=27, vset_v=.4))
    for supply, vset in itertools.product(cfg['supplies_v'], cfg['reference']['trim_v']):
        rows.append(dict(kind='dc', corner='tt', supply_v=supply, temperature_c=27, vset_v=vset, trim=True))
    for corner, supply, temp in cfg['startup_points']:
        rows.append(dict(kind='startup', corner=corner, supply_v=supply, temperature_c=temp, vset_v=.4))
    vectors = ['v(vout)', 'v(vref)', 'i(vrefs)', 'v(vin)', 'i(vdut)', 'v(vinref)', 'i(vrefrail)']
    for row in rows:
        kind, v = row['kind'], row['supply_v']
        ident = f"{kind}_{row['corner']}_{v:g}V_{row['temperature_c']:+d}C_ref{row['vset_v']:g}".replace('.', 'p')
        row['id'] = ident
        folder = output / ident
        folder.mkdir(exist_ok=True)
        supply = f'PWL(0 0 100u {v:.12g} 400u {v:.12g})' if kind == 'startup' else f'DC {v:.12g} AC 1'
        load = {'dc':'ILOAD vout vss 0', 'psr':'ILOAD vout vss 20m', 'step':'ILOAD vout vss PWL(0 0.5m 20u 0.5m 21u 20m 60u 20m 61u 0.5m 100u 0.5m)', 'startup':'RLOAD vout vss 2k'}[kind]
        analysis = {'dc':'dc ILOAD 0 20m 0.1m', 'psr':'ac dec 80 10 10Meg', 'step':f"tran {cfg['step_max_step_s']:.12g} 100u 0 {cfg['step_max_step_s']:.12g}", 'startup':f"tran {cfg['startup_max_step_s']:.12g} 400u 0 {cfg['startup_max_step_s']:.12g}"}[kind]
        deck = f'''* A3 {ident}; generated fixed fixture; run with cwd=this folder.
.lib "{safe_path(model)}" {row['corner']}
.include "{safe_path(dut)}"
.include "{safe_path(fixture)}"
.temp {row['temperature_c']}
.options reltol=1e-4 abstol=1e-12 vntol=1e-7 method=gear maxord=2
VSS vss 0 0
VDUT vin vss {supply}
VREFRAIL vinref vss {supply}
XREF vinref vss refmodule sle_finite_reference vset={row['vset_v']:.12g}
VREFS refmodule vref 0
XDUT vin vout vss vref capless_ldo
{load}
.control
set wr_singlescale
set wr_vecnames
set numdgt=15
{analysis}
wrdata wave.dat {' '.join(vectors)}
.endc
.end
'''
        (folder / 'bench.cir').write_text(deck, encoding='utf-8')
        row.update(deck=f'{ident}/bench.cir', wave=f'{ident}/wave.dat', vectors=vectors,
                   scale='frequency_hz' if kind=='psr' else 'load_current_a' if kind=='dc' else 'time_s',
                   vector_encoding='real_imag_pairs' if kind=='psr' else 'real',
                   target_output_v=2.5*row['vset_v'])
    assert len(rows) == cfg['added_runs']['total']
    groups = {
        'finite_dc_tracking':[r['id'] for r in rows if r['kind']=='dc'],
        'reference_integrity':[r['id'] for r in rows if r['kind'] in ('dc','step','startup')],
        'finite_reference_psr':[r['id'] for r in rows if r['kind']=='psr'],
        'coupled_transient_startup':[r['id'] for r in rows if r['kind'] in ('step','startup')],
        'total_supply_power':[r['id'] for r in rows if r['kind'] in ('dc','step')],
    }
    index={'case':'A3','contract_sha256':hashlib.sha256((root/'contract.json').read_bytes()).hexdigest(),
           'fixture_sha256':hashlib.sha256(fixture.read_bytes()).hexdigest(),
           'simulations_executed':False,'original_suite_included':False,'cases':rows,'group_case_ids':groups}
    (output/'index.json').write_text(json.dumps(index,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    return index


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--dut',type=Path,default=Path('/app/circuit.spi'))
    p.add_argument('--model',type=Path,default=Path('/opt/sky130/continuous/sky130.lib.spice'))
    args=p.parse_args()
    index=generate(Path(__file__).resolve().parents[1],args.out.resolve(),args.dut,args.model)
    print(json.dumps({'case':'A3','generated_cases':len(index['cases']),'simulations_executed':False}))
