'use strict';
(()=>{
const base='../../', $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const segment=(id,fn)=>$$(id+' button').forEach(b=>b.addEventListener('click',()=>{activate(id,b.dataset.value);fn(b.dataset.value);}));
const activate=(id,value)=>$$(id+' button').forEach(b=>{b.classList.toggle('active',b.dataset.value===value);b.setAttribute('aria-pressed',String(b.dataset.value===value));});
const video=$('#case-video');let videoModel='reference',camera='ego',videoMax=586,desiredStep=0;
const names={reference:'官方参考示范',sol:'GPT-6.1 Sol',luna:'GPT-6 Luna'},cameras={ego:'主相机',wrist_left:'左腕相机',wrist_right:'右腕相机'};
function changeVideo(model=videoModel,cam=camera,step=0){
 videoModel=model;camera=cam;desiredStep=step;videoMax=model==='reference'?586:1500;video.pause();
 video.src=`${base}assets/dexjoco-assembly/${model}-${cam}.mp4`;
 video.poster=model==='reference'?`${base}assets/dexjoco-assembly/reference-${cam}-initial.png`:`${base}assets/dexjoco-assembly/${model}-${cam}-0.jpg`;
 video.setAttribute('aria-label',`${names[model]} · ${cameras[cam]} · ${model==='reference'?'参考回放':'首个完整评测回合'}`);
 $('#video-download').href=video.src;$('#video-step').max=videoMax;$('#video-step').value=step;$('#step-label').textContent=`${step} / ${videoMax}`;
 $('#video-corner').textContent=model==='reference'?'DEMO REPLAY / NON-SCORE':'RAND_OBJ / SEED 0 / EPISODE 01';
 $('#video-caption').textContent=model==='reference'?'参考示范回放 · 非模型成绩':`${names[model]} · 第 1 回合 · 失败`;
 $('#video-explanation').textContent=model==='reference'?'当前播放官方人类示范的初态恢复回放，第 586 步触发成功。它验证任务可执行，不代表任何受测模型的成绩。切换模型查看首个完整失败回合。':`当前播放 ${names[model]} 冻结提交在 rand_obj / seed 0 的首个完整失败回合。1500 步内未触发成功；不是开发期间的自测视频。`;
 activate('#video-model',model);activate('#video-camera',cam);video.load();
}
video.addEventListener('loadedmetadata',()=>{if(desiredStep>0)video.currentTime=Math.min(desiredStep/30,Math.max(0,video.duration-.04));});
video.addEventListener('timeupdate',()=>{const step=Math.min(videoMax,Math.round(video.currentTime*30));$('#video-step').value=step;$('#step-label').textContent=`${step} / ${videoMax}`;});
$('#video-step').addEventListener('input',e=>{video.pause();desiredStep=Number(e.target.value);if(video.readyState>=1)video.currentTime=Math.min(desiredStep/30,video.duration-.04);$('#step-label').textContent=`${desiredStep} / ${videoMax}`;});
segment('#video-model',m=>changeVideo(m,camera,0));segment('#video-camera',c=>changeVideo(videoModel,c,Math.min(videoMax,Math.round(video.currentTime*30))));
let frameModel='sol',frameCamera='ego';
function renderFrames(){
 $('#frame-strip').innerHTML=[0,300,600,900,1200,1500].map(step=>`<button class="frame-item" data-step="${step}" aria-label="查看 ${names[frameModel]} ${cameras[frameCamera]} 第 ${step} 步"><img src="${base}assets/dexjoco-assembly/${frameModel}-${frameCamera}-${step}.jpg" alt="${names[frameModel]} 的 ${cameras[frameCamera]}，控制步 ${step}" loading="lazy"><span>STEP ${String(step).padStart(4,'0')} <b>↗</b></span></button>`).join('');
 $('#behavior-note').textContent=frameModel==='sol'?'首回合可见：抓起并调整销的姿态、靠近托盘，后段未形成满足孔底持续接触判据的插入。具体失败分支未被日志直接记录。':'首回合可见：左手接近托盘，右手反复夹取或重抓销；未形成稳定搬运、对齐与插入序列。';
 $$('.frame-item').forEach(b=>b.addEventListener('click',()=>{changeVideo(frameModel,frameCamera,Number(b.dataset.step));$('#overview').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}));
}
segment('#frame-model',m=>{frameModel=m;renderFrames();});segment('#frame-camera',c=>{frameCamera=c;renderFrames();});renderFrames();
fetch(base+'files/dexjoco-assembly/task.md').then(r=>{if(!r.ok)throw Error(r.status);return r.text();}).then(t=>$('#instruction-text').textContent=t).catch(()=>$('#instruction-text').textContent='载入失败，请通过文件区查看原始题面。');
const fetchJSON=async url=>{const r=await fetch(url);if(!r.ok)throw Error(`${r.status} ${url}`);return r.json();};
fetchJSON(base+'data/dexjoco-assembly.json').then(async data=>{
 const model=id=>data.models.find(m=>m.id===id);
 $('#result-table tbody').innerHTML=['sol','luna'].map(id=>{const m=model(id),c=m.conditions.rand_obj;return `<tr><td>${m.label}</td><td>${id==='luna'?'达到 2 h 上限':'约 1 h 59 min'}</td><td>${c.success} / ${c.completed}</td><td>${c.completed?(100*c.success/c.completed).toFixed(1)+'%':'未测试'}</td><td>未测试</td><td>按用户要求停止</td></tr>`;}).join('');
 $('#paper-table tbody').innerHTML=data.paper_baselines.map(m=>`<tr><td>${m.model}</td><td>${m.rand_obj[0].toFixed(1)} ± ${m.rand_obj[1].toFixed(1)}</td><td>${m.rand_full[0].toFixed(1)} ± ${m.rand_full[1].toFixed(1)}</td></tr>`).join('');
 let episodeModel='sol',condition='rand_obj',seed=0,selected=0;
 function renderEpisodes(){
  const m=model(episodeModel),all=m.conditions[condition].episodes,records=all.filter(e=>e.seed===`seed${seed}`),record=records.find(e=>e.index===selected);
  $('#episode-summary').textContent=`${m.label} · ${condition} · seed ${seed} · ${records.filter(e=>e.outcome==='success').length}/${records.length} 成功`;
  $('#episode-grid').innerHTML=Array.from({length:50},(_,i)=>{const r=records.find(e=>e.index===i),state=r?.outcome||'pending';return `<button class="episode-cell ${state} ${selected===i?'selected':''}" data-index="${i}" aria-pressed="${selected===i}" aria-label="第 ${i+1} 回合：${state==='failure'?'已完成，失败':state==='success'?'已完成，成功':'未计分'}">${String(i+1).padStart(2,'0')}</button>`;}).join('');
  const status=record?(record.outcome==='success'?'成功':'失败'):'未计分';
  $('#episode-detail').innerHTML=`<span class="eyebrow">EPISODE ${String(selected+1).padStart(2,'0')}</span><h3>${m.label}</h3><span class="result-pill ${record?.outcome==='failure'?'collision':record?.outcome==='success'?'pass':'pending'}">${status}</span><dl><div><dt>随机化条件</dt><dd>${condition}</dd></div><div><dt>评测种子</dt><dd>${seed}</dd></div><div><dt>原始回合索引</dt><dd>${selected}（从 0 开始）</dd></div><div><dt>成功计分</dt><dd>${record?(record.outcome==='success'?'1':'0'):'无结果'}</dd></div></dl>${record?`<p class="record-path">${esc(record.path)}</p><p class="caption">结果来自官方评测器目录，并与原始日志核对。${selected===0?'本回合三路视频已在上方提供。':'本回合完整录像保存在服务器归档，本页未打包。'}</p>`:'<p class="caption">尚未完成或未执行；不纳入成功率分母，也不计为失败。</p>'}${record&&selected===0?'<button class="text-button" id="watch-episode">查看此回合视频 ↑</button>':''}`;
  $$('.episode-cell').forEach(b=>b.addEventListener('click',()=>{selected=Number(b.dataset.index);renderEpisodes();}));
  $('#watch-episode')?.addEventListener('click',()=>{changeVideo(episodeModel,'ego',0);$('#overview').scrollIntoView({behavior:'smooth'});});
 }
 segment('#episode-model',id=>{episodeModel=id;selected=0;renderEpisodes();});$('#condition-select').addEventListener('change',e=>{condition=e.target.value;selected=0;renderEpisodes();});$('#seed-select').addEventListener('change',e=>{seed=Number(e.target.value);selected=0;renderEpisodes();});renderEpisodes();
 let traceModel='sol',traceLimit=10,traceRecords=[],traceRevision=0;
 function traceEntry(r){
  const details=document.createElement('details');details.className='trace-entry';
  const title=r.kind==='command'?r.command.split('\n').find(s=>s.trim()):r.kind==='message'?r.text.split('\n')[0]:r.changes.map(c=>c.path).join(', ');
  details.innerHTML=`<summary><span class="trace-time">#${String(r.sequence).padStart(3,'0')}</span><span class="trace-kind">${r.kind==='command'?'TOOL':r.kind==='message'?'AGENT':'FILES'}</span><span class="trace-heading">${esc(title||'记录')}</span><span class="trace-toggle">＋</span></summary>`;
  details.addEventListener('toggle',()=>{if(!details.open||details.querySelector('.trace-body'))return;const body=document.createElement('div');body.className='trace-body';if(r.kind==='message'){const p=document.createElement('p');p.className='trace-message';p.textContent=r.text;body.append(p);}else if(r.kind==='command'){for(const [label,text] of [['COMMAND',r.command],[`OUTPUT · exit ${r.exit_code??'未记录'}`,r.output]]){const h=document.createElement('h4');h.textContent=label;const pre=document.createElement('pre');pre.textContent=text;body.append(h,pre);}}else{const pre=document.createElement('pre');pre.textContent=JSON.stringify(r.changes,null,2);body.append(pre);}details.append(body);});return details;
 }
 function renderTraces(){
  const query=$('#trace-search').value.trim().toLowerCase(),list=traceRecords.filter(r=>!query||JSON.stringify(r).toLowerCase().includes(query));
  $('#trace-list').replaceChildren(...list.slice(0,traceLimit).map(traceEntry));if(!list.length)$('#trace-list').innerHTML='<p class="no-traces">没有匹配记录。</p>';
  $('#trace-count').textContent=`显示 ${Math.min(traceLimit,list.length)} / ${list.length} 条记录`;
  $('#load-traces').hidden=traceLimit>=list.length;
 }
 async function loadTraces(id){
  const revision=++traceRevision;traceModel=id;traceLimit=10;$('#trace-search').value='';$('#expand-traces').textContent='展开当前记录';
  const m=model(id);$('#trace-download').href=`${base}files/dexjoco-assembly/${id}/trajectory.json`;
  $('#trace-stats').innerHTML=`<div><span>开发用时</span><b>${(m.agent_duration_seconds/60).toFixed(2)} min</b></div><div><span>已完成命令</span><b>${m.completed_commands}</b></div><div><span>可见记录</span><b>${m.trajectory_records}</b></div><div><span>输出 token</span><b>${m.usage?m.usage.output_tokens.toLocaleString('en-US'):'未结算'}</b></div>`;
  $('#trace-list').textContent='正在载入轨迹…';const t=await fetchJSON(`${base}files/dexjoco-assembly/${id}/trajectory.json`);if(revision!==traceRevision)return;traceRecords=t.records;renderTraces();
 }
 segment('#trace-model',id=>loadTraces(id).catch(showError));$('#trace-search').addEventListener('input',()=>{traceLimit=10;renderTraces();});$('#load-traces').addEventListener('click',()=>{traceLimit+=15;renderTraces();});$('#expand-traces').addEventListener('click',()=>{const entries=$$('.trace-entry'),open=entries.some(e=>!e.open);entries.forEach(e=>e.open=open);$('#expand-traces').textContent=open?'收起当前记录':'展开当前记录';});
 async function loadPolicy(id){const m=model(id);$('#policy-code').textContent='正在载入策略…';$('#policy-sha').textContent='SHA256 · '+m.policy_sha256;$('#policy-download').href=`${base}files/dexjoco-assembly/${id}/submission.zip`;const r=await fetch(`${base}files/dexjoco-assembly/${id}/policy.py`);if(!r.ok)throw Error(r.status);$('#policy-code').textContent=await r.text();}
 $('#policy-model').addEventListener('change',e=>loadPolicy(e.target.value).catch(showError));
 await Promise.all([loadTraces('sol'),loadPolicy('sol')]);document.body.dataset.ready='true';
}).catch(showError);
function showError(error){console.error(error);const message=document.createElement('p');message.className='error-message';message.textContent='部分数据未能载入，请使用文件区的原始题面、报告与轨迹。';$('#results').prepend(message);}
const observer=new IntersectionObserver(entries=>{const entry=entries.find(e=>e.isIntersecting);if(entry)$$('.section-nav a').forEach(a=>a.classList.toggle('active',a.hash===`#${entry.target.id}`));},{rootMargin:'-10% 0px -65% 0px',threshold:0});$$('.detail-section').forEach(s=>observer.observe(s));
})();
