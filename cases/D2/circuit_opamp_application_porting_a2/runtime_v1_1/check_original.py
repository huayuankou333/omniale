"""Verify that A2 still executes the original scorer and original benches."""
import json,subprocess,uuid
from config import ROOT,BASE_IMAGE,AGENT_IMAGE,VERIFIER_IMAGE,save,digest
from native import capture,flags

def main():
    files=['benchmark/llm/score_answer.py','benchmark/measure.py','benchmark/evaluate.py','benchmark/testbenches/opamp_loop.cir.tmpl','benchmark/testbenches/opamp_tran.cir.tmpl']
    files=[p for p in files if (ROOT/'upstream'/p).is_file()]
    code='import pathlib,hashlib,json;root=pathlib.Path("/opt/port-upstream");print(json.dumps({p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in '+repr(files)+'}))'
    r=capture(flags('simle-a2-original-audit-'+uuid.uuid4().hex[:8])+[VERIFIER_IMAGE,'python3','-c',code],30)
    assert r['exit_code']==0,r
    remote=json.loads(r['stdout']);local={p:digest(ROOT/'upstream'/p) for p in files}
    assert remote==local,{'image':remote,'source':local}
    save(ROOT/'validation/original_integrity.json',{'passed':True,'original_source_and_image_hashes':local,'verifier_image':VERIFIER_IMAGE})
    images=json.loads(subprocess.check_output(['docker','image','inspect',BASE_IMAGE,AGENT_IMAGE,VERIFIER_IMAGE],text=True))
    save(ROOT/'validation/images.json',images)
    print(json.dumps({'passed':True,'original_files_checked':len(files),'images_checked':len(images)}))

if __name__=='__main__':main()
