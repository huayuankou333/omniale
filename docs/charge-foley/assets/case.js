'use strict';
const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>Number(x).toFixed(2), short=x=>Number(x).toFixed(2).replace(/\.00$/,'');
let data;
function pauseOther(current){document.querySelectorAll('video').forEach(v=>{if(v!==current)v.pause()})}
async function playModel(slug,stage,start=0){
 const v=$('#video-'+slug),select=$('#stage-'+slug);select.value=stage;
 pauseOther(v);const src=`media/${slug}-${stage}.mp4`;
 if(!v.currentSrc.endsWith(src)){v.src=src;await new Promise((resolve,reject)=>{v.addEventListener('loadedmetadata',resolve,{once:true});v.addEventListener('error',reject,{once:true})})}
 v.currentTime=start;v.scrollIntoView({behavior:'smooth',block:'center'});if(start>0)await v.play().catch(()=>{});
 $('#caption-'+slug).textContent=stage==='v1'?'首版 · 90秒 · 原AAC音轨':'固定返修版 · 88秒 · 原AAC音轨';
}
function renderModels(){
 $('#model-cards').innerHTML=data.models.map(m=>{const s=m.run_statistics;return `<article class="card result" id="result-${m.slug}"><div class="result-top"><h3>${esc(m.model)}</h3><div class="score">${fmt(m.total)}<small> / 100</small></div></div><p class="score-split">工程上限 ${m.engineering_cap} · 内容 ${fmt(m.categories.C)}<br>同步 ${fmt(m.categories.T)} · 混音 ${fmt(m.categories.M)}</p><div class="score-track" aria-hidden="true">${['C','T','M'].map(k=>`<span class="part-${k}" style="width:${m.categories[k]}%"></span>`).join('')}</div><video id="video-${m.slug}" controls playsinline preload="metadata" src="media/${m.slug}-v2.mp4" poster="media/${m.slug}-v2.jpg" aria-label="${esc(m.model)}交付视频"></video><div class="stage-control"><label for="stage-${m.slug}">交付版本</label><select id="stage-${m.slug}" data-model-stage="${m.slug}"><option value="v2">返修版 · 88秒</option><option value="v1">首版 · 90秒</option></select></div><p id="caption-${m.slug}" class="caption">固定返修版 · 88秒 · 原AAC音轨</p><p class="caption result-stat">${s.tool_calls}次工具 · ${s.api_turns}轮API<br>${s.searches}次搜索 · ${s.downloads}次下载 · ${s.audio_listens}次音频观察</p><div class="downloads"><a href="traces.html?model=${m.slug}">完整轨迹 →</a><a href="records/${m.slug}/project-and-manifests.zip" download>工程与记录 ↓</a><a href="records/${m.slug}/score.json">分数JSON</a></div></article>`}).join('');
 document.querySelectorAll('[data-model-stage]').forEach(el=>el.addEventListener('change',()=>playModel(el.dataset.modelStage,el.value)));
 document.querySelectorAll('video').forEach(v=>v.addEventListener('play',()=>pauseOther(v)));
}
function evidence(e,m,r){
 const reasonKey=r.id[0]==='C'?'content_reason':r.id.startsWith('T')?'timing_reason':'foreground_reason';
 const label=e.event_name||e.category||e.id||'核验依据';
 const a=e.timeline_start??e.approx_seconds?.[0]??0;
 const timeline=e.target_intervals_seconds?.map(z=>z.map(short).join('–')).join('、');
 return `<div class="component"><b>${esc(e.event_id||'')} ${esc(label)}</b>${e.q===undefined?'':` · q=${e.q}`}${e.uncertain?'<span class="tag">不确定</span>':''}${e.audio_first_conflict?'<span class="tag">先听后看冲突</span>':''}${timeline?`<p class="caption">${esc(e.stage)} · 动作窗口 ${timeline} 秒</p>`:''}${e.stage?`<button class="seek" data-slug="${m.slug}" data-stage="${e.stage}" data-time="${a}">定位 ${e.stage} · ${short(a)}秒</button>`:''}${e.actually_audible?`<p>听到：${esc(e.actually_audible)}</p>`:''}${e[reasonKey]?`<p>${esc(e[reasonKey])}</p>`:''}${e.evidence?`<p>${esc(e.evidence)}</p>`:''}${e.uncertainty_reason?`<p class="caption">待核对：${esc(e.uncertainty_reason)}</p>`:''}${e.file?`<p class="method">${esc(e.file)}</p>`:''}</div>`
}
function renderRubrics(){
 const filter=$('#rubric-filter').value;
 $('#rubric-list').innerHTML=data.models[0].rubric.filter(r=>filter==='all'||r.id[0]===filter).map(base=>{
  const rows=data.models.map(m=>m.rubric.find(r=>r.id===base.id));
  return `<details class="criterion" data-id="${base.id}"><summary><span class="criterion-id">${base.id}</span><span class="criterion-name">${esc(base.criterion)}</span><span class="criterion-max">/${short(base.max_points)}</span><span class="criterion-scores">${rows.map(r=>`<span>${fmt(r.points)}</span>`).join('')}</span></summary><div class="criterion-rule">${esc(base.evidence_rule)}</div><div class="judgment-grid">${rows.map((r,i)=>{const m=data.models[i];return `<article><h4>${esc(m.model)} · ${fmt(r.points)}/${short(r.max_points)}</h4>${r.stage_details?`<p>首版 ${fmt(r.stage_details.v1.points)}；返修 ${fmt(r.stage_details.v2.points)}；30% / 70% 加权。</p>`:''}<p>${esc(r.reason)}</p><p class="method">${esc(r.method)}</p>${r.evidence.map(e=>evidence(e,m,r)).join('')}</article>`}).join('')}</div></details>`
 }).join('');
 document.querySelectorAll('[data-time]').forEach(el=>el.addEventListener('click',()=>playModel(el.dataset.slug,el.dataset.stage,Number(el.dataset.time))));
}
function renderAnalysis(){
 $('#analysis-cards').innerHTML=data.models.map(m=>{
  const low=[...m.rubric].filter(r=>r.id[0]==='C'||r.id==='T02').sort((a,b)=>a.points/a.max_points-b.points/b.max_points).slice(0,3);
  return `<article class="card"><h3>${esc(m.model)}</h3><p class="caption">以下为自动判断提出的优先人工复核项</p><ul>${low.map(r=>`<li><a href="#rubric" data-open-rubric="${r.id}">${r.id} ${esc(r.criterion)}</a>：${fmt(r.points)}/${short(r.max_points)}</li>`).join('')}</ul><p>不确定事件 ${m.uncertain_events}/100；先听后看冲突 ${m.audio_first_conflicts}/100。标记数量不代表错误率。</p><a href="review.html">试听、改分与导出人工意见 →</a></article>`
 }).join('');
 document.querySelectorAll('[data-open-rubric]').forEach(el=>el.addEventListener('click',()=>{ $('#rubric-filter').value='all';renderRubrics();const d=document.querySelector(`.criterion[data-id="${el.dataset.openRubric}"]`);d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'})}));
}
async function init(){
 const response=await fetch('results.json');if(!response.ok)throw new Error('评分文件加载失败');data=await response.json();
 renderModels();renderRubrics();renderAnalysis();$('#gate-results').innerHTML=data.models.map(m=>`<p><b>${esc(m.model)}</b>：上限${m.engineering_cap}；${m.gates.filter(g=>!g.passed).map(g=>esc(g.id+' '+g.criterion)).join('；')||'全部工程门槛通过'}</p>`).join('');$('#rubric-filter').addEventListener('change',renderRubrics);
 $('#input-stage').addEventListener('change',e=>{const stage=e.target.value;$('#input-video').src=`media/input-${stage}.mp4`;$('#input-video').poster=`media/input-${stage}.jpg`});
 $('#reference-stage').addEventListener('change',e=>{const stage=e.target.value,v=$('#reference-video');v.pause();v.src=`media/reference-${stage}.mp4`;v.poster=`media/input-${stage}.jpg`;$('#reference-caption').textContent=stage==='v1'?'原电影 00:48.000–02:18.000，保留官方混音播放增益；网页画面缩放至1280×536。':'按返修画面删除首版[4,5)秒与[66,67)秒，合计88秒；未执行环境总线降低4 dB。'});
 const traces=await (await fetch('data/traces.json')).json();
 $('#trace-summary').innerHTML=`<table><thead><tr><th>模型</th><th>工具记录</th><th>留存画面引用</th><th>REAPER渲染调用</th><th>Shotcut导出调用</th><th>完整记录</th></tr></thead><tbody>${traces.map(m=>`<tr><td>${esc(m.model)}</td><td>${m.events}</td><td>${m.images}</td><td>${m.actions.render_reaper||0}</td><td>${m.actions.render_shotcut||0}</td><td><a href="traces.html?model=${m.slug}">浏览 →</a></td></tr>`).join('')}</tbody></table>`;
 $('#page-status').textContent='三模型交付与75项评分已加载';
}
init().catch(e=>{const p=document.createElement('p');p.className='note warn';p.textContent=e.message+'。可通过完整文字评分链接阅读结果；本地文件建议使用HTTP预览。';$('#results').append(p)});
