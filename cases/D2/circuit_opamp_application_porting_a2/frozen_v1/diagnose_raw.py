import os,json,shutil,uuid
from concurrent.futures import ThreadPoolExecutor
from config import ROOT,BASE_IMAGE,save
from native import capture,flags
from application import deck

def one(method):
    c=dict(kind='tracking',corner='tt',temp=-20,gain=1,lo=.7,hi=1.0,cl_pf=1)
    folder=ROOT/'validation/raw_diagnosis'/method;folder.mkdir(parents=True,exist_ok=False)
    shutil.copy2(ROOT/'controls/reference.spi',folder/'circuit.spi')
    text=deck(c).split('.control')[0].replace('method=gear','method='+method)
    text+='\n.save v(sensor) v(inp) v(sensed) v(out) i(VSUP)\n.tran 100p 1.4u 0 100p\n.end\n'
    (folder/'test.spi').write_text(text)
    cmd=flags('simle-a2-raw-'+method+'-'+uuid.uuid4().hex[:6],os.getuid())+['-v',f'{folder}:/work','-e','HOME=/tmp','-v',f'{ROOT/"trusted.spiceinit"}:/tmp/.spiceinit:ro','-w','/work',BASE_IMAGE,'ngspice','-b','test.spi','-r','progress.raw','-o','native.log']
    result=capture(cmd,300);save(folder/'execution.json',result)
    print(json.dumps({'method':method,**result}),flush=True)

if __name__=='__main__':
    with ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(one,['gear','trap']))
