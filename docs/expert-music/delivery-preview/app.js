'use strict';
const $=s=>document.querySelector(s); const el=(name,cls,text)=>{const n=document.createElement(name);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n};
const audio=$('#audio'), deck=$('#deck'), seek=$('#seek'), tog=$('#toggle'), replay=$('#replay');
const topics=['断连 · Articulation','推进 · Élan','声部起音 · Voicing','高潮 · Climax','触键 · Dynamics','乐句对照 · Phrasing','音色 · Timbre','曲式 · Form','渐强 · Crescendo','和声悬置 · Rubato','时值弹性 · Rubato','旋律辨音 · Melody','节拍 · Pulse','调外音 · Dissonance','音程 · Interval','调式 · Mode','和声进行 · Progression','和弦 · Chord','终止式 · Cadence','即兴 · Improvisation'];
let opened=new Set();try{opened=new Set(JSON.parse(localStorage.getItem('lingpu-revealed'))||[])}catch{};
let pieces={}, current=null, ticker=0, run=0, waiting=false, transportToken=0; const cards=new Map();
const fmt=(v,d=1)=>{const p=10**d,n=Math.floor(Math.max(0,v)*p+1e-5),k=Math.floor(n/p);return `${Math.floor(k/60)}:${String(k%60).padStart(2,'0')}${d?'.'+String(n%p).padStart(d,'0'):''}`};
const rangeText=r=>`${fmt(r[0])}–${fmt(r[1])}`;
const request=(rel,opt={})=>fetch(rel,opt).then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r});
const jobs=new Map();let objectMedia=null;
// The requested simple HTTP server doesn't implement Range. If no byte-range
// support is advertised, an original-byte Blob keeps arbitrary seeks reliable.
function mediaURL(p){
 if(jobs.has(p.piece_id))return jobs.get(p.piece_id);
 const job=(async()=>{try{const h=await request(p.audio,{method:'HEAD'});if(h.headers.get('accept-ranges')?.toLowerCase().includes('bytes'))return p.audio;}catch{};
 const b=await request(p.audio).then(r=>r.blob());return URL.createObjectURL(b);})();
 jobs.set(p.piece_id,job);job.catch(()=>jobs.delete(p.piece_id));return job;
}
function scrubUI(){
 if(!current)return;
 const a=Number.isFinite(audio.duration)?audio.duration:current.piece.duration_s;
 const min=current.r?.[0]??0,max=Math.min(current.r?.[1]??a,a);
 seek.min=min;seek.max=Math.max(min+.001,max);seek.value=Math.max(min,Math.min(max,audio.currentTime));
 $('#clock').textContent=`${fmt(waiting?current.r?.[0]??0:audio.currentTime)} / ${fmt(a)}`;
}
function tick(){
 cancelAnimationFrame(ticker);
 if(current?.r&&!waiting&&!audio.seeking&&audio.currentTime>=current.r[1]){audio.pause();audio.currentTime=Math.min(current.r[1],audio.duration);}
 scrubUI();if(!audio.paused)ticker=requestAnimationFrame(tick);
}
function mark(){
 const playing=!audio.paused&&!waiting;deck.classList.toggle('playing',playing);tog.textContent=playing?'❚❚':'▶';tog.setAttribute('aria-label',playing?'暂停':'播放');
 document.querySelectorAll('.play-evidence.active').forEach(b=>b.classList.remove('active')); if(current?.button)current.button.classList.add('active');
}
async function playHere(){const my=++transportToken;try{await audio.play();}catch(e){if(my===transportToken&&current&&!waiting&&e.name!=='AbortError')$('#now-range').textContent=current.label+' · 请按播放继续';}}
async function choose(id,p,r,button=null,label=''){
 const mine=++run; ++transportToken;audio.pause();waiting=true;current={id,piece:p,r,button,label:label|| (r?`${id} · ${rangeText(r)}`:`${id} · 完整文件`)};
 $('#now-title').textContent=p.title;$('#now-range').textContent=current.label+' · 载入中';
 tog.disabled=true;replay.disabled=true;seek.disabled=true;mark();
 try{const url=await mediaURL(p);if(run!==mine)return;
  if(objectMedia!==url){objectMedia=url;audio.src=url;audio.load();}
  if(audio.readyState<1)await new Promise((res,rej)=>{const ok=()=>{off();res()};const bad=()=>{off();rej(Error('媒体解码失败'))};const off=()=>{audio.removeEventListener('loadedmetadata',ok);audio.removeEventListener('error',bad);audio.removeEventListener('abort',bad)};audio.addEventListener('loadedmetadata',ok);audio.addEventListener('error',bad);audio.addEventListener('abort',bad);});
  if(run!==mine)return;
  audio.currentTime=r?.[0]??0; waiting=false;tog.disabled=false;replay.disabled=false;seek.disabled=false;$('#now-range').textContent=current.label;scrubUI();await playHere();
 }catch(e){if(run===mine){waiting=false;$('#now-range').textContent='无法读取录音，请重新点回放';mark()}}
}
for(const evt of ['play','pause','ended','seeking','seeked','timeupdate','loadedmetadata'])audio.addEventListener(evt,()=>{tick();if(evt!=='timeupdate')mark();});
tog.addEventListener('click',()=>{if(!current||waiting)return;if(!audio.paused){++transportToken;audio.pause()}else{if(audio.ended||(current.r&&audio.currentTime>=current.r[1]-.03))audio.currentTime=current.r?.[0]??0;playHere()}});
replay.addEventListener('click',()=>{if(!current||waiting)return;audio.currentTime=current.r?.[0]??0;playHere()});
seek.addEventListener('input',()=>{if(!waiting&&current)audio.currentTime=+seek.value});
const dialog=$('#score-dialog'), scoreTools=$('#score-tools'), image=$('#page-image'), sheet=$('#score-sheet'), scroller=$('#score-scroll');let score=null;
$('#close-score').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{score?.opener?.focus()});
function button(text,handler,cls=''){const b=el('button',cls,text);b.type='button';b.onclick=handler;return b}
function showPage(scroll=true){
 const {p,e,page,region,zoom}=score;image.alt=`${p.title}，PDF 第 ${page} 页`;const path=p.score_page_images[page-1];sheet.style.width=`${zoom*100}%`;
 scoreTools.replaceChildren();const prev=button('‹ 上一页',()=>{score.page--;showPage()});prev.disabled=page===1;scoreTools.append(prev,el('span','',`${page} / ${p.score_pages}`));const next=button('下一页 ›',()=>{score.page++;showPage()});next.disabled=page===p.score_pages;scoreTools.append(next);
 for(const [ch,f] of [['−',.8],['＋',1.25]]){const z=button(ch,()=>{score.zoom=Math.max(1,Math.min(3.05,score.zoom*f));showPage(false)});z.setAttribute('aria-label',ch==='−'?'缩小谱页':'放大谱页');scoreTools.append(z)};
 scoreTools.append(button('回到标框',()=>{score.page=region.page;showPage()}));const pdf=el('a','','原始 PDF ↗');pdf.href=`${p.score}#page=${page}`;pdf.target='_blank';pdf.rel='noopener';scoreTools.append(pdf);
 $('#score-note').textContent=(page===region.page?region.label:'本题标框不在此页。')+` · ${p.title}`;
 const boxes=$('#boxes');boxes.replaceChildren();
 for(const gr of e.score_regions.filter(x=>x.page===page)){
  const b=el('div',gr===region?'score-box current':'score-box');let [x,y,w,h]=gr.rect_norm;b.style.cssText=`left:${x*100}%;top:${y*100}%;width:${w*100}%;height:${h*100}%`;boxes.append(b);
 }
 const focusBox=()=>{if(!dialog.open||score?.page!==page)return;const b=$('.score-box.current');scroller.scrollTop=b?Math.max(0,b.offsetTop-scroller.clientHeight*.23):0;if(b)scroller.scrollLeft=Math.max(0,b.offsetLeft-scroller.clientWidth*.13);else scroller.scrollLeft=0;};
 if(scroll)image.onload=focusBox;else image.onload=null;
 if(image.getAttribute('src')!==path)image.src=path;else if(scroll&&image.complete)requestAnimationFrame(focusBox);
}
function showScore(p,e,region,opener){score={p,e,region,opener,page:region.page,zoom:1};if(!dialog.open)dialog.showModal();showPage();}
const ansString=a=>Array.isArray(a)?a.map(ansString).join('；'):typeof a==='object'?`第 ${a.bar} 小节，第 ${a.beat} 拍`:String(a);
function card(q,a,e,i){
 const p=pieces[q.piece_id], isP=!!p.score,id=q.question_id;
 const ar=el('article','card');ar.id=id;ar.tabIndex=-1;ar.dataset.mode=isP?'piano':'audio';
 const meta=el('div','card-meta');meta.append(el('span','tag',id),el('span','',p.title.replace(/\s{2,}/g,' ')),el('span','topic',topics[i]));
 const title=el('h3','',q.question_zh);title.id=`title-${id}`;ar.setAttribute('aria-labelledby',title.id);
 const eng=el('p','original',q.question_en);eng.lang='en';ar.append(meta,title,eng);
 const inputs={};if(q.choices){const fs=el('fieldset','choices');fs.setAttribute('aria-label','选择一个答案');for(const [k,v] of Object.entries(q.choices)){const lab=el('label','choice'),inp=el('input');inp.type='radio';inp.name=id;inp.value=k;lab.append(inp,el('strong','',k),el('span','',v));inputs[k]=lab;fs.append(lab)}ar.append(fs)}else ar.append(el('p','format',`${q.answer_format} · ${q.answer_quantity}`));
 const ctr=el('div','controls');ar.append(ctr);
 e.audio_ranges_s.forEach((r,j)=>{const b=button(j?'▶ 对照回放':'▶ 证据回放',()=>choose(id,p,r,b),'play-evidence');b.append(el('span','time',rangeText(r)));ctr.append(b)});
 ctr.append(button('全篇',()=>choose(id,p,null)));const sol=el('div','solution');sol.id=`answer-${id}`;
 const rb=button('揭晓答案',()=>{toggle(id,sol.hidden);},'reveal');rb.setAttribute('aria-controls',sol.id);ctr.append(rb);
 sol.append(el('span','answer',q.choices?`${a} · ${q.choices[a]}`:ansString(a)),el('p','',e.explanation));
 if(e.alternative_explanation)sol.append(el('p','distractor',`${q.choices?'辨析':'听辨提示'}｜${e.alternative_explanation}`));
 if(isP){const scoreButtons=el('div','controls scorebuttons');e.score_regions.forEach((region,j)=>{const b=button(`看谱 · 第 ${region.page} 页${e.score_regions.length>1?`（${j+1}）`:''}`,()=>showScore(p,e,region,b));b.title=region.label;scoreButtons.append(b)});sol.append(scoreButtons)};
 ar.append(sol);cards.set(id,{ar,rb,sol,inputs,a,isP});return ar;
}
function toggle(id,on,store=true){const {sol,rb,inputs,a}=cards.get(id);sol.hidden=!on;rb.textContent=on?'收起答案':'揭晓答案';rb.setAttribute('aria-expanded',String(on));if(inputs[a])inputs[a].classList.toggle('correct',on);
 if(!store)return;if(on)opened.add(id);else opened.delete(id);try{localStorage.setItem('lingpu-revealed',JSON.stringify([...opened]))}catch{} updateProgress();}
function updateProgress(){const n=[...opened].filter(x=>cards.has(x)).length;$('#count').textContent=`${n} / 20`;$('#progress').value=n;document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('done',opened.has(a.dataset.id)))}
function filter(mode){document.querySelectorAll('.filters button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));cards.forEach(({ar})=>ar.hidden=mode!=='all'&&ar.dataset.mode!==mode);document.querySelectorAll('#nav [data-mode]').forEach(n=>n.hidden=mode!=='all'&&mode!==n.dataset.mode);}
async function init(){
 const [qs,ps,as,es]=await Promise.all(['questions','pieces','answers','evidence'].map(x=>request(`data/${x}.json`).then(r=>r.json())));
 pieces=Object.fromEntries(ps.map(p=>[p.piece_id,p]));const am=Object.fromEntries(as.answers.map(a=>[a.question_id,a.answer]));const em=Object.fromEntries(es.items.map(e=>[e.question_id,e]));const wrap=$('#cards');
 for(const [i,q] of qs.questions.entries()){wrap.append(card(q,am[q.question_id],em[q.question_id],i));toggle(q.question_id,opened.has(q.question_id),false)};
 const nav=$('#nav');for(const [mode,heading] of [['piano','钢琴 / Piano'],['audio','风格 / Audio']]){const h=el('h3','',heading);h.dataset.mode=mode;nav.append(h);
 for(const p of ps.filter(x=>!!x.score===(mode==='piano'))){const row=el('div','track-row');row.dataset.mode=mode;const div=el('div');for(const q of qs.questions.filter(q=>q.piece_id===p.piece_id)){const a=el('a','',q.question_id);a.href=`#${q.question_id}`;a.dataset.id=q.question_id;div.append(a)}const s=el('span','',p.title.split(' — ')[0]);s.title=p.title;row.append(div,s);nav.append(row)}};
 document.querySelectorAll('.filters button').forEach(b=>b.onclick=()=>filter(b.dataset.mode));updateProgress();$('#load-status').hidden=true;
 if(location.hash&&cards.has(location.hash.slice(1)))requestAnimationFrame(()=>cards.get(location.hash.slice(1)).ar.scrollIntoView());
}
init().catch(e=>{$('#load-status').textContent='无法加载题册。请通过 README 中的本地 HTTP 命令启动。';console.error(e)});
