'use strict';
(()=>{
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const f=(n,d=2)=>Number(n).toFixed(d), names={original:'原题',mixed:'混料版'}, colors={sol:'var(--teal)',luna:'var(--rust)',deepseek:'var(--purple)'}, short={sol:'GPT-6.1 Sol',luna:'GPT-6 Luna',deepseek:'DeepSeek Flash 1017'};
 const comps={complete_bonus:'完整清空奖励',clearance:'非线性清出',throughput:'吞吐收益',complete_speed_bonus:'完整清空速度',floor_penalty:'掉落处罚',damage_penalty:'损伤处罚',bin_penalty:'撞箱处罚',sorting_penalty:'错投处罚',clipping_adjustment:'截断调整'};
 const state={variant:'original',model:'sol',episode:1,traceModel:'sol',limit:10};let data,policyKey='',instructionRequest=0;
 const run=(variant=state.variant,model=state.model)=>data.runs.find(r=>r.variant===variant&&r.id===model);
 const current=()=>run().episodes[state.episode-1];
 const labelModel=id=>`<span class="model-label"><i class="dot ${id}"></i>${short[id]}</span>`;
 const getText=async url=>{const r=await fetch('../../'+url);if(!r.ok)throw Error(`${r.status}: ${url}`);return r.text();};
 const time=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
 function updateVideo(){
  const r=run(),e=current(),v=$('#case-video');v.pause();v.poster='../../'+e.poster;v.src='../../'+e.video;v.setAttribute('aria-label',`${r.label} ${names[state.variant]}第${e.index}回合正式仿真录像`);v.load();
  $('#video-model').value=state.model;$('#video-episode').innerHTML=r.episodes.map(e=>`<option value="${e.index}">#${String(e.index).padStart(2,'0')} · ${e.cleared}/${e.parts}</option>`).join('');$('#video-episode').value=String(state.episode);
  $('#video-caption').textContent=`${names[state.variant]} · ${short[state.model]} · #${e.index} · ${e.cleared}/${e.parts} 清出 · ${f(e.score)} 分`;
  $('#video-download').href='../../'+e.video;$('#video-time').max=String(e.sim_seconds);$('#video-time').value='0';$('#time-label').textContent='0.0 s';$('#jump-last').disabled=e.last_clear==null;
 }
 function renderHero(){
  $('#scoreboard-title').textContent=names[state.variant]+' · 工程分';
  $('#hero-scores').innerHTML=['sol','deepseek','luna'].map(id=>{const r=run(state.variant,id);return `<div class="score-row"><div>${labelModel(id)}<p>${r.cleared}/${r.parts} 清出 · ${r.finished}/8 完整清空</p></div><strong>${f(r.score)}<small>/100</small></strong></div>`;}).join('');
 }
 function renderTask(){
  $('#variant-note').textContent=state.variant==='original'?'RLE-Bench 原题 · 本轮采用统一 2 h 开发协议':'SimulationLE mixed-v1 改编 · 三类同色零件与错投处罚';
  $('#scene-image').src=`../../assets/task07/${state.variant}-preview.png`;$('#scene-image').alt=state.variant==='original'?'原题公开静态场景：料箱与一个输送工位':'混料版公开静态场景：料箱与三个指定类别工位';
  $('#spec-label').textContent=state.variant==='original'?'ORIGINAL / SOURCE TASK':'MIXED-V1 / SIMULATIONLE ADAPTATION';
  $('#spec-title').textContent=state.variant==='original'?'相同零件，一个上料工位。':'同色三类，三个指定工位。';
  $('#spec-body').innerHTML=state.variant==='original'?'<p>同一种钢制支架，单工位逐件上料。难点是无真值定位、接触式抓取、嵌套分离和后段恢复。</p>':'<p>短、标准、长件分别送往 (0.25, 0.38)、(0.43, 0.38)、(0.61, 0.38) m 的 14 × 14 cm 工位。不能靠颜色分类。</p><p>错工位每零件 / 目的工位记一次错投，扣 0.05 reward，并失去完美回合奖励；零件保留，可返工。</p>';
  const path=`files/task07/${state.variant}-instruction.md`;$('#instruction-download').href='../../'+path;const request=++instructionRequest;
  getText(path).then(t=>{if(request===instructionRequest)$('#instruction-text').textContent=t;}).catch(()=>{if(request===instructionRequest)$('#instruction-text').textContent='题面载入失败，请使用上方下载。';});
 }
 function renderComparison(){
  $('#comparison-chart').innerHTML=['sol','deepseek','luna'].map(id=>`<div class="compare-row"><div class="compare-label">${labelModel(id)}</div><div class="compare-bars">${['original','mixed'].map(variant=>{const r=run(variant,id);return `<div class="compare-track" role="img" aria-label="${r.label} ${names[variant]} ${f(r.score)} 分"><span class="compare-fill ${variant}" style="--value:${r.score}%"></span><b class="compare-number" style="--value:${r.score}%">${f(r.score)}</b></div>`;}).join('')}</div></div>`).join('');
  $('#result-table tbody').innerHTML=['original','mixed'].flatMap(variant=>['sol','deepseek','luna'].map(id=>{const r=run(variant,id);return `<tr data-version="${variant}" class="${variant===state.variant?'active-version':''}"><td>${r.label}<span>${names[variant]} · ${r.model}</span></td><td class="score-cell">${f(r.score)}</td><td>${r.cleared} / ${r.parts}</td><td>${r.finished} / 8</td><td>${f(r.minutes)}</td><td>4 / 4 通过</td></tr>`;})).join('');
 }
 function renderDistribution(){
  $('#distribution-title').textContent=names[state.variant]+' · 隐藏回合分布';
  $('#distribution-chart').innerHTML=['sol','deepseek','luna'].map(id=>{const r=run(state.variant,id);return `<div class="dist-row"><div class="dist-label">${labelModel(id)}<span>中位数 ${f(r.median)}</span></div><div class="dist-track"><i class="median-mark" style="--x:${r.median}%"></i>${r.episodes.map((e,i)=>`<button class="dist-dot" data-model="${id}" data-episode="${e.index}" style="--x:${e.score}%;--y:${[3,14,23,8,19,0,11,22][i]}px;--color:${colors[id]}" title="#${e.index} · ${f(e.score)} 分 · ${e.cleared}/${e.parts} 清出" aria-label="${r.label} 隐藏回合 ${e.index}：${f(e.score)}分，点击查看"></button>`).join('')}</div></div>`;}).join('')+'<div class="bar-axis"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>';
  $$('.dist-dot').forEach(b=>b.addEventListener('click',()=>{selectEpisode(b.dataset.model,Number(b.dataset.episode));$('#episodes').scrollIntoView({behavior:'smooth'});}));
 }
 function renderEpisode(){
  $('#episode-version').innerHTML='<i></i>'+names[state.variant];
  $('#episode-grid').innerHTML='<span></span>'+Array.from({length:8},(_,i)=>`<span class="ep-head">#${i+1}</span>`).join('')+['sol','deepseek','luna'].map(id=>{const r=run(state.variant,id);return `<span class="ep-model">${id==='deepseek'?'DeepSeek':short[id]}<br><small>${r.finished}/8 清空</small></span>`+r.episodes.map(e=>`<button class="t7-ep ${e.finished?'finished':''} ${state.model===id&&state.episode===e.index?'selected':''}" data-model="${id}" data-episode="${e.index}" aria-pressed="${state.model===id&&state.episode===e.index}" aria-label="${r.label} 第${e.index}回合，${f(e.score)}分，${e.cleared}/${e.parts}清出">${f(e.score,1)}</button>`).join('');}).join('');
  $$('.t7-ep').forEach(b=>b.addEventListener('click',()=>selectEpisode(b.dataset.model,Number(b.dataset.episode))));
  const r=run(),e=current();
  const metric=(k,v)=>`<div><dt>${k}</dt><dd>${v}</dd></div>`;
  $('#episode-detail').innerHTML=`<span class="eyebrow">${names[state.variant]} / EPISODE ${String(e.index).padStart(2,'0')}</span><h3>${short[state.model]}</h3><span class="result-pill ${e.finished?'pass':'pending'}">${e.finished?'完整清空':'未清空'}</span><div class="detail-score">${f(e.score)} <small>/100</small></div><dl>${metric('正确清出',`${e.cleared} / ${e.parts}`)}${metric('仿真执行',`${f(e.sim_seconds,2)} s`)}${metric(e.finished?'完成时间':'最后清出',e.last_clear==null?'—':f(e.last_clear,2)+' s')}${metric('评分吞吐',`${f(e.scoring_tp_ppm)} 件/min`)}${metric('掉落 / 损伤',`${e.floor_drops} / ${e.damage_events}`)}${metric('撞箱 / 错投',`${e.bin_hits} / ${e.mis_sorts}`)}${metric('策略故障',e.policy_faults)}</dl><button id="play-selected" class="text-button">在上方播放本回合 ↑</button><p class="caption">${e.finished?'完成时间表示全部零件清出时刻。':'未完成；最后清出时刻不是完成时间。'} 错投为事件计数，不是分类错误率。</p>`;
  $('#play-selected').addEventListener('click',()=>{$('#case-video').scrollIntoView({behavior:'smooth',block:'center'});$('#case-video').play().catch(()=>{});});
  $('#component-title').textContent=`${short[state.model]} · #${e.index} · 评分分解`;
  $('#component-chart').innerHTML=Object.entries(comps).map(([key,label])=>`<div class="component-item ${e.components[key]<0?'negative':''}"><span>${label}</span><b>${e.components[key]>0?'+':''}${f(e.components[key]||0,3)}</b></div>`).join('');
  $('#report-download').href='../../'+r.file_base+'report.json';
 }
 function selectEpisode(model,index){state.model=model;state.episode=index;renderEpisode();updateVideo();}
 function traceEntry(s){
  const el=document.createElement('details');el.className='trace-entry';
  const headline=s.commands[0]?.command.split('\n').find(x=>x.trim())||s.message.split('\n')[0]||'Agent 记录';
  el.innerHTML=`<summary><span class="trace-time">${time(s.elapsed)}</span><span class="trace-kind">${s.commands.length?'TOOL':'AGENT'}</span><span class="trace-heading">${esc(headline)}</span><span class="trace-toggle">＋</span></summary>`;
  el.addEventListener('toggle',()=>{if(!el.open||el.querySelector('.trace-body'))return;const body=document.createElement('div');body.className='trace-body';
   const block=(title,text)=>{const h=document.createElement('h4');h.textContent=title;const p=document.createElement('pre');p.textContent=text;body.append(h,p);};
   if(s.message){const p=document.createElement('p');p.className='trace-message';p.textContent=s.message;body.append(p);}
   s.commands.forEach(c=>block(c.tool,c.command));s.results.forEach(x=>block('TOOL RESULT',x));el.append(body);
  });return el;
 }
 function renderTrace(){
  const r=run(state.variant,state.traceModel),query=$('#trace-search').value.toLowerCase().trim();const rows=r.timeline.filter(s=>!query||JSON.stringify(s).toLowerCase().includes(query));
  $('#trace-list').replaceChildren(...rows.slice(0,state.limit).map(traceEntry));if(!rows.length)$('#trace-list').innerHTML='<p class="caption">没有匹配记录。</p>';
  $('#trace-count').textContent=`显示 ${Math.min(state.limit,rows.length)} / ${rows.length} 条可见记录`;$('#load-traces').hidden=state.limit>=rows.length;
  $('#trace-variant').value=state.variant;$('#trace-model').value=state.traceModel;
  $('#trace-stats').innerHTML=`<div><span>实际开发</span><b>${f(r.minutes)} min / 120 min</b></div><div><span>完成 Shell 命令</span><b>${r.commands}</b></div><div><span>输出 token</span><b>${Number(r.output_tokens).toLocaleString('en-US')}</b></div>`;
  $('#trace-download').href='../../'+r.file_base+'trajectory.json';$('#policy-download').href='../../'+r.file_base+'policy.py';$('#selected-policy-link').href='../../'+r.file_base+'policy.py';$('#selected-freeze-link').href='../../'+r.file_base+'freeze.json';
  $('#policy-label').textContent=`${names[state.variant]} / ${r.label} / 冻结提交`;$('#policy-sha').textContent='SHA-256 '+r.policy_sha256;policyKey='';$('#policy-code').textContent='展开后载入原样源码。';if($('#policy-disclosure').open)loadPolicy();
 }
 function loadPolicy(){const r=run(state.variant,state.traceModel),key=r.file_base;if(policyKey===key)return;policyKey=key;$('#policy-code').textContent='载入中…';getText(key+'policy.py').then(t=>{if(policyKey===key)$('#policy-code').textContent=t;}).catch(()=>{if(policyKey===key)$('#policy-code').textContent='载入失败，请下载原样文件。';});}
 function setVariant(variant){
  state.variant=variant;state.episode=1;state.limit=10;$('#trace-search').value='';
  $$('[data-variant]').filter(b=>b.closest('#variant-tabs,.compact-variant')).forEach(b=>{const active=b.dataset.variant===variant;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  renderHero();renderTask();renderComparison();renderDistribution();renderEpisode();renderTrace();updateVideo();
 }
 function initialize(){
  $$('[data-variant]').filter(b=>b.closest('#variant-tabs,.compact-variant')).forEach(b=>b.addEventListener('click',()=>setVariant(b.dataset.variant)));
  $('#video-model').addEventListener('change',e=>selectEpisode(e.target.value,state.episode));$('#video-episode').addEventListener('change',e=>selectEpisode(state.model,Number(e.target.value)));
  $('#video-time').addEventListener('input',e=>{const v=$('#case-video');v.currentTime=Math.min(Number(e.target.value),Math.max(0,(v.duration||current().duration)-.05));$('#time-label').textContent=f(v.currentTime,1)+' s';});
  $('#case-video').addEventListener('timeupdate',()=>{$('#video-time').value=String($('#case-video').currentTime);$('#time-label').textContent=f($('#case-video').currentTime,1)+' s';});
  $('#jump-last').addEventListener('click',()=>{const t=current().last_clear;if(t!=null)$('#case-video').currentTime=Math.min(t,Math.max(0,($('#case-video').duration||current().duration)-.05));});
  $('#trace-variant').addEventListener('change',e=>setVariant(e.target.value));$('#trace-model').addEventListener('change',e=>{state.traceModel=e.target.value;state.limit=10;$('#trace-search').value='';renderTrace();});
  $('#trace-search').addEventListener('input',()=>{state.limit=10;renderTrace();});$('#load-traces').addEventListener('click',()=>{state.limit+=15;renderTrace();});
  $('#expand-traces').addEventListener('click',()=>{const entries=$$('.trace-entry'),open=entries.some(e=>!e.open);entries.forEach(e=>e.open=open);$('#expand-traces').textContent=open?'收起当前记录':'展开当前记录';});$('#policy-disclosure').addEventListener('toggle',()=>{if($('#policy-disclosure').open)loadPolicy();});
  $$('.replay-link').forEach(b=>b.addEventListener('click',()=>{setVariant(b.dataset.variant);selectEpisode(b.dataset.model,Number(b.dataset.episode));$('#case-video').scrollIntoView({behavior:'smooth',block:'center'});}));
  const observer=new IntersectionObserver(entries=>{const e=entries.find(e=>e.isIntersecting);if(e)$$('.section-nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));},{rootMargin:'-10% 0px -65% 0px'});$$('.detail-section').forEach(s=>observer.observe(s));
  setVariant('original');document.body.dataset.ready='true';
 }
 fetch('../../data/task07.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(x=>{data=x;initialize();}).catch(e=>{const p=document.createElement('p');p.className='error-message';p.textContent='数据载入失败。请使用 HTTP 服务打开页面；题面与公开证据仍可从下载区访问。';$('#overview').append(p);console.error(e);});
})();
