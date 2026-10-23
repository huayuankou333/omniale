from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
from PIL import Image
import hashlib,json

ROOT=Path('outputs/case4_video2code_ikea_v1/evaluation-one-shot-v1')
OUT=Path('work/ikea-lossless-webp')
sha=lambda b:hashlib.sha256(b).hexdigest()

def one(f):
    source=ROOT/f['path'];dest=OUT/(source.stem+'.webp')
    with Image.open(source) as im:
        im.load();before=sha(im.convert('RGBA').tobytes());mode=im.mode;size=im.size
        opts={'lossless':True,'quality':100,'method':6,'exact':True}
        if im.info.get('icc_profile'):opts['icc_profile']=im.info['icc_profile']
        im.save(dest,format='WEBP',**opts)
    with Image.open(dest) as im:
        im.load();assert im.size==size and sha(im.convert('RGBA').tobytes())==before
    return {'source':f['path'],'transport':str(dest).replace('\\','/'),'source_mode':mode,'pixel_hash_representation':'RGBA','size':size,'decoded_pixels_sha256':before,'source_sha256':sha(source.read_bytes()),'transport_sha256':sha(dest.read_bytes()),'source_bytes':source.stat().st_size,'transport_bytes':dest.stat().st_size}

if __name__=='__main__':
    OUT.mkdir(parents=True,exist_ok=True)
    frames=json.loads((ROOT/'public/frame-manifest.json').read_text(encoding='utf8'))
    with ProcessPoolExecutor(max_workers=4) as pool:rows=list(pool.map(one,frames))
    result={'purpose':'Optional lossless transport encoding; original frozen inputs remain unchanged. Not yet used for a candidate.','all_decoded_pixels_identical':True,'frames':rows,'original_bytes':sum(x['source_bytes'] for x in rows),'transport_bytes':sum(x['transport_bytes'] for x in rows)}
    (OUT/'manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({k:v for k,v in result.items() if k!='frames'}))
