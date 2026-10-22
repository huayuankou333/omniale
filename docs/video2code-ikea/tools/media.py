"""Exact video sampling/cropping. It does not read evaluator answers or annotations."""
import argparse, json, hashlib, sys
from pathlib import Path

def frame(video,at,out,crop=None):
    import av
    with av.open(str(video)) as c:
        duration=c.duration/1_000_000
        if not 0<=at<duration:raise ValueError('timestamp outside video')
        c.seek(int(at*1_000_000))
        for f in c.decode(video=0):
            actual=float(f.pts*f.time_base)
            if actual+1e-6<at:continue
            im=f.to_image()
            if crop:
                x,y,w,h=crop
                if min(x,y)<0 or min(w,h)<=0 or x+w>im.width or y+h>im.height:raise ValueError('invalid crop')
                im=im.crop((x,y,x+w,y+h))
            out.parent.mkdir(parents=True,exist_ok=True);im.save(out)
            return {'requested_seconds':at,'actual_seconds':actual,'path':str(out),'crop':crop,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
    raise ValueError('no decoded frame at requested timestamp')
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--video',type=Path,required=True);p.add_argument('--seconds',type=float,nargs='+',required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--crop',type=int,nargs=4);p.add_argument('--dependency-dir',type=Path);args=p.parse_args()
    if args.dependency_dir:sys.path.insert(0,str(args.dependency_dir))
    if len(args.seconds)>64:raise ValueError('maximum 64 frames per request')
    print(json.dumps([frame(args.video,t,args.out/f'{i:03d}-{t:.3f}.png',args.crop) for i,t in enumerate(args.seconds)],ensure_ascii=False,indent=2))
