'use strict';
const $=s=>document.querySelector(s), make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};
let data,events=[],shown=30,currentAudio=null;
const fmt=v=>`${Math.floor(v/60)}:${(v%60).toFixed(2).padStart(5,'0')}`;
const media=p=>'delivery-preview/'+p;
const json=v=>JSON.stringify(v,null,2);
function link(text,href){const a=make('a',text);a.href=href;return a}
function table(headers,rows){const t=make('table'),h=make('thead'),tr=make('tr');headers.forEach(x=>tr.append(make('th',x)));h.append(tr);t.append(h);const b=make('tbody');rows.forEach(row=>{const r=make('tr');row.forEach(x=>r.append(make('td',x)));b.append(r)});t.append(b);return t}
function pauseOthers(except){document.querySelectorAll('audio').forEach(a=>{if(a!==except)a.pause()})}
document.addEventListener('play',e=>{if(e.target.tagName==='AUDIO')pauseOthers(e.target)},true);
function showQuestion(id){
 if(currentAudio){currentAudio.pause();currentAudio=null}
 const q=data.questions.find(x=>x.question_id===id),p=data.pieces.find(x=>x.piece_id===q.piece_id),wrap=$('#question-detail');wrap.replaceChildren();
 document.querySelectorAll('#question-tabs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.q===id)));
 const meta=make('div',null,'question-result');meta.append(make('b',`${id} · ${q.score.points}/5`,q.score.passed?'pass-text':'fail-text'),make('span',`${q.piece_id} · ${q.source.source_question_id}`));
 wrap.append(meta,make('h3',q.question_zh),make('p',q.question_en,'original'));
 if(q.choices){const list=make('ul',null,'choice-list');Object.entries(q.choices).forEach(([k,v])=>list.append(make('li',k+' · '+v)));wrap.append(list)}
 const ans=make('div',null,'answer-grid');for(const [title,value] of [['模型实际作答（原JSON）',json(q.original_answer)],['作者接受答案',q.score.accepted_answers.map(a=>q.choices?`${a} · ${q.choices[a]}`:a).join(' / ')]]){const d=make('div');d.append(make('b',title),make('span',value));ans.append(d)}wrap.append(ans);
 if(typeof q.original_answer!=='string')wrap.append(make('p','格式适配评分文本：'+q.score.answer,'small'));
 wrap.append(make('p',`来源：${q.source.source_dataset} · ${q.source.difficulty||q.source.source_difficulty||'固定原题'}`,'small'));
 wrap.append(make('h3','模型提交的证据回放'));
 const a=make('audio');a.controls=true;a.preload='none';a.src=media(p.audio);currentAudio=a;let end=null;
 a.addEventListener('timeupdate',()=>{if(end!=null&&!a.paused&&a.currentTime>=end){a.pause();end=null}});
 const controls=make('div',null,'controls');q.evidence.audio_ranges_s.forEach((r,i)=>{const b=make('button',`${i?'对照':'回放'} ${fmt(r[0])}–${fmt(r[1])}`);b.type='button';b.onclick=async()=>{pauseOthers(a);if(a.readyState<1){a.load();await new Promise((res,rej)=>{a.addEventListener('loadedmetadata',res,{once:true});a.addEventListener('error',rej,{once:true})})}a.currentTime=r[0];end=r[1];a.play().catch(()=>{})};controls.append(b)});
 wrap.append(controls,a,make('p',p.piece_id.startsWith('P')?'钢琴MP3试听转码；原WAV在冻结下载包。':'来源原字节MP3。时间以本地截段起点为0。','small'));
 const exp=make('details'),summ=make('summary','查看模型解释（可能错误）');exp.append(summ,make('p',q.evidence.explanation));if(q.evidence.alternative_explanation)exp.append(make('p',q.evidence.alternative_explanation));wrap.append(exp);
 if(p.score&&q.evidence.score_regions?.length){
  const label=make('p',null,'small'),view=make('div',null,'score-view'),img=make('img'),boxes=make('div');img.loading='lazy';view.append(img,boxes);
  const regionControls=make('div',null,'controls');
  function region(r){img.src=media(p.score_page_images[r.page-1]);img.alt=`${id} 模型引用的原谱第${r.page}页及模型标框`;boxes.replaceChildren();const box=make('span',null,'score-rect');const [x,y,w,h]=r.rect_norm;box.style.cssText=`left:${x*100}%;top:${y*100}%;width:${w*100}%;height:${h*100}%`;boxes.append(box);label.textContent=`模型选区：第${r.page}页 · ${r.label||''}。框的位置来自原evidence.json，不保证语义正确。`}
  q.evidence.score_regions.forEach((r,i)=>{const b=make('button',`谱面证据${i+1} · 第${r.page}页`);b.onclick=()=>region(r);regionControls.append(b)});region(q.evidence.score_regions[0]);wrap.append(regionControls,label,view,link('原始乐谱PDF ↗',media(p.score)));
 }
 $('#question-count').textContent=`${id} / 20 · 绿色正确，淡红错误`;
}
function renderTraces(){
 const mode=$('#trace-filter').value,search=$('#trace-search').value.toLowerCase(),filtered=events.filter(e=>(mode==='all'||e.action.action===mode)&&json(e).toLowerCase().includes(search));
 $('#trace-list').replaceChildren();filtered.slice(0,shown).forEach(e=>{const d=make('details',null,'trace-row'),s=make('summary'),label=e.action.params?.command?.split('\n')[0]||e.action.params?.question||e.action.params?.paths?.join(', ')||'提交';s.append(make('span',e.tool_log,'trace-label'),make('b',e.action.action),make('span',label.slice(0,140)));d.append(s);d.addEventListener('toggle',()=>{if(d.open&&!d.dataset.loaded){d.append(make('h3','实际工具参数'),make('pre',json(e.action.params||{})),make('h3','实际工具返回'),make('pre',json(e.result||e)));d.dataset.loaded='true'}});$('#trace-list').append(d)});
 $('#trace-count').textContent=`${filtered.length} / ${events.length} 条`;$('#trace-more').hidden=shown>=filtered.length;
}
async function init(){
 const [d,t,ins]=await Promise.all([fetch('data/case.json').then(r=>r.json()),fetch('records/trajectory.json').then(r=>r.json()),fetch('files/task/INSTRUCTION.md').then(r=>r.text())]);data=d;events=t;$('#instruction').textContent=ins;
 for(const p of data.pieces){const card=make('details',null,'panel'),s=make('summary',`${p.piece_id} · ${p.title}`);card.append(s);const a=make('audio');a.controls=true;a.preload='none';a.src=media(p.audio);card.append(a,make('p',p.score?`${p.score_pages}页乐谱 · ${(p.duration_s/60).toFixed(1)}分钟完整演奏`:'官方原始音乐截段 · 无虚构总谱','small'));if(p.score)card.append(link('查看原谱PDF ↗',media(p.score)));$('#input-grid').append(card)}
 for(const q of data.questions){const b=make('button',q.question_id,q.score.passed?'pass':'fail');b.dataset.q=q.question_id;b.type='button';b.onclick=()=>showQuestion(q.question_id);$('#question-tabs').append(b)}
 $('#all-scores').append(table(['题号 / 来源','实际评分文本','作者接受答案','分数'],data.questions.map(q=>[q.question_id+' / '+q.source.source_question_id,q.score.answer,q.score.accepted_answers.join(' / '),q.score.points+' / 5'])));
 const changes=data.result.transport_normalization.changes;$('#transport').append(table(['题号','原JSON','无损文本表示'],changes.map(x=>[x.question_id,json(x.original),x.serialized])));
 showQuestion('Q01');renderTraces();['#trace-filter','#trace-search'].forEach(s=>$(s).addEventListener(s.includes('search')?'input':'change',()=>{shown=30;renderTraces()}));$('#trace-more').onclick=()=>{shown+=30;renderTraces()};document.documentElement.dataset.ready='true';
}
init().catch(e=>{$('#question-detail').textContent='数据加载失败，请刷新或查看原始下载。';console.error(e)});
