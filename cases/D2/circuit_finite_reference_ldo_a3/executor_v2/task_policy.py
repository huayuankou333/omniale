"""Original device policy plus declared adaptation interfaces, no circuit repair."""
from pathlib import Path
import importlib.util,json,re,subprocess,sys,os
ROOT=Path(__file__).resolve().parent
cfg=json.loads((ROOT/'contract.json').read_text())
path=Path(sys.argv[1]);source=path.read_text();case=cfg['case']
top=cfg['top'].split()[1:]
p=subprocess.run([sys.executable,str(ROOT/'public/policy/check_circuit.py'),str(path),'--allow-ideal','R','C','--require-subcircuit',*top],env={**os.environ,'SKY130_PDK_SUBCIRCUITS':str(ROOT/'public/policy/sky130_pdk_subcircuits.txt')})
if p.returncode:raise SystemExit(p.returncode)
problems=[]
if case=='A3':
    sys.path.insert(0,str(ROOT/'researcher/original/tests'))
    import verify
    problems+=verify.submission_policy_failures(source)
else:
    wanted=cfg['interface_top'].lower()
    headers=[' '.join(l.strip().lower().split()) for l in source.splitlines() if l.lstrip().lower().startswith('.subckt')]
    if wanted not in headers:problems.append('Missing exact sensor_interface pin order')
for line in source.splitlines():
    words=line.strip().lower().split()
    if not words or words[0].startswith(('*',';')):continue
    if words[0]=='.subckt' and len(words)>1 and words[1].startswith('sle_'):
        problems.append('Evaluator fixture subcircuit names are reserved')
    if words[0] in ('.global','.include','.inc','.lib','.ic','.nodeset'):
        problems.append('External includes, globals and simulator directives are not allowed in DUT')
if problems:
    print('\n'.join(problems));raise SystemExit(2)
print('Original device and adaptation interface policies passed')
