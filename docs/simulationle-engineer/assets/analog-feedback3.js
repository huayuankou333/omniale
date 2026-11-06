'use strict';
(() => {
 const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=v=>v===null||v===undefined||!Number.isFinite(v)?'未生成':v!==0&&(Math.abs(v)<.001||Math.abs(v)>1e6)?v.toExponential(5):v.toLocaleString('en-US',{maximumFractionDigits:6});
 const analysisNames={dc:'DC 负载扫描',psr:'电源抑制',step:'负载阶跃',startup:'启动',op:'标称工作点',compliance:'输出顺从性',mc_public:'公开失配',loop:'环路',settling:'建立',noise:'噪声',ranges:'输出范围',cmfb_recovery:'共模反馈恢复',mismatch:'公开失配'};
 const observer=new IntersectionObserver(entries=>{const entry=entries.find(e=>e.isIntersecting);if(entry)$$('.section-nav a').forEach(a=>a.classList.toggle('active',a.hash===`#${entry.target.id}`));},{rootMargin:'-8% 0px -65% 0px'});
 $$('.detail-section').forEach(s=>observer.observe(s));
 fetch(`../../data/${document.body.dataset.case}.json`).then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(init).catch(error=>{const p=document.createElement('p');p.className='analog-load-error';p.textContent='测量数据未能载入。请通过网站 HTTP 地址访问，或下载文件区的原始证据包。';$('#results').prepend(p);console.error(error);});
 function init(data){
  let modelId='sol',response=data.models.sol.attempts.at(-1).response;
  const currentModel=()=>data.models[modelId], currentAttempt=()=>currentModel().attempts.find(a=>a.response===response);
  const cell=c=>`<details><summary class="check-${c.status}">${c.status==='blocked'?'↳ 门槛阻断':c.status==='passed'?'✓ 通过':'× 未通过'}</summary><p>${esc(c.detail)}</p></details>`;
  $('#final-checks tbody').innerHTML=data.models.luna.checks.map((c,i)=>`<tr><th scope="row">${esc(c.label)}</th><td>${cell(c)}</td><td>${cell(data.models.sol.checks[i])}</td></tr>`).join('');
  if(data.case==='ota')$('#check-note').textContent='原始评分器将 15 项统一阻断；本轮未执行完整 PVT / MC。展开可查看原始 blocked 原因。';
  if(data.case==='ldo')$('#check-note').textContent='两模型的资产检查另为 6/6，不与这 8 项电气检查合并。展开可查看原始测量与最坏工况。';
  $$('#design-model button').forEach(b=>b.addEventListener('click',()=>{modelId=b.dataset.model;response=currentModel().attempts.at(-1).response;render();}));
  $('#trace-search').addEventListener('input',renderTrace);
  $('#copy-netlist').addEventListener('click',async()=>{const b=$('#copy-netlist');try{await navigator.clipboard.writeText(currentAttempt().netlist);b.textContent='已复制';setTimeout(()=>b.textContent='复制网表',1400);}catch{b.textContent='请在下方选择并复制';}});
  function render(){
   const m=currentModel(),a=currentAttempt();
   $$('#design-model button').forEach(b=>{const active=b.dataset.model===modelId;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
   $('#design-attempt').innerHTML=m.attempts.map(x=>`<button data-response="${x.response}" class="${x.response===response?'active':''}" aria-pressed="${x.response===response}">${x.retry?'合规纠错':`第 ${x.number} 次`}</button>`).join('');
   $$('#design-attempt button').forEach(b=>b.addEventListener('click',()=>{response=Number(b.dataset.response);render();}));
   $('#selected-design').textContent=`${m.id} · ${a.retry?'器件合规纠错':`第 ${a.number} 次设计`} · 第 ${a.response} 次回复`;
   $('#selected-status').textContent=a.retry?'不占设计次数':a.metrics.length?'公开诊断已生成测量':'公开诊断未生成标量测量';
   $('#diagnostic-link').href=a.base+'diagnostic.json';$('#diagnostic-link').hidden=a.retry;
   $('#netlist-code').textContent=a.netlist||'未生成可显示的网表。';$('#netlist-sha').textContent=a.sha256?'SHA256 '+a.sha256:'';$('#netlist-download').href=a.base+'circuit.spi';$('#netlist-download').hidden=!a.netlist;
   $$('.ldo-asset-link').forEach(link=>link.remove());
   if(data.case==='ldo'&&a.valid){for(const [file,label] of [['capless_ldo.sch','Xschem 原理图'],['design.json','参数化源设计'],['native.spice','原生导出网表']]){const link=document.createElement('a');link.className='ldo-asset-link';link.href=a.base+file;link.download='';link.textContent=label+' ↓';$('#netlist-disclosure .code-toolbar').append(link);}}
   $('#public-metrics tbody').innerHTML=a.metrics.length?a.metrics.map(v=>`<tr><td>${esc(analysisNames[v.analysis]||v.analysis)}</td><td>${esc(v.name)}</td><td>${num(v.value)}</td></tr>`).join(''):'<tr><td colspan="3">未生成标量测量。请查看器件合规检查、仿真日志及反馈；缺失值不作为 0 展示。</td></tr>';
   $('#operating-points tbody').innerHTML=a.op.length?a.op.map(o=>`<tr class="${o.saturation_margin_V!==null&&o.saturation_margin_V<0?'triode-row':''}"><td>${esc(o.device)}</td>${['id_uA','vgs_V','vds_V','vdsat_V','saturation_margin_V'].map(k=>`<td>${num(o[k])}</td>`).join('')}</tr>`).join(''):'<tr><td colspan="6">未生成器件工作点。</td></tr>';
   $('#simulation-errors').textContent=[...a.errors.map(e=>String(e)),...a.logs.map(l=>`${l.analysis}:\n${l.errors.map(e=>typeof e==='string'?e:JSON.stringify(e,null,2)).join('\n')}`)].join('\n\n')||'未记录公开诊断错误或告警。';
   const holder=$('#selected-plots');holder.replaceChildren();
   if(a.charts.length)a.charts.forEach(g=>{const card=document.createElement('div');card.className='plot-card';card.innerHTML=`<div class="panel-heading"><h3>${esc(g.title)}</h3></div><div class="circuit-chart"></div><div class="plot-foot"><span>原始数据 · 非示意波形</span><a href="${esc(a.base+g.download)}" download>完整数据 ↓</a></div>`;holder.append(card);chart($('.circuit-chart',card),g);});
   else holder.innerHTML=`<div class="chart-no-data"><b>${data.case==='ota'?'本次记录没有保存可绘制的时序波形。':'所选回复没有可用的波形文件。'}</b><br>${data.case==='ota'?'下表展示公开测试台提取的真实指标。完整正式验收是否执行，以最终门槛与评分记录为准。':'标量测量、仿真错误与原样网表仍可在下方查看。'}</div>`;
   $('#trajectory-model-label').textContent=m.id;
   $('#usage-summary').innerHTML=[['有效设计',m.usage.design_attempts],['额外合规纠错',m.usage.syntax_retries_used],['总回复',m.usage.response_turns],['输出 token，含推理',num(m.usage.output_tokens_including_reasoning)],['接口耗时 / 秒',num(m.usage.model_inference_seconds)],['开发耗时 / 秒',num(m.usage.agent_wall_seconds)]].map(([name,value])=>`<div>${name}<b>${value}</b></div>`).join('');
   renderTrace();
  }
  function renderTrace(){
   const query=$('#trace-search').value.toLowerCase().trim(),m=currentModel();
   const attempts=m.attempts.filter(a=>!query||(a.reply+'\n'+a.feedback).toLowerCase().includes(query));
   $('#design-trajectory').innerHTML=attempts.length?attempts.map(a=>`<article class="design-round"><div class="round-head"><div><span class="round-number">RESPONSE ${a.response}${a.retry?' · DEVICE POLICY RETRY':` · DESIGN ${a.number}`}</span><h3>${a.retry?'器件合规纠错，不计设计尝试':`第 ${a.number} 次完整设计`}</h3><p>${a.tokens} 输出 token · ${num(a.seconds)} 秒 · ${a.metrics.length} 个公开标量指标</p></div><button class="text-button trace-select" data-response="${a.response}">查看此设计 ↑</button></div><div class="round-disclosures"><details><summary>模型可见回复 <span>＋</span></summary><pre>${esc(a.reply)}</pre><a class="text-link" href="${a.base}reply.txt" download>原样回复 ↓</a></details><details><summary>${a===m.attempts.at(-1)?'末次诊断存档，未再发送':'发送给模型的反馈'} <span>＋</span></summary><pre>${esc(a.feedback||'没有后续反馈。')}</pre>${a.feedback?`<a class="text-link" href="${a.base}feedback.txt" download>反馈原文 ↓</a>`:''}</details></div></article>`).join(''):'<p class="trace-empty">当前模型的回复与反馈中没有匹配项。</p>';
   $$('.trace-select').forEach(b=>b.addEventListener('click',()=>{response=Number(b.dataset.response);render();$('#simulation').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}));
  }
  render();
 }
 function chart(host,g){
  const rows=g.rows.filter(r=>r.every(Number.isFinite));if(!rows.length)return;
  const W=760,H=285,L=70,R=22,T=24,B=47,pw=W-L-R,ph=H-T-B;
  const xmin=rows[0][0],xmax=rows.at(-1)[0];let ymin=Math.min(...rows.map(r=>r[1])),ymax=Math.max(...rows.map(r=>r[1]));
  if(g.reference!==null){ymin=Math.min(ymin,g.reference);ymax=Math.max(ymax,g.reference);}
  const pad=(ymax-ymin)*.10||.1;ymin-=pad;ymax+=pad;
  const x=v=>L+(v-xmin)/(xmax-xmin||1)*pw,y=v=>T+(ymax-v)/(ymax-ymin)*ph;
  let grid='';for(let i=0;i<=4;i++){const xx=L+pw*i/4,yy=T+ph*i/4;grid+=`<line class="grid-line" x1="${xx}" x2="${xx}" y1="${T}" y2="${H-B}"/><line class="grid-line" x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}"/><text class="axis-label" x="${xx}" y="${H-B+20}" text-anchor="middle">${short(xmin+(xmax-xmin)*i/4)}</text><text class="axis-label" x="${L-8}" y="${yy+4}" text-anchor="end">${short(ymax-(ymax-ymin)*i/4)}</text>`;}
  const path=rows.map((r,i)=>`${i?'L':'M'}${x(r[0]).toFixed(2)},${y(r[1]).toFixed(2)}`).join('');
  host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(g.title)}；方向键读数" tabindex="0">${grid}<text class="axis-unit" x="${L}" y="13">${esc(g.y)}</text><text class="axis-unit" x="${W-R}" y="${H-3}" text-anchor="end">${esc(g.x)}</text>${g.reference!==null?`<line class="threshold" x1="${L}" x2="${W-R}" y1="${y(g.reference)}" y2="${y(g.reference)}"/>`:''}<path class="chart-curve" d="${path}"/><line class="crosshair" x1="${L}" x2="${L}" y1="${T}" y2="${H-B}" hidden/><rect class="chart-hit" x="${L}" y="${T}" width="${pw}" height="${ph}" fill="transparent"/></svg><div class="chart-readout" aria-live="polite">悬停或使用方向键查看真实采样点。</div>`;
  const svg=$('svg',host),cross=$('.crosshair',host),readout=$('.chart-readout',host);let index=0;
  function inspect(n){index=Math.max(0,Math.min(rows.length-1,n));const p=rows[index];cross.removeAttribute('hidden');cross.setAttribute('x1',x(p[0]));cross.setAttribute('x2',x(p[0]));readout.textContent=`${g.x}: ${num(p[0])} · ${g.y}: ${num(p[1])}`;}
  $('.chart-hit',host).addEventListener('pointermove',event=>{const r=svg.getBoundingClientRect(),value=xmin+(((event.clientX-r.left)*W/r.width-L)/pw)*(xmax-xmin);let lo=0,hi=rows.length-1;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(rows[mid][0]<value)lo=mid+1;else hi=mid;}inspect(lo);});
  svg.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();inspect(event.key==='Home'?0:event.key==='End'?rows.length-1:index+(event.key==='ArrowRight'?1:-1));}});svg.addEventListener('focus',()=>inspect(index));
  function short(v){if(v!==0&&(Math.abs(v)>=1e4||Math.abs(v)<.01))return v.toExponential(1);return Number(v.toPrecision(3)).toString();}
 }
})();
