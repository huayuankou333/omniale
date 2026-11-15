from datetime import datetime,timezone
from pathlib import Path
import json
from config import ROOT,CASE,save,digest
def verify():
    seal=json.loads((ROOT/'seal.json').read_text())
    bad=[n for n,h in seal['files'].items() if not (ROOT/n).is_file() or digest(ROOT/n)!=h]
    if bad:raise RuntimeError('Frozen evaluator source changed: '+', '.join(bad))
    return seal
def main():
    if (ROOT/'seal.json').exists():verify();return
    pre=json.loads((ROOT/'validation/preflight.json').read_text());assert pre['runtime_smoke_passed']
    assert json.loads((ROOT/'validation/gateway_checks.json').read_text())['passed']
    assert json.loads((ROOT/'validation/measurement_checks.json').read_text())['passed']
    files={}
    for p in ROOT.rglob('*'):
        rel=p.relative_to(ROOT)
        if not p.is_file() or set(rel.parts)&{'validation','runs_sol','__pycache__','worker_slots'}:continue
        if p.suffix in ('.log','.pyc') or p.name in ('seal.json','latest_sol_run.json'):continue
        files[rel.as_posix()]=digest(p)
    save(ROOT/'seal.json',{'case':CASE,'created_at':datetime.now(timezone.utc).isoformat(),'files':files,'preflight':pre,
                         'qualification':'operational pilot; full adaptation feasibility unproven'})
    print(json.dumps({'sealed_files':len(files),'case':CASE}))
if __name__=='__main__':main()
