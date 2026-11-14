import os,json,shutil,uuid
from concurrent.futures import ThreadPoolExecutor
from config import ROOT,BASE_IMAGE,save
from native import capture,flags
from application import deck,analyze,check_metrics

def one(mode):
    c=dict(kind='tracking',corner='tt',temp=-20,gain=1,lo=.7,hi=1.0,cl_pf=1)
    folder=ROOT/'validation/feedback_diagnosis'/mode;folder.mkdir(parents=True,exist_ok=False)
    shutil.copy2(ROOT/'controls/reference.spi',folder/'circuit.spi')
    text=deck(c)
    if mode=='direct':text=text.replace('Rfb sensed innraw 1m','* Unity feedback wire').replace('VNIN innraw inn 0','VNIN sensed inn 0')
    else:text=text.replace('Rfb sensed innraw 1m','Rfb sensed innraw 1')
    (folder/'test.spi').write_text(text)
    cmd=flags('simle-a2-feedback-'+mode+'-'+uuid.uuid4().hex[:6],os.getuid())+['-v',f'{folder}:/work','-e','HOME=/tmp','-v',f'{ROOT/"trusted.spiceinit"}:/tmp/.spiceinit:ro','-w','/work',BASE_IMAGE,'ngspice','-b','test.spi','-o','native.log']
    result={'execution':capture(cmd,120)}
    if result['execution']['exit_code']==0:
        try:
            result['metrics']=analyze(folder,c)
            result['checks']=check_metrics(c,result['metrics'],json.loads((ROOT/'contract.json').read_text())['application_limits'])
        except Exception as e:result['error']=str(e)
    save(folder/'result.json',result);print(json.dumps({'mode':mode,**result}),flush=True)

if __name__=='__main__':
    with ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(one,['direct','oneohm']))
