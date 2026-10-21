from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib
e=Path('outputs/case2_video2code_v1_native/runs/k3-trial-02/evaluation')
def read(p):return json.loads(p.read_text(encoding='utf8'))
def write(p,j):p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
m=read(e/'manifest.json');selection=read(e/'judge-selection.json')
def add(id,p,kind):m['artifacts'][id]={'path':p.relative_to(e).as_posix(),'sha256':sha(p),'kind':kind}
for x in [480,490,520,560,600]:
 p=sorted(e.glob('*-SUP-snap-x-'+str(x)+'-after.png'))[-1];dst=p.with_suffix('.jpg');Image.open(p).convert('RGB').save(dst,quality=92,subsampling=0);id='J-'+p.stem;add(id,dst,'candidate_screenshot');selection['images'].append(id)
motion=sorted(e.glob('*SUP-play-continuity-motion-*.png'))[:27]
for group in range(3):
 board=Image.new('RGB',(3840,2502),'white');draw=ImageDraw.Draw(board)
 for k,p in enumerate(motion[group*9:(group+1)*9]):
  x=k%3*1280;y=k//3*834;board.paste(Image.open(p).convert('RGB'),(x,y));draw.text((x+10,y+808),p.name,fill='black')
 p=e/f'SUP-motion-sheet-{group+1}.jpg';board.save(p,quality=90);add(p.stem,p,'candidate_screenshot');selection['images'].append(p.stem)
selection['notes']=[x for x in selection['notes'] if x['scenario']!='S07']
selection['notes'] += [{'scenario':'S07','description':'Independent Cancel first: open modal then click actual Cancel. Then separately reopen and click exterior board to test blocking/dismissal; Escape closes if still open. Finally independently open/close x and open/confirm. All exact actions are recorded.'},{'scenario':'operator corrections','description':'First S01/S02 run interrupted because localhost controller connection reset before a hover action; reloaded and fully reran those scenes, selected the later complete images. This is evaluator infrastructure, not candidate failure. Candidate uses custom size menus; actual visible button/option coordinates replace native select operations. Pause button observed at (640,759). No candidate code was changed. Extra slow pointer moves verify discrete snapping; contact sheets contain consecutive actual frames, no interpolated/synthetic output.'}]
write(e/'judge-selection.json',selection);add('judge-selection',e/'judge-selection.json','browser_log')
bundle={'execution':read(e/'execution.json'),'browser':read(e/'browser-log.json')};write(e/'judge-execution-browser-bundle.json',bundle)
for id in ['Execution and browser logs','execution/browser logs']:add(id,e/'judge-execution-browser-bundle.json','browser_log')
for id in ['Additional exact npm startup check','execution log: exact npm startup check','npm-start-3000']:add(id,e/'npm-start-3000.json','execution_log')
write(e/'judge-operator-chronology.json',selection['notes']);add('Evidence operator chronology',e/'judge-operator-chronology.json','browser_log')
write(e/'manifest.json',m);print(json.dumps({'judge_images':len(selection['images']),'motion_frames':len(motion)}))
