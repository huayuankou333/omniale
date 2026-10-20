"""Public-media perception only. Does not read authoring specs, truth or synthetic narration text."""
import os,sys,json,subprocess,wave,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT.parent/".deps"))
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING","1")
os.environ.setdefault("HF_HUB_DISABLE_XET","1")
FFMPEG=os.environ.get("FFMPEG_PATH",r"F:\annconda\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe")
def whisper():
    from faster_whisper import WhisperModel
    return WhisperModel(os.environ.get("CASE1_ASR_MODEL","base.en"),device="cpu",compute_type="int8",
                        cpu_threads=4,download_root=str(ROOT.parent/".models"))
def prepare():
    out=ROOT/"prepared";out.mkdir(exist_ok=True)
    wav=out/"review-decoded.wav"
    subprocess.run([FFMPEG,"-v","error","-y","-i",str(ROOT/"public/inputs/review.mp4"),"-vn","-ar","16000","-ac","1",str(wav)],check=True)
    import numpy as np
    with wave.open(str(wav),"rb") as w:
        duration=w.getnframes()/w.getframerate()
        decoded=np.frombuffer(w.readframes(w.getnframes()),dtype="<i2").astype(np.float32)/32768
    print("Loading independent ASR",flush=True);model=whisper()
    segments,info=model.transcribe(decoded,language="en",beam_size=5,vad_filter=True,word_timestamps=True,
                                  condition_on_previous_text=False)
    data=[]
    for s in segments:
        data.append({"start":round(s.start,2),"end":round(s.end,2),"text":s.text.strip(),
                     "words":[{"start":round(w.start,2),"end":round(w.end,2),"word":w.word} for w in (s.words or [])]})
        print(f"ASR {s.end:.1f}/{duration:.1f}s",flush=True)
    (out/"transcript.json").write_text(json.dumps({"model":os.environ.get("CASE1_ASR_MODEL","base.en"),"route":"independent ASR of decoded MP4","duration_seconds":duration,"segments":data},indent=2),encoding="utf-8")
    frames=out/"frames";frames.mkdir(exist_ok=True)
    # Regular timeline samples, not author-provided scene labels.
    times=list(range(0,math.floor(duration),10))
    for i,t in enumerate(times):
        subprocess.run([FFMPEG,"-v","error","-y","-ss",str(t),"-i",str(ROOT/"public/inputs/review.mp4"),"-frames:v","1","-q:v","4",str(frames/f"{i:03}.jpg")],check=True)
    (out/"frames.json").write_text(json.dumps([{"time":t,"file":f"frames/{i:03}.jpg"} for i,t in enumerate(times)],indent=2),encoding="utf-8")
    print(json.dumps({"frames":len(times),"duration":duration,"segments":len(data)}))
def analyze(file,start,end):
    import numpy as np
    with wave.open(str(file),"rb") as w:
        sr=w.getframerate();total=w.getnframes()/sr
        if not (0<=start<end<=total and end-start<=40): raise ValueError("Invalid interval")
        channels=w.getnchannels()
        w.setpos(round(start*sr));audio=np.frombuffer(w.readframes(round((end-start)*sr)),dtype="<i2").astype(float).reshape(-1,channels)/32768
    step=round(.1*sr)
    values=[]
    for i in range(0,len(audio),step):
        block=audio[i:i+step];freq=np.fft.rfftfreq(len(block),1/sr)
        spectrum=np.abs(np.fft.rfft(block,axis=0))/len(block)
        row={"start":round(start+i/sr,3)}
        for j in range(channels):
            row["LR"[j]]={"rms":round(float(np.sqrt(np.mean(block[:,j]**2))),5),
              "band_1400_1800":round(float(np.sqrt(np.sum(spectrum[(freq>=1400)&(freq<=1800),j]**2))),5),
              "band_600_4000":round(float(np.sqrt(np.sum(spectrum[(freq>=600)&(freq<=4000),j]**2))),5)}
        values.append(row)
    return {"measurement":"100ms channel RMS and FFT-band energy, not diagnoses","sample_rate":sr,"windows":values}
def sheet(file,start,end,step,out):
    from PIL import Image,ImageDraw,ImageFont
    if not (0<=start<=end and step>=.1 and end<=1200):raise ValueError("Invalid sampling interval")
    times=[];t=start
    if abs(start-end)<.00001:times=[round(start,3)]
    while t<end-.00001:
        times.append(round(t,3));t+=step
    if len(times)>256:raise ValueError("At most 256 frames per request; split long intervals.")
    if len(times)>16:
        pages=[]
        for offset in range(0,len(times),16):
            batch=times[offset:offset+16]
            page=out.with_name(f"{out.stem}-page-{offset//16+1}.jpg")
            response=sheet(file,batch[0],min(end,batch[-1]+step),step,page)
            pages.append(response["_image"])
        return {"times":times,"_images":pages,"pagination":"all requested frames; 16 per page; not subsampled"}
    out.parent.mkdir(parents=True,exist_ok=True)
    cols=2;tw=640;th=385;im=Image.new("RGB",(tw*cols,th*math.ceil(len(times)/cols)),"#152130")
    d=ImageDraw.Draw(im);ft=ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf",20)
    for i,t in enumerate(times):
        p=out.parent/f"{out.stem}-{i}.jpg"
        subprocess.run([FFMPEG,"-v","error","-y","-ss",str(t),"-i",str(file),"-frames:v","1","-q:v","3",str(p)],check=True)
        x=(i%cols)*tw;y=(i//cols)*th
        im.paste(Image.open(p).resize((640,360)),(x,y));d.text((x+8,y+361),f"{t:.3f} seconds",font=ft,fill="white")
    im.save(out);return {"times":times,"_image":str(out)}
def transcribe_source(file,start,end):
    import numpy as np
    with wave.open(str(file),"rb") as w:
        sr=w.getframerate();ch=w.getnchannels()
        if not(0<=start<end<=w.getnframes()/sr and end-start<=30):raise ValueError("Invalid range")
        w.setpos(round(start*sr));raw=np.frombuffer(w.readframes(round((end-start)*sr)),dtype="<i2").astype(np.float32).reshape(-1,ch).mean(axis=1)/32768
    # Linear resampling of PCM for ASR; no authoring metadata involved.
    x=np.interp(np.arange(round(len(raw)*16000/sr))*sr/16000,np.arange(len(raw)),raw).astype(np.float32)
    seg,_=whisper().transcribe(x,language="en",condition_on_previous_text=False)
    return {"segments":[{"start":round(start+s.start,2),"end":round(start+s.end,2),"text":s.text} for s in seg]}
if __name__=="__main__":
    if sys.argv[1]=="download": whisper();print("ASR model ready")
    elif sys.argv[1]=="prepare":prepare()
    elif sys.argv[1]=="analyze":print(json.dumps(analyze(Path(sys.argv[2]),float(sys.argv[3]),float(sys.argv[4]))))
    elif sys.argv[1]=="sheet":print(json.dumps(sheet(Path(sys.argv[2]),float(sys.argv[3]),float(sys.argv[4]),float(sys.argv[5]),Path(sys.argv[6]))))
    elif sys.argv[1]=="source_asr":print(json.dumps(transcribe_source(Path(sys.argv[2]),float(sys.argv[3]),float(sys.argv[4]))))
    else:raise ValueError("Unknown command")
