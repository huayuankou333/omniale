'use strict';
const $=s=>document.querySelector(s), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,n=2)=>Number(v).toFixed(n), time=s=>`${Math.floor(s/60)}:${(s%60).toFixed(2).padStart(5,'0')}`, ms=v=>Number.isFinite(v)?`${v>=0?'+':''}${Math.round(v*1000)} ms`:'无有效匹配';
const release='https://github.com/huayuankou333/omniale/releases/download/adr-take360-gated-20261113/';
let data,active='sol',shot='S01',events=[],visible=30,requestId=0,candidateList=[],currentCandidate='',traceCache=new Map();
const model=()=>data.models.find(m=>m.slug===active), target=()=>data.targets.find(s=>s.id===shot);
async function json(path){const r=await fetch(path);if(!r.ok)throw Error(`${path}: HTTP ${r.status}`);return r.json()}
const names={sol:'GPT-6.1 Sol',terra:'GPT-6.1 Terra',deepseek:'DeepSeek V4.1 Flash 1017'};
const catTitle={C:'人物、台词与表演',T:'音画同步代理',Q:'听感与混音'};
function seek(second,scroll=false){
 for(const v of [$('#delivery'),$('#reference')]){
  const set=()=>{v.currentTime=Math.max(0,Math.min(second,(Number.isFinite(v.duration)?v.duration:91.5)-.01))};
  if(v.readyState>=1)set();else v.addEventListener('loadedmetadata',set,{once:true});
 }
 $('#player-message').textContent=`已定位 ${time(second)}；点击播放开始复核。`;
 if(scroll)$('#results').scrollIntoView({behavior:'smooth',block:'start'});
}
function chooseShot(sid,{scroll=false,move=true}={}){
 shot=sid;$('#shot-select').value=sid;
 const s=target();$('#current-shot').textContent=`${sid} · ${time(s.start)}–${time(s.end)} · 角色 ${s.role}${s.revised?' · 四句返修之一':''}`;
 renderShot();
 $$('#shot-grid [data-shot]').forEach(b=>b.classList.toggle('active',b.dataset.shot===sid));
 if(move)seek(s.start,scroll);
}
function $$(s){return [...document.querySelectorAll(s)]}
function scoreTable(){
 $('#score-table').innerHTML='<div class="table-wrap"><table><thead><tr><th>模型</th><th>内容 / 60</th><th>同步 / 30</th><th>听感混音 / 10</th><th>工程门槛</th><th>总分 / 100</th></tr></thead><tbody>'+data.models.map(m=>`<tr><td class="model-name">${esc(m.model)}</td><td>${fmt(m.category_scores.identity_content_performance)}</td><td>${fmt(m.category_scores.audiovisual_sync)}</td><td>${fmt(m.category_scores.quality)}</td><td>5/5 通过 · 上限 ${m.engineering_cap}</td><td class="total">${fmt(m.total)}</td></tr>`).join('')+'</tbody></table></div>';
 $('#gate-table').innerHTML='<div class="table-wrap"><table><thead><tr><th>门槛</th><th>检查</th><th>失败上限</th>'+data.models.map(m=>`<th>${esc(names[m.slug])}</th>`).join('')+'</tr></thead><tbody>'+data.models[0].gates.map((g,i)=>`<tr><td>${g.id}</td><td>${esc(g.name)}</td><td>${g.cap_on_failure}</td>${data.models.map(m=>`<td class="${m.gates[i].passed?'status-pass':'status-fail'}">${m.gates[i].passed?'通过':'未通过'}</td>`).join('')}</tr>`).join('')+'</tbody></table></div>';
}
function renderPlayer(){
 const m=model(),stage=$('#delivery-stage').value,oldTime=$('#delivery').currentTime||0;
 $('#delivery').pause();$('#reference').pause();
 $('#delivery').src=`media/${active}-${stage}.mp4`;
 $('#delivery-title').textContent=`${names[active]} · ${stage}${stage==='v2'?' 最终成片':' 返修前成片（不计本页分数）'}`;
 $('#delivery-links').innerHTML=`<a href="${release}${active}-v2-original.mp4">原始 v2 MP4 ↓</a><a href="${release}${active}-portable-v2.zip">完整 v2 工程与媒体 ↓</a><a href="records/${active}-v2-audio_plan.json">实际音频计划</a><a href="records/${active}-v2-edit_log.json">逐句日志</a>`;
 const s=m.statistics;
 $('#run-stats').innerHTML=`<span><b>${s.api_turns}</b> 回合</span><span><b>${s.tool_calls}</b> 次工具</span><span><b>${s.frames}</b> 帧</span><span><b>${s.audio_calls}</b> 次外部听觉</span><span><b>${s.renders}</b> 次 REAPER 尝试</span><span>有效编辑 <b>${fmt(s.active_minutes,1)}</b> 分钟</span><span><b>主动完成</b> · model_finish</span><span>工具报错 <b>${s.tool_errors}</b> 次</span>`;
 seek(oldTime);setHearing('output');
}
function setHearing(which){$('#delivery').muted=which!=='output';$('#reference').muted=which!=='reference';$('#hear-output').classList.toggle('active',which==='output');$('#hear-reference').classList.toggle('active',which==='reference')}
function selectedRubrics(){const f=$('#rubric-filter').value;return model().rubrics.filter(r=>f==='all'||r.id.startsWith(f))}
function renderRubrics(){
 const rows=selectedRubrics();$('#rubric-count').textContent=`${rows.length} / 20 项 · ${names[active]} · 最终 v2`;
 $('#rubric-comparison').innerHTML='<table><thead><tr><th>Rubric</th><th>镜头 / 维度</th><th>满分</th>'+data.models.map(m=>`<th>${esc(names[m.slug])}</th>`).join('')+'</tr></thead><tbody>'+rows.map(r=>`<tr><td>${r.id}</td><td>${esc(r.shots?.join(' · ')||catTitle.Q)}</td><td>${fmt(r.weight)}</td>${data.models.map(m=>`<td>${fmt(m.rubrics.find(x=>x.id===r.id).score_unrounded)}</td>`).join('')}</tr>`).join('')+'</tbody></table>';
 $('#rubric-list').innerHTML=rows.map(r=>{
  const label=r.shots?.join(' · ')|| (r.id==='Q01'?'24 镜头匿名听感':'LUFS / 真峰值 / 数字削波');
  return `<details id="rubric-${r.id}"><summary>${r.id} · ${esc(label)}<span class="score">${fmt(r.score_unrounded)} / ${fmt(r.weight)}</span></summary><p>${esc(r.rule)}</p>${(r.shots||[]).map(sid=>`<button data-seek-shot="${sid}">${sid} · 定位 ${time(data.targets.find(s=>s.id===sid).start)}</button>`).join(' ')}<pre>${esc(JSON.stringify(r.evidence,null,2))}</pre></details>`;
 }).join('');
}
function renderShot(){
 const m=model(),s=target(),e=m.shot_evidence[shot],src=e.source,t=e.timing,a=e.auditory_judge;
 const used=[...new Map(src.used.map(u=>[u.candidate,u])).values()];
 const sourceRows=used.map(u=>`<tr><td data-label="候选">${esc(u.candidate)}</td><td data-label="来源演员">${esc(u.actor_role)} / 演员 ${String(u.actor).padStart(2,'0')}</td><td data-label="来源表演标签">${esc(u.emotion_name)}<br>${esc(u.intensity_name)}</td><td data-label="放置轨道">角色轨 ${esc(u.role_track)}</td><td data-label="原候选试听 / MP3"><audio controls preload="none" src="media/candidates/${u.candidate}.mp3" aria-label="实际使用候选 ${u.candidate}"></audio></td></tr>`).join('');
 const valid=t.valid;
 $('#shot-detail').innerHTML=`<h3>${shot} · ${names[active]} 最终 v2 <span class="badge ${e.content_points<2.5?'warn':''}">内容 ${fmt(e.content_points)} / 2.50 · 同步 ${fmt(e.sync_points)} / 1.25</span></h3><p><b>评后核对目标：</b>角色 ${s.role}（演员 ${String(s.actor).padStart(2,'0')}） · ${esc(s.emotion)} · ${esc(s.intensity_v2)}${s.revised?`。返修前为 ${esc(s.intensity_v1)}，此处按返修要求判分`:''}。<br><b>台词：</b>${esc(s.statement)}</p><div class="controls"><button data-seek-shot="${shot}">定位成片 ${time(s.start)}</button><button data-calibration="${s.role}">听目标角色 ${s.role} 校准声</button></div><div class="evidence-facts"><div><b>身份活动来源占比</b>${fmt(src.actor*100,1)}% · ${src.actor>=.98?'身份正确':'未达 98% 门槛'}</div><div><b>正确句子来源占比</b>${fmt(src.statement*100,1)}%</div><div><b>正确来源发声保留覆盖</b>${fmt(src.retained_source_speech_coverage*100,1)}%<br><small>错演员或错句时可为 0，不等于完全无声。</small></div><div><b>起点误差 / 声学代理</b>${valid?ms(t.onset_error_s):'无有效匹配'}</div><div><b>终点误差 / 声学代理</b>${valid?ms(t.end_error_s):'无有效匹配'}</div><div><b>句内绝对误差中位数</b>${valid?ms(t.internal_median_abs_error_s).replace('+',''):'无有效匹配'}</div></div><h3 class="subheading">成片实际使用的真实录音</h3><div class="table-wrap"><table><thead><tr><th>候选</th><th>来源演员</th><th>来源表演标签</th><th>放置轨道</th><th>原候选试听 / MP3</th></tr></thead><tbody>${sourceRows}</tbody></table></div><p class="caption">来源标签为评后追溯，不是提供给模型的提示。候选试听是未编辑录音；成片中的实际裁切、伸缩与增益见执行计划和下方证据。</p><h3 class="subheading">Qwen 对实际成片音轨的匿名听评</h3><p><b>转写：</b>${esc(a.transcript)}<br>词句可懂/符合目标 ${a.intelligibility} · 接缝 ${a.seam_quality} · 自然度 ${a.naturalness}（各 0／0.5／1）</p><p>${esc(a.evidence)}</p><details><summary>完整来源、时间锚点与听评原始证据</summary><pre>${esc(JSON.stringify(e,null,2))}</pre></details>`;
}
function renderShots(){
 $('#shot-grid').innerHTML=data.targets.map(s=>{const e=model().shot_evidence[s.id];return `<button data-shot="${s.id}" class="${s.id===shot?'active':''}" aria-label="${s.id} 内容 ${fmt(e.content_points)}分"><img src="media/shots/${s.id}.jpg" alt="${s.id} 真实输入画面" loading="lazy"><span>${s.id} · C ${fmt(e.content_points)}<br>T ${fmt(e.sync_points)}${s.revised?' · 返修':''}</span></button>`}).join('');renderShot();
}
function renderMilestones(){
 $('#milestones').innerHTML=model().milestones.map(x=>`<button data-trace-step="${x.step}" title="${esc(x.reason)}"><strong>#${x.step}</strong>${esc(x.title)}<br><span class="caption">${esc(x.action)} · ${x.stage}</span></button>`).join('');
}
const observe=['frames','listen_audio','audio_analysis','speech_words','probe_media'],edit=['read_file','list_files','write_file','edit_json'];
function filteredEvents(){const group=$('#trace-filter').value,stage=$('#trace-stage').value,query=$('#trace-search').value.trim().toLowerCase();return events.filter(e=>(stage==='all'||e.stage===stage)&&(group==='all'||(group==='observe'&&observe.includes(e.action))||(group==='edit'&&edit.includes(e.action))||(group==='render'&&['render_reaper','render_shotcut','submit_v1','finish'].includes(e.action))||(group==='error'&&e.result?.tool_error))&&(!query||JSON.stringify(e).toLowerCase().includes(query)))}
function renderTrace(){
 const rows=filteredEvents();$('#trace-count').textContent=`${names[active]} · 匹配 ${rows.length} / ${events.length} 次 · 当前显示 ${Math.min(visible,rows.length)} 次`;
 $('#trajectory-list').innerHTML=rows.slice(0,visible).map(e=>`<details id="trace-${e.step}"><summary>#${e.step} · ${esc(e.action)}<span class="badge ${e.result?.tool_error?'warn':''}">${e.stage}${e.result?.tool_error?' · 报错':''}</span><span class="score">${fmt(e.seconds,2)} 秒</span></summary><p class="trace-reason">${esc(e.reason)}</p><p class="caption">${esc(e.at)} · 以下为真实工具参数和返回观察。等待时间包含在单次耗时内；有效编辑预算按服务等待另行扣除。</p>${e.result?.images?.length?`<div class="trace-images">${e.result.images.map(im=>`<figure><a href="${esc(im.preview)}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(im.preview)}" alt="模型实际观察帧，源内 ${im.time_s} 秒"></a><figcaption>${im.time_s}s · 点击查看原观察图</figcaption></figure>`).join('')}</div>`:''}<pre>${esc(JSON.stringify({params:e.params,result:e.result},null,2))}</pre></details>`).join('')||'<p class="empty">没有匹配的调用。</p>';
 $('#trace-more').hidden=visible>=rows.length;
 $('#trace-download').innerHTML=`<a href="records/${active}-trajectory.json">本模型完整公开轨迹 JSON ↓</a><a href="records/${active}-score.json">原始最新评分</a><a href="records/${active}-shot-evidence.json">24 镜头证据</a>`;
}
async function focusTrace(step){
 $('#trace-filter').value='all';$('#trace-stage').value='all';$('#trace-search').value='';visible=Math.ceil(step/30)*30;renderTrace();
 const el=$(`#trace-${step}`);if(el){el.open=true;el.classList.add('trace-focus');el.scrollIntoView({behavior:'smooth',block:'center'})}
}
function example(sid,text){return `<li><button data-seek-shot="${sid}">${sid} · ${time(data.targets.find(s=>s.id===sid).start)}</button> ${text}</li>`}
function renderAnalysis(){
 const m=model(),e=m.shot_evidence,st=m.statistics;
 let specific='',process='';
 if(active==='sol'){
  specific=example('S01','使用 C208，演员正确，但来源标签为愤怒/普通；目标是悲伤/强烈。因此内容仅 0.75/2.5。声学起点提前 240ms，句内绝对误差中位数为 65ms，说明句内较接近不代表起点也准确。')+example('S03','返修后使用 C172：高兴/普通满足表演标签，但来源演员 08 是干扰演员，目标是角色 F 的演员 18，内容门槛未过。')+example('S07','使用 C331，正确演员、词句、情绪及返修后强度都满足，拿到 2.5/2.5；声学起点提前 160ms、终点提前 100ms，同步仍未满分。');
  process='先按声音组检索，反复取帧并分两段编辑每句；第 226 步成功渲染 48 个 REAPER 片段，第 254 步封存 v1 后做四句替换，第 281 步完成。112 次外部听觉调用和 600 帧观察并未建立稳定的人物映射。第 4 步听觉工具拒绝提供可核验的音色特征，属于观察链路的不确定性；不能将其视为已经完成可靠身份校准。';
 }else if(active==='terra'){
  specific=example('S04','人物正确，但来源 C013 是悲伤/普通，目标为惊讶/强烈；正确身份只解决了内容链的一部分。具体得分见该镜头原始证据。')+example('S07','使用 C326：演员 05（干扰演员）、高兴/强烈，目标为演员 07、愤怒/强烈。虽然强度标签碰巧相同，仍无法拿身份或表演分；终点声学代理提前 770ms。')+example('S16','人物匹配正确，仍须核对完整词句、情绪、保留覆盖及声学锚点，不能据此认定整句配音合格。');
  process='先取一批画面并将角色校准片与匿名组入口对比，之后密集补取嘴部帧。共 345 帧、55 次外部听觉；第 146 步成功渲染 24 个片段，第 159 步进入统一返修，第 188 步完成。工程和导出链顺利，仍只有 9 句演员对应正确，且没有一句内容拿满 2.5。有效编辑时间 81.9 分钟，未用尽预算。';
 }else{
  specific=example('S03','使用 C186，演员 18、句子、高兴及返修后的普通强度都正确，内容 2.5/2.5。但声学起点提前 110ms、终点提前 230ms，正确 take 仍需精细对齐。')+example('S14','使用 C011，来源为演员 06、恐惧/普通，目标演员不同。成片还把 Kids are talking 配成了 Dogs are sitting；Qwen 转写与来源句子交叉支持这处词句错误。')+example('S17','演员 23 对应角色 C，人物身份正确，但使用录音说的是 Kids are talking，目标为 Dogs are sitting。内容仍为 0；只有声纹匹配不足以通过。');
  process='较少取帧（84 帧），较多依赖候选试听与声学分析（135 次外部听觉）。第 182 步首次 REAPER 尝试报 Item reads beyond source，调整后继续渲染；第 200 步封存 v1，第 215 步完成。修复工具错误后通过所有工程门槛，但仍存在错台词与错演员。有效编辑时间 25.6 分钟，模型主动结束。';
 }
 const quality=m.rubrics.find(r=>r.id==='Q02').evidence;
 $('#analysis-content').innerHTML=`<div class="analysis-grid"><article class="card"><h3>${names[active]} · 内容链</h3><p>演员身份正确 <b>${m.correct_actor_shots.length}/24</b>；内容满分 <b>${m.full_content_shots.length}/24</b>。身份正确镜头：${m.correct_actor_shots.join('、')}。内容得分 <b>${fmt(m.category_scores.identity_content_performance)}/60</b>。</p><ul>${specific}</ul></article><article class="card"><h3>执行策略与观察边界</h3><p>${process}</p><p>声音质量 ${fmt(m.category_scores.quality)}/10，不能补偿人物与表演错误。实际整体响度 ${fmt(quality.integrated_lufs)} LUFS，真峰值 ${fmt(quality.true_peak_dbtp)} dBTP；数字削波检查${quality.checks[2]?'通过':'未通过'}。响度目标${quality.checks[0]?'通过':'未通过'}，真峰值目标${quality.checks[1]?'通过':'未通过'}。</p><p>工程重放与原混音差异为 ${fmt(m.technical.replay_rms_difference_dbfs,1)} dBFS，成片音轨与混音匹配核查通过。这支持“软件链完成”，不支持“感知内容已经正确”。</p><div class="links"><a href="records/${active}-technical.json">技术测量</a><a href="records/${active}-trajectory.json">实际轨迹</a></div></article></div>`;
}
async function selectModel(slug){
 const id=++requestId;active=slug;
 $$('#model-tabs button').forEach(b=>{b.classList.toggle('active',b.dataset.model===slug);b.setAttribute('aria-selected',String(b.dataset.model===slug))});
 for(const s of ['#evidence-model','#trace-model'])$(s).value=slug;
 renderPlayer();renderRubrics();renderShots();renderMilestones();renderAnalysis();
 $('#trajectory-list').innerHTML='<p class="caption">正在读取本次实际轨迹…</p>';
 if(!traceCache.has(slug))traceCache.set(slug,await json(`records/${slug}-trajectory.json`));
 if(id!==requestId)return;
 events=traceCache.get(slug).events;visible=30;renderTrace();chooseShot(shot,{move:false});document.documentElement.dataset.model=slug;
}
function candidateOptions(){
 const group=$('#voice-filter').value;candidateList=data.candidates.filter(c=>group==='all'||c.voice_group===group);
 $('#candidate-select').innerHTML=candidateList.map(c=>`<option value="${c.id}">${c.id} · ${c.voice_group} · ${fmt(c.duration_s)}s</option>`).join('');
 chooseCandidate(candidateList.some(c=>c.id===currentCandidate)?currentCandidate:candidateList[0].id);
}
function chooseCandidate(cid){
 currentCandidate=cid;$('#candidate-select').value=cid;$('#candidate-audio').pause();$('#candidate-audio').src=`media/candidates/${cid}.mp3`;
 const c=data.candidates.find(x=>x.id===cid);$('#candidate-info').textContent=`${c.id} · 匿名组 ${c.voice_group} · 原件 ${fmt(c.duration_s)} 秒 · 原 WAV SHA256 ${c.sha256}`;
}
function calibration(role){$('#calibration-title').textContent=`角色 ${role} · 中性有声校准片`;const v=$('#calibration-video');v.preload='metadata';v.src=`media/calibration/role_${role}.mp4`;v.load();$('#calibration-dialog').showModal()}
function bind(){
 document.addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;
  if(el.dataset.model)selectModel(el.dataset.model).catch(fail);
  if(el.dataset.shot||el.dataset.seekShot){
   if($('#delivery-stage').value!=='v2'){$('#delivery-stage').value='v2';renderPlayer()}
   chooseShot(el.dataset.shot||el.dataset.seekShot,{scroll:!!el.dataset.seekShot});
  }
  if(el.dataset.calibration)calibration(el.dataset.calibration);
  if(el.dataset.traceStep)focusTrace(Number(el.dataset.traceStep));
 });
 for(const s of ['#evidence-model','#trace-model'])$(s).addEventListener('change',e=>selectModel(e.target.value).catch(fail));
 $('#delivery-stage').addEventListener('change',renderPlayer);$('#shot-select').addEventListener('change',e=>chooseShot(e.target.value));
 $('#rubric-filter').addEventListener('change',renderRubrics);
 for(const s of ['#trace-filter','#trace-stage','#trace-search'])$(s).addEventListener(s.includes('search')?'input':'change',()=>{visible=30;renderTrace()});
 $('#trace-more').addEventListener('click',()=>{visible+=30;renderTrace()});
 $('#voice-filter').addEventListener('change',candidateOptions);$('#candidate-select').addEventListener('change',e=>chooseCandidate(e.target.value));
 for(const [s,d] of [['#candidate-prev',-1],['#candidate-next',1]])$(s).addEventListener('click',()=>chooseCandidate(candidateList[(candidateList.findIndex(c=>c.id===currentCandidate)+d+candidateList.length)%candidateList.length].id));
 $('#hear-output').addEventListener('click',()=>setHearing('output'));$('#hear-reference').addEventListener('click',()=>setHearing('reference'));
 $('#play-both').addEventListener('click',async()=>{const a=$('#delivery'),b=$('#reference');b.currentTime=a.currentTime;const settled=await Promise.allSettled([a.play(),b.play()]);$('#player-message').textContent=settled.some(x=>x.status==='rejected')?'浏览器阻止了播放，请点击各视频的播放按钮。':'并排播放中；只播放已选择的一侧声音。'});
 $('#pause-both').addEventListener('click',()=>{$('#delivery').pause();$('#reference').pause()});
 $('#delivery').addEventListener('seeked',()=>{const b=$('#reference');if(b.readyState>=1&&Math.abs(b.currentTime-$('#delivery').currentTime)>.08)b.currentTime=$('#delivery').currentTime});
 $('#close-calibration').addEventListener('click',()=>$('#calibration-dialog').close());$('#calibration-dialog').addEventListener('close',()=>$('#calibration-video').pause());
}
function fail(error){console.error(error);const p=document.createElement('p');p.className='error';p.textContent=`页面数据未能完整加载：${error.message}。可刷新，或下载 results.json 人工核查。`;$('main').prepend(p)}
(async()=>{
 data=await json('results.json');
 $('#model-tabs').innerHTML=data.models.map(m=>`<button role="tab" aria-selected="false" data-model="${m.slug}">${names[m.slug]}</button>`).join('');
 for(const s of ['#evidence-model','#trace-model'])$(s).innerHTML=data.models.map(m=>`<option value="${m.slug}">${names[m.slug]}</option>`).join('');
 $('#shot-select').innerHTML=data.targets.map(s=>`<option value="${s.id}">${s.id} · ${time(s.start)}</option>`).join('');
 $('#calibration-grid').innerHTML=[...'ABCDEFGH'].map(r=>`<button data-calibration="${r}"><img src="media/calibration/role_${r}.jpg" alt="角色 ${r} 的中性校准画面" loading="lazy"><span>角色 ${r} · 查看有声校准</span></button>`).join('');
 $('#voice-filter').innerHTML+=[...data.voice_groups].map(g=>`<option value="${g.id}">${g.id} · 30 条</option>`).join('');
 scoreTable();candidateOptions();bind();await selectModel('sol');document.documentElement.dataset.ready='true';
})().catch(fail);
