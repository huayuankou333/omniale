"""Freeze public task, verifier, controls and protocol before paid model work."""
from datetime import datetime,timezone
import json
from config import ROOT,digest,save


def verify():
    seal=json.loads((ROOT/'seal.json').read_text())
    mismatches=[name for name,expected in seal['files'].items() if digest(ROOT/name)!=expected]
    if mismatches:
        raise RuntimeError('Sealed benchmark source changed: '+', '.join(mismatches))
    return seal


def main():
    if (ROOT/'seal.json').exists():
        verify()
        print('Existing seal verified; not overwritten')
        return
    assert json.loads((ROOT/'validation/calibration.json').read_text())['ready']
    assert json.loads((ROOT/'validation/gateway_checks.json').read_text())['passed']
    assert json.loads((ROOT/'validation/numerics.json').read_text())['all_pass']
    files={}
    for p in ROOT.rglob('*'):
        rel=p.relative_to(ROOT)
        if not p.is_file() or any(x in rel.parts for x in ('validation','runs_a2','__pycache__')):
            continue
        if p.name=='remote_session.py' or p.suffix in ('.log','.raw','.pyc') or p.name.startswith('sweep_'):
            continue
        files[rel.as_posix()]=digest(p)
    save(ROOT/'seal.json',{'contract':'a2-opamp-application-porting-v1',
                          'created_at':datetime.now(timezone.utc).isoformat(),
                          'files':files,'calibration':json.loads((ROOT/'validation/calibration.json').read_text())})
    print(json.dumps({'sealed_files':len(files),'contract_sha256':digest(ROOT/'contract.json')}))


if __name__=='__main__':
    main()
