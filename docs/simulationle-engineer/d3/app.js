/* Portable, dependency-free showcase. Every scientific plot uses archived evidence. */
'use strict';
const DATA=window.D3_DATA;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ids=DATA.cases.map(c=>c.id), sectionIds=['brief','difficulty','inputs','deliverables','results','environment'];
const sections=['工程题目','核心难点','模型输入素材','预期与实际交付','交付可视化','专业环境与软件'];
let current=ids.includes(location.hash.slice(1).split('/')[0])?location.hash.slice(1).split('/')[0]:'francis';
let filter='all', query='', observer;
const states={done:'已交付',partial:'部分完成',missing:'尚未完成',pending:'等待测试'};
const testedCount=DATA.cases.filter(c=>c.statusType!=='pending').length;
$('.overview-stats>div:nth-child(2) strong').textContent=String(testedCount).padStart(2,'0');
$('.overview-stats>div:nth-child(2)>span').textContent='已启动模型测试';
$('.filter[data-filter="tested"] span').textContent=testedCount;
$('.filter[data-filter="pending"] span').textContent=DATA.cases.length-testedCount;
const icon=(id)=>{
  let shape='';
  if(id==='francis'){
    const blades=Array.from({length:12},(_,i)=>`<path d="M80 30 Q101 24 109 36" transform="rotate(${i*30} 80 50)"/>`).join('');
    shape=`<path d="M5 18H60M100 82H155M5 13l8 5-8 5m142 54 8 5-8 5"/><circle cx="80" cy="50" r="34"/><circle cx="80" cy="50" r="25" opacity=".3"/>${blades}<circle cx="80" cy="50" r="11"/><path d="M70 49h20m-10-10v20"/><path d="M34 50H7m119 0h27" stroke-dasharray="2 4"/>`;
  }else if(id==='ambench'){
    shape=`<path d="M25 72l76-18 36 18-77 19zM25 72v6l35 19 77-19v-6M60 91v6"/><path d="M38 71l65-14m-55 20 65-15m-53 21 65-15" opacity=".4"/><path d="M62 6h26v13l-7 8H69l-7-8zM75 27v36"/><path d="M71 27l4 36 4-36" fill="currentColor" opacity=".14"/><path d="M71 64h8m-5-5 2 10m-7-7 12 6"/><path d="M104 15h34m-6-4 6 4-6 4M18 43h21m-6-4 6 4-6 4"/><circle cx="75" cy="64" r="8" opacity=".25"/>`;
  }else if(id==='ahead'){
    shape=`<path d="M51 92V52l7-9V13h44v30l7 9v40M58 32h44m-44 6h44M64 13v20m8-20v20m8-20v20m8-20v20m8-20v20"/><path d="M64 75c-14-18 16-21 13-39 20 18 30 30 13 42-8 7-18 4-26-3z"/><path d="M75 77c-4-10 6-12 7-23 11 14 9 20 2 23" opacity=".5"/><path d="M22 57h24m-6-4 6 4-6 4m74-4h24m-6-4 6 4-6 4M51 85H28m81 0h23"/><path d="M80 3v10M80 85v13" stroke-dasharray="2 4"/>`;
  }else{
    shape=`<rect x="22" y="14" width="116" height="72" rx="7"/><rect x="31" y="22" width="10" height="56" rx="4"/><rect x="119" y="22" width="10" height="56" rx="4"/>${Array.from({length:8},(_,i)=>`<path d="M41 ${28+i*6}h78"/>`).join('')}<path d="M80 25v50" stroke-dasharray="3 3" opacity=".5"/><circle cx="36" cy="49" r="4"/><circle cx="124" cy="49" r="4"/><path d="M1 49h29m-6-4 6 4-6 4m105-4h24m-6-4 6 4-6 4"/>${[56,78,100].map(x=>[36,60].map(y=>`<rect x="${x}" y="${y}" width="12" height="11" rx="1" fill="currentColor" opacity=".13" stroke="none"/>`).join('')).join('')}`;
  }
  return `<svg viewBox="0 0 160 100" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shape}</svg>`;
};
$('#domain-diagram').innerHTML=DATA.cases.map((c,i)=>`<div class="domain-tile" style="color:${c.color}">${icon(c.id)}<div><strong>${['水力机械','激光制造','氢能燃烧','液冷热管理'][i]}</strong><small>${['HYDRODYNAMICS','PHASE CHANGE','REACTING FLOW','THERMAL SYSTEM'][i]}</small></div></div>`).join('');

function matches(c){return (filter==='all'||(filter==='pending'?c.statusType==='pending':c.statusType!=='pending'))&&(!query||JSON.stringify([c.short,c.title,c.domain,c.tags,c.environment]).toLowerCase().includes(query));}
function renderCards(){
  const found=DATA.cases.filter(matches);
  $('#case-grid').innerHTML=found.map(c=>`<button class="case-card ${current===c.id?'selected':''}" data-case="${c.id}" style="--case:${c.color}" aria-pressed="${current===c.id}" aria-label="查看 ${c.short}：${c.title}"><div class="card-top"><span>CASE / ${c.number}</span><span><i class="status-dot ${c.statusType}"></i>${c.statusType==='pending'?'待测试':c.statusType==='running'?'测试进行中':'已有测试'}</span></div><div class="card-art">${icon(c.id)}</div><h3>${esc(c.short)}</h3><p class="card-subtitle">${esc(c.title)}</p><div class="card-bottom"><span>${esc(c.domain)}</span><span class="arrow" aria-hidden="true">↗</span></div></button>`).join('');
  $('#filter-count').textContent=`显示 ${found.length} 个案例`;$('#no-results').hidden=!!found.length;
  $$('.case-card').forEach(el=>el.addEventListener('click',()=>selectCase(el.dataset.case,'brief',true)));
}
const label=(id,number,title,english)=>`<div class="section-label"><span>${number}</span><h3>${title}</h3><small>${english}</small></div>`;
const docButton=(path,text,main=false)=>`<button class="doc-button ${main?'main':''}" data-doc="${path}" data-title="${esc(text)}">${text}<span>↗</span></button>`;
const note=t=>`<div class="evidence-note"><span>ⓘ</span><div>${t}</div></div>`;
const caption=(text,file)=>`<p class="chart-caption">${text}${file?`<a href="${file}" download>原始数据 ↓</a>`:''}</p>`;
const legend=(text,color)=>`<span><i class="legend-swatch" style="background:${color}"></i>${text}</span>`;
const imagePanel=(src,title,captionText,badge='放大查看 ↗')=>`<div class="chart-panel"><div class="chart-top"><h4>${title}</h4></div><button class="image-button" data-image="${src}" data-title="${esc(title)}" data-caption="${esc(captionText)}"><img loading="lazy" src="${src}" alt="${esc(title)}"><span>${badge}</span></button>${caption(captionText)}</div>`;

function renderCase(){
  const c=DATA.cases.find(x=>x.id===current);document.documentElement.style.setProperty('--case',c.color);
  document.title=`${c.short} · D3 工程仿真案例库`;
  $('#selected-case-label').innerHTML=`<span class="case-num">CASE / ${c.number}</span><h3>${esc(c.short)}</h3><small style="color:var(--muted);font-size:10px">${esc(c.domain)}</small>`;
  $('#section-nav').innerHTML=sections.map((s,i)=>`<a href="#${c.id}/${sectionIds[i]}" data-section="${sectionIds[i]}" class="${i===0?'active':''}"><span>${String(i+1).padStart(2,'0')}</span>${s}</a>`).join('');
  $('#case-content').innerHTML=`
    <div class="case-heading"><div><p class="eyebrow">CASE ${c.number} / ${esc(c.short.toUpperCase())}</p><h2>${esc(c.title)}</h2><p>${esc(c.summary)}</p><div class="tag-row"><span class="tag">${esc(c.domain)}</span>${c.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div><label><span class="sr-only" style="position:absolute;clip-path:inset(50%);width:1px;height:1px;overflow:hidden">切换案例</span><select id="case-switcher" class="case-switcher" aria-label="切换案例">${DATA.cases.map(x=>`<option value="${x.id}" ${x.id===c.id?'selected':''}>${x.number} / ${esc(x.short)}</option>`).join('')}</select></label></div>
    <div class="result-banner"><div><strong>${esc(c.outcome)}</strong><p>${esc(c.outcomeText)}</p></div><span class="pill">${esc(c.status)}</span></div>
    <section class="content-section" id="brief">${label('brief','01','工程题目','THE ENGINEERING BRIEF')}<p class="section-lead">${esc(c.scenario)}</p><div class="spec-grid">${c.specs.map(([v,k])=>`<div><strong>${esc(v)}</strong><small>${esc(k)}</small></div>`).join('')}</div><ol class="task-list">${c.task.map(t=>`<li>${esc(t)}</li>`).join('')}</ol><div class="formula">${esc(c.formula)}</div><div class="link-row">${docButton(c.docs.task,'阅读全文 · 冻结题目',true)}<a class="doc-button" href="${c.docs.task}" download>下载题目 Markdown ↓</a><a class="doc-button" href="#${c.id}/results" data-section="results">查看模型交付 ↓</a></div></section>
    <section class="content-section" id="difficulty">${label('difficulty','02','核心难点','WHY THIS IS HARD')}<div class="difficulty-grid">${c.difficulties.map((d,i)=>`<div class="difficulty"><span class="step">CHALLENGE / ${String(i+1).padStart(2,'0')}</span><h4>${esc(d.name)}</h4><p>${esc(d.text)}</p></div>`).join('')}</div></section>
    <section class="content-section" id="inputs">${label('inputs','03','给模型的素材','INPUT ASSETS')}<div class="table-wrap"><table class="asset-table"><thead><tr><th>素材 / 证据类型</th><th>内容与用途</th><th>文件形态</th></tr></thead><tbody>${c.assets.map(a=>`<tr><td><strong>${esc(a.name)}</strong><small>${esc(a.kind)}</small></td><td>${esc(a.description)}</td><td>${esc(a.format)}</td></tr>`).join('')}</tbody></table></div>${note(esc(c.inputNote))}${c.id==='coldplate'?`<div class="link-row"><a class="doc-button" href="documents/coldplate-sources.md" download>来源清单 ↓</a><a class="doc-button" href="documents/coldplate-data-audit.md" download>输入数据审计 ↓</a></div>`:''}</section>
    <section class="content-section" id="deliverables">${label('deliverables','04','希望模型交什么，实际交了什么','DELIVERABLE CONTRACT')}<div class="table-wrap"><table class="deliverable-table"><thead><tr><th>交付项</th><th>题目期望</th><th>模型实际交付</th><th>证据状态</th></tr></thead><tbody>${c.deliveries.map(d=>`<tr><td><strong>${esc(d.name)}</strong></td><td>${esc(d.expected)}</td><td>${esc(d.actual)}</td><td><span class="state ${d.state}">${states[d.state]}</span></td></tr>`).join('')}</tbody></table></div>${note('“已交付”表示存在实际实现或产物；准确度、数值可信度与工程放行仍须分别验证。')}</section>
    <section class="content-section" id="results">${label('results','05',c.id==='coldplate'?'题目输入展示 · 等待模型交付':'模型交付 · 可视化证据','WHAT THE AGENT DELIVERED')}<div class="metric-grid">${c.results.map(([v,k])=>`<div class="metric"><strong>${esc(v)}</strong><small>${esc(k)}</small></div>`).join('')}</div>${note(esc(c.resultNote))}<div id="case-visuals"></div><div class="link-row">${c.docs.report?docButton(c.docs.report,'阅读模型原始报告'):''}${c.docs.review?docButton(c.docs.review,'阅读独立评审'):''}${c.id==='francis'?'<a class="doc-button" href="evidence/francis-score.json" download>暂定评分明细 ↓</a>':''}${c.id==='ambench'?'<a class="doc-button" href="evidence/ambench-score.json" download>暂定评分明细 ↓</a>':''}${c.id==='ahead'?'<a class="doc-button" href="evidence/ahead-validator.json" download>独立结构检查 ↓</a>':''}</div></section>
    <section class="content-section" id="environment">${label('environment','06','专业环境与软件','THE ENGINEERING TOOLCHAIN')}<div class="table-wrap"><table class="software-table"><thead><tr><th>软件 / 环境</th><th>版本或范围</th><th>用途与限制</th><th>使用状态</th></tr></thead><tbody>${c.environment.map(s=>`<tr><td><strong>${esc(s.name)}</strong></td><td>${esc(s.version)}</td><td>${esc(s.use)}</td><td><span class="state ${s.status==='能力缺口'||s.status==='待实现'?'missing':s.status==='实际使用'?'done':'pending'}">${esc(s.status)}</span></td></tr>`).join('')}</tbody></table></div><p class="environment-footer">${c.id==='coldplate'?'当前状态：仅建题预检；未来评测预算独立记录。':'测试请求：gpt-6.1-sol / xhigh · Linux · ≤7200 s · 4 CPU · 32 GiB'}<br>${c.id==='ambench'?'运行约 5,210 s，CLI 退出码 0。':c.id==='ahead'?'运行约 6,899 s，CLI 退出码 0；实际解析模型版本未独立确认。':c.id==='francis'?'实际解析模型版本未独立确认；部分驱动退出码缺失。':'未启动 sol 或其他模型评测。'}</p><div class="case-footer"><strong>${esc(c.reference)}</strong><br>${esc(c.caveat)}<br>展示包仅包含所列文档、选取图像和重绘数据；完整工程及大场继续保留在原服务器目录。</div></section>`;
  $('#case-switcher').addEventListener('change',e=>selectCase(e.target.value,'brief',true));
  if(c.id==='coldplate'&&c.statusType==='running')$('.environment-footer').innerHTML='当前状态：sol 正在独立测试 · ≤7200 s · 4 CPU · 32 GiB。<br>仅运行本轮 sol；结果待核验。';
  if(c.id==='coldplate'&&c.runSummary){
    $('.environment-footer').textContent=c.runSummary;
    $('#results .section-label h3').textContent='模型交付 · 可视化证据';
  }
  renderVisuals(c);bindContent();observeSections();
}
function selectCase(id,section='brief',scroll=false){
  if(!ids.includes(id))return;
  current=id;renderCards();renderCase();history.replaceState(null,'',`#${id}/${section}`);
  if(scroll)requestAnimationFrame(()=>$('#'+section)?.scrollIntoView({behavior:'smooth',block:'start'}));
}
function bindContent(){
  $$('[data-section]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const sec=a.dataset.section;history.replaceState(null,'',`#${current}/${sec}`);$('#'+sec)?.scrollIntoView({behavior:'smooth'});}));
  $$('[data-doc]').forEach(b=>b.addEventListener('click',()=>openDocument(b.dataset.doc,b.dataset.title)));
  bindImages();
}
function bindImages(){
  $$('[data-image]').forEach(b=>{b.onclick=()=>{const dlg=$('#image-dialog');$('#large-image').src=b.dataset.image;$('#large-image').alt=b.dataset.title;$('#image-title').textContent=b.dataset.title;$('#large-image-caption').textContent=b.dataset.caption;dlg.showModal();};});
}
function observeSections(){
  if(observer)observer.disconnect();
  observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(visible[0]){$$('#section-nav a').forEach(a=>{const active=a.dataset.section===visible[0].target.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}},{rootMargin:'-100px 0px -55% 0px',threshold:0});
  $$('.content-section').forEach(s=>observer.observe(s));
}

function chart({xmin=0,xmax=1,ymin=0,ymax=1,xlabel='',ylabel='',width=660,height=285,xticks=5,yticks=4,xfmt=v=>v.toFixed(1),yfmt=v=>v.toFixed(1)}){
  const m={l:62,r:20,t:28,b:44},x=v=>m.l+(v-xmin)/(xmax-xmin)*(width-m.l-m.r),y=v=>height-m.b-(v-ymin)/(ymax-ymin)*(height-m.t-m.b);
  let body='';
  for(let i=0;i<=yticks;i++){let v=ymin+(ymax-ymin)*i/yticks;body+=`<line x1="${m.l}" y1="${y(v)}" x2="${width-m.r}" y2="${y(v)}" stroke="#e8ede4"/><text x="${m.l-10}" y="${y(v)+3}" text-anchor="end">${yfmt(v)}</text>`;}
  for(let i=0;xticks>0&&i<=xticks;i++){let v=xmin+(xmax-xmin)*i/xticks;body+=`<text x="${x(v)}" y="${height-m.b+19}" text-anchor="middle">${xfmt(v)}</text>`;}
  body+=`<text x="${m.l}" y="15" fill="#73816b">${esc(ylabel)}</text><text x="${width-m.r}" y="${height-5}" text-anchor="end">${esc(xlabel)}</text>`;
  return {x,y,add:s=>body+=s,render:(title)=>`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}" style="font:10px Consolas,monospace;fill:#7c8876">${body}</svg>`};
}
const poly=(pts,x,y,color,width=2,dash='')=>`<polyline points="${pts.map(p=>`${x(p[0]).toFixed(2)},${y(p[1]).toFixed(2)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
function trajectory(t,points){
  let i=points.findIndex((p,j)=>j<points.length-1&&t>=p.time_s&&t<=points[j+1].time_s);if(i<0)i=points.length-2;
  const a=points[i],b=points[i+1],h=b.time_s-a.time_s,s=(t-a.time_s)/h;
  return (2*s**3-3*s**2+1)*a.angle_deg+(s**3-2*s**2+s)*h*a.velocity_deg_s+(-2*s**3+3*s**2)*b.angle_deg+(s**3-s**2)*h*b.velocity_deg_s;
}
function renderVisuals(c){
  const node=$('#case-visuals');
  if(c.id==='francis'){
    node.innerHTML=`<div class="chart-panel"><div class="chart-top"><div><h4>导叶关闭轨迹：合同基准与模型候选</h4><p>三次 Hermite 插值 · 可拖动时间查看角度</p></div><span class="state done">运动学核查通过</span></div><div class="chart-legend">${legend('合同 smoothstep 基准','#aeb8a4')}${legend('模型候选','#087b92')}</div><div class="chart-content" id="trajectory-chart"></div><div class="slider-row"><label for="trajectory-time">时间</label><input id="trajectory-time" type="range" min="0" max="10" step="0.05" value="5" aria-label="查看轨迹时间"><output id="trajectory-readout"></output></div>${caption('由模型提交的 trajectory.csv 重绘。候选降低峰值角速度约 17.35%；实际压力目标 J 和水力约束未验证。','evidence/francis-trajectory.csv')}</div>
      <div class="chart-panel"><div class="chart-top"><div><h4>尾水管 PIV：实验均值与分区 CFD 对照</h4><p>每个点是一项速度分量，虚线为预测 = 测量</p></div><label><span style="font-size:10px">工况 </span><select class="select" id="piv-operation" aria-label="选择 PIV 工况"><option>BEP</option><option>PL</option></select></label></div><div class="chart-legend">${legend('U 分量','#087b92')}${legend('V 分量','#c27c43')}</div><div class="chart-content" id="piv-chart"></div>${caption('源自 chain_PIV_comparison_BEP / PL.csv。每工况 74 点、148 分量；该单向分区模型缺少下游压力反馈，图中对照不代表可信全机基线。','evidence/francis-chain_PIV_comparison_BEP.csv')}</div>
      <div class="chart-panel"><div class="chart-top"><h4>暂定工程评分：已验证的工作覆盖</h4><span class="state partial">39 / 100 · 事后细则</span></div><div class="score-list">${DATA.charts.francis.score.map(s=>`<div class="score-row"><span>${esc(s.name)}</span><div class="bar-track"><span style="width:${s.value/s.max*100}%"></span></div><span>${s.value}/${s.max}</span></div>`).join('')}</div>${caption('按独立评审 JSON 重绘；没有重求完整 CFD。零分可能表示缺少证据，不等于已证明违反物理约束。','evidence/francis-score.json')}</div>`;
    drawTrajectory();$('#trajectory-time').oninput=drawTrajectory;drawPiv();$('#piv-operation').onchange=drawPiv;
  }else if(c.id==='ambench'){
    node.innerHTML=`<div class="chart-panel"><div class="chart-top"><div><h4>Ypad：模型保存的空间场</h4><p>同一色标对照 · 47 × 81 ROI · 鼠标或轻触读取网格值</p></div><select id="field-metric" class="select" aria-label="选择空间场指标"><option value="roi_depth_um">熔深 / μm</option><option value="surface_peak_K">表面时域峰温 / K</option></select></div><div class="field-grid"><div class="field-card"><h5>基准扫描</h5><canvas id="baseline-field" width="47" height="81" tabindex="0" aria-label="模型提交基准 Ypad 空间场"></canvas><p>x: 0.6–2.9 mm / y: 28.747–32.747 mm</p></div><div class="field-card"><h5>最终候选扫描</h5><canvas id="design-field" width="47" height="81" tabindex="0" aria-label="模型提交最终候选 Ypad 空间场"></canvas><p>保留所有原始轨迹 + 新增 off 停顿</p></div></div><div class="colorbar-wrap"><span id="field-min"></span><span class="colorbar"></span><span id="field-max"></span><span class="field-readout" id="field-readout">源数据 .npy · 共享色标</span></div>${caption('由模型完整交付包中的 Ypad_baseline / final_power_balanced 数组重绘；不是实验图。此为 dx=0.2 mm、20 行时间聚合的精化尝试，尚未收敛；峰温图含接近 4000 K 的裁剪痕迹。','evidence/Ypad_baseline_roi_depth_um.npy')}</div>
      <div class="chart-panel"><div class="chart-top"><div><h4>单道熔深：实测与模型预测</h4><p>公开测量聚合值与模型精化结果 · μm</p></div><span class="state missing">预测偏差超限</span></div><div class="chart-legend">${legend('公开测量 / 模型提取','#abb69e')}${legend('物理求解预测','#b46226')}</div><div class="chart-content" id="depth-chart"></div>${caption('直接读取模型提交 measured_single_track.csv 与 track_results.json。与评审摘要的取整不同，此图保持交付表原值；1.1 / 2.1 / 3.2 为预设留出工况。','evidence/ambench-measured_single_track.csv')}</div>
      <div class="chart-panel"><div class="chart-top"><div><h4>九场景成对压力测试：最坏目标 J</h4><p>J 越低越好 · 深度目标 150 μm · 纵轴从 0 开始</p></div><span class="state missing">未达 ≥10% 改善</span></div><div class="chart-legend">${legend('基准','#abb69e')}${legend('候选','#b46226')}${legend('目标：基准最坏值 × 0.90','#496958')}</div><div class="chart-content" id="scenario-chart"></div><div id="scenario-summary"></div>${caption('由 scenario_results.json 重新取九场景最大值；这是确定性压力测试，不是联合置信保证。该批使用 100 行时间聚合，不与上方精化空间场混算。','evidence/ambench-scenario_results.json')}</div>`;
    drawFields();$('#field-metric').onchange=drawFields;drawDepth();drawScenarios();
  }else if(c.id==='ahead'){
    node.innerHTML=`<div class="chart-panel"><div class="chart-top"><div><h4>三维反应流：真实保存的启动段</h4><p>温度 / 轴向速度 / Qdot · |y| &lt; 1 mm 单元中心散点</p></div><span class="state missing">numerically_invalid</span></div><div class="gallery-controls" id="startup-controls">${[['baseline_H_hot_LES','基准 H'],['baseline_C_hot_LES','基准 C'],['design96_H_hot_LES','9.6 mm 探索候选'],['hylon_P1_A_hot_LES','HYLON P1']].map(([s,t],i)=>`<button class="gallery-control ${i===0?'active':''}" data-startup="${s}">${t}</button>`).join('')}</div><div id="startup-image"></div></div>
      ${imagePanel('assets/ahead-chemistry.png','一维自由火焰：化学机理与输运敏感性','模型原始图；27 组 Cantera 自由火焰实算。可支持化学前处理审计，不能代替三维回火边界或 NOx 验证。')}
      ${imagePanel('assets/ahead-manufacturing.png','节流件关键截面：制造约束审计','模型原始截面图；原套筒局部壁厚约 0.4 mm，简单扩孔会移除套筒。题目壁厚规则与原始零件的关系待机械专家核对，不能据此认定所有允许设计不可行。')}
      ${imagePanel('assets/ahead-time-refinement.png','固定步长启动重放：现有时间精化证据','模型原始图；每档只运行约 10 μs。短时重放不能证明回火边界、统计量或 20τ 观测窗的时间收敛。')}`;
    const setStartup=slug=>{const names={baseline_H_hot_LES:'基准 H',baseline_C_hot_LES:'基准 C',design96_H_hot_LES:'9.6 mm 探索候选',hylon_P1_A_hot_LES:'HYLON P1'};const text=`模型原始图 · ${names[slug]}。保存段未达到 10τ 启动剔除 + 20τ 无事件观测；缺少可信守恒及发展充分统计。Qdot 与当前温度的一致性存在未闭合问题，不能据此确认回火或自燃。`;$('#startup-image').innerHTML=`<button class="image-button" data-image="assets/${slug}.png" data-title="${names[slug]} · 启动场" data-caption="${esc(text)}"><img src="assets/${slug}.png" alt="${names[slug]}启动温度、轴向速度与化学热源散点"><span>放大查看 ↗</span></button>${caption(text)}`;$$('[data-startup]').forEach(b=>{b.classList.toggle('active',b.dataset.startup===slug);b.setAttribute('aria-pressed',b.dataset.startup===slug);});bindImages();};
    setStartup('baseline_H_hot_LES');$$('[data-startup]').forEach(b=>b.onclick=()=>setStartup(b.dataset.startup));
  }else if(c.id==='coldplate'&&DATA.charts.coldplate){
    const evidence=DATA.charts.coldplate;
    node.innerHTML=evidence.panels.map(p=>imagePanel(p.src,p.title,p.caption)).join('')+
      `<div class="chart-panel"><div class="chart-top"><h4>原始证据与独立检查</h4></div><div class="link-row" style="padding:0 20px 20px">${(evidence.downloads||[]).map(d=>`<a class="doc-button" href="${esc(d.path)}" download>${esc(d.label)} ↓</a>`).join('')}</div>${caption(esc(evidence.note||''))}</div>`;
  }else{
    node.innerHTML=`<div class="empty-result"><span class="empty-icon" aria-hidden="true">◫</span><div><h4>${c.statusType==='running'?'sol 测试运行中 · 结果待核验':'尚未启动模型测试'}</h4><p>${c.statusType==='running'?`开始：${esc(c.liveRun.started_at)}；最晚截止：${esc(c.liveRun.deadline_at_utc)}（UTC）。以下只展示题目输入。`:'暂无模型提交的场、工作点、候选几何或性能曲线。以下只展示题目提供的几何输入。'}</p></div></div>${imagePanel('assets/coldplate-layout.png','多热源冷板：基准几何与热源布置','出题方输入示意，非模型交付、非温度场。180×120×12 mm 冷板、六个模块、12 条通道与两个顶部端口；制造 / 泵 / 故障约束详见冻结题目。','放大题目示意 ↗')}
    <div class="chart-panel"><div class="chart-top"><h4>首次测试需要补齐的工程证据</h4></div><div class="score-list">${['独立试件锁定验证','泵系统工作点闭合','真实局部堵塞与三维 CHT','连续域鲁棒上界与配对收益','四条 120 s 热瞬态与储热账本'].map(s=>`<div class="score-row"><span>${s}</span><div class="bar-track"></div><span>待测</span></div>`).join('')}</div>${caption('CAD 布尔操作、粗网格 29,623 单元和软件加载检查仅验证出题包可用性，不能计为模型物理解算或工程通过。','evidence/coldplate-freeze.json')}</div>`;
  }
}
function drawTrajectory(){
  const t=Number($('#trajectory-time').value), pts=DATA.charts.francis.trajectory;
  const p=chart({xmin:0,xmax:10,ymin:6.5,ymax:10,xlabel:'时间 / s',ylabel:'导叶角度 / °',xticks:5,yticks:5});
  const times=Array.from({length:201},(_,i)=>i/20),base=x=>9.84+(6.72-9.84)*(3*(x/10)**2-2*(x/10)**3);
  p.add(poly(times.map(x=>[x,base(x)]),p.x,p.y,'#aeb8a4',2.2));p.add(poly(times.map(x=>[x,trajectory(x,pts)]),p.x,p.y,'#087b92',2.4));
  p.add(`<line x1="${p.x(t)}" y1="28" x2="${p.x(t)}" y2="241" stroke="#aebaaa" stroke-dasharray="3 4"/><circle cx="${p.x(t)}" cy="${p.y(trajectory(t,pts))}" r="4" fill="#087b92" stroke="#fff" stroke-width="2"/>`);
  $('#trajectory-chart').innerHTML=p.render('基准与模型候选导叶关闭轨迹');$('#trajectory-readout').textContent=`t=${t.toFixed(2)} s · ${trajectory(t,pts).toFixed(3)}°`;
}
function drawPiv(){
  const rows=DATA.charts.francis.piv[$('#piv-operation').value],vals=rows.flatMap(r=>[r.experiment_mean_m_s,r.steady_chain_CFD_m_s]);
  const min=Math.floor(Math.min(...vals)),max=Math.ceil(Math.max(...vals));
  const p=chart({xmin:min,xmax:max,ymin:min,ymax:max,xlabel:'实验均值 / m·s⁻¹',ylabel:'分区 CFD / m·s⁻¹',height:300});
  p.add(`<line x1="${p.x(min)}" y1="${p.y(min)}" x2="${p.x(max)}" y2="${p.y(max)}" stroke="#c3cbb9" stroke-dasharray="4 4"/>`);
  rows.forEach(r=>p.add(`<circle cx="${p.x(r.experiment_mean_m_s)}" cy="${p.y(r.steady_chain_CFD_m_s)}" r="2.8" fill="${r.component==='U'?'#087b92':'#c27c43'}" fill-opacity=".7"><title>测点 ${r.point_id} / ${r.component}：实验 ${r.experiment_mean_m_s.toFixed(3)}，计算 ${r.steady_chain_CFD_m_s.toFixed(3)} m/s</title></circle>`));
  $('#piv-chart').innerHTML=p.render(`${$('#piv-operation').value} 实验和单向分区 CFD 速度对照`);
}
function drawDepth(){
  const rows=DATA.charts.ambench.tracks,p=chart({xmin:0,xmax:7,ymin:0,ymax:250,xlabel:'工况编号 (* 留出验证)',ylabel:'熔深 / μm',xticks:0,yticks:5,xfmt:()=>'',yfmt:v=>v.toFixed(0)});
  rows.forEach((r,i)=>{let x=p.x(i+.5);p.add(`<rect x="${x-16}" y="${p.y(r.measured)}" width="14" height="${p.y(0)-p.y(r.measured)}" rx="1" fill="#abb69e"><title>${r.case} 测量 ${r.measured} μm</title></rect><rect x="${x+2}" y="${p.y(r.predicted)}" width="14" height="${p.y(0)-p.y(r.predicted)}" rx="1" fill="#b46226"><title>${r.case} 预测 ${r.predicted.toFixed(2)} μm</title></rect><text x="${x}" y="258" text-anchor="middle">${r.case}${['1.1','2.1','3.2'].includes(r.case)?'*':''}</text>`);});
  $('#depth-chart').innerHTML=p.render('七个单道实测与预测熔深对照');
}
function drawScenarios(){
  const rows=DATA.charts.ambench.scenarios,names=['名义','功率−','功率+','速度−','速度+','光斑−','光斑+','初温−','初温+'];
  const p=chart({xmin:0,xmax:9,ymin:0,ymax:1,xlabel:'确定性压力场景',ylabel:'目标 J / 无量纲',xticks:0,yticks:5,xfmt:()=>''});
  const maxB=Math.max(...rows.map(r=>r.baseline)),maxD=Math.max(...rows.map(r=>r.design)),goal=maxB*.9;
  rows.forEach((r,i)=>{let x=p.x(i+.5);p.add(`<rect x="${x-13}" y="${p.y(r.baseline)}" width="11" height="${p.y(0)-p.y(r.baseline)}" rx="1" fill="#abb69e"/><rect x="${x+2}" y="${p.y(r.design)}" width="11" height="${p.y(0)-p.y(r.design)}" rx="1" fill="#b46226"><title>${names[i]}：基准 ${r.baseline.toFixed(6)}，候选 ${r.design.toFixed(6)}</title></rect><text x="${x}" y="258" text-anchor="middle" style="font-size:9px">${names[i]}</text>`);});
  p.add(`<line x1="62" x2="640" y1="${p.y(goal)}" y2="${p.y(goal)}" stroke="#496958" stroke-dasharray="4 4" stroke-width="1.4"/>`);
  $('#scenario-chart').innerHTML=p.render('九个压力场景的基准和设计目标 J');
  $('#scenario-summary').innerHTML=`<div style="padding:0 20px 8px;font-size:10px;color:var(--muted)">九场景最坏 J：<b>${maxB.toFixed(5)} → ${maxD.toFixed(5)}</b> · 改善 <b>${((1-maxD/maxB)*100).toFixed(2)}%</b> · 目标 ≤ ${goal.toFixed(5)}</div>`;
}
const stops=[[23,61,81],[56,122,141],[153,183,167],[236,206,131],[187,98,42]];
function colorAt(v){const u=Math.max(0,Math.min(1,v))*(stops.length-1),i=Math.min(stops.length-2,Math.floor(u)),s=u-i;return stops[i].map((c,j)=>Math.round(c+(stops[i+1][j]-c)*s));}
function drawFields(){
  const metric=$('#field-metric').value,keys=['Ypad_baseline','final_power_balanced'],fields=DATA.charts.ambench.fields;
  const vals=keys.flatMap(k=>fields[k][metric].flat()).filter(Number.isFinite),low=metric==='roi_depth_um'?0:Math.floor(Math.min(...vals)/100)*100,high=metric==='roi_depth_um'?Math.ceil(Math.max(...vals)/25)*25:Math.ceil(Math.max(...vals)/100)*100,unit=metric==='roi_depth_um'?'μm':'K';
  $('#field-min').textContent=`${low} ${unit}`;$('#field-max').textContent=`${high} ${unit}`;$('#field-readout').textContent='x 水平向右 / y 从上到下递减';
  keys.forEach((key,i)=>{
    const canvas=$(i?'#design-field':'#baseline-field'),array=fields[key][metric],h=array.length,w=array[0].length;canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const val=array[h-1-y][x],rgb=colorAt((val-low)/(high-low)),idx=(y*w+x)*4;pixels.data.set([...rgb,255],idx);}ctx.putImageData(pixels,0,0);
    const sample=e=>{const box=canvas.getBoundingClientRect(),scale=Math.min(box.width/w,box.height/h),rw=w*scale,rh=h*scale,left=box.left+(box.width-rw)/2,top=box.top+(box.height-rh)/2,x=Math.floor((e.clientX-left)/scale),y=Math.floor((e.clientY-top)/scale);if(x<0||x>=w||y<0||y>=h)return;const yy=h-1-y,v=array[yy][x];$('#field-readout').textContent=`${i?'候选':'基准'} · x=${(.6+x*.05).toFixed(2)}, y=${(28.747+yy*.05).toFixed(3)} mm · ${v.toFixed(2)} ${unit}`;};
    canvas.onpointermove=sample;canvas.onclick=sample;canvas.onfocus=()=>{$('#field-readout').textContent=`${i?'候选':'基准'}中心网格值：${array[Math.floor(h/2)][Math.floor(w/2)].toFixed(2)} ${unit}`;};
  });
}

function inline(text){
  return esc(text).replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<span class="image-ref">[原文图像：$1 · $2]</span>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>');
}
function markdown(text){
  const lines=text.replace(/\r/g,'').split('\n');let html='',inCode=false,code=[],list='';const close=()=>{if(list){html+=`</${list}>`;list='';}};
  for(let i=0;i<lines.length;i++){
    const l=lines[i];if(l.startsWith('```')){close();if(inCode){html+='<pre><code>'+esc(code.join('\n'))+'</code></pre>';code=[];}inCode=!inCode;continue;}if(inCode){code.push(l);continue;}
    if(/^<!--/.test(l))continue;
    if(/^\|/.test(l)&&/^\|[\s:|\-]+\|?$/.test(lines[i+1]||'')){
      close();const cells=s=>s.trim().replace(/^\||\|$/g,'').split('|').map(x=>inline(x.trim()));html+='<div class="table-wrap"><table><thead><tr>'+cells(l).map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>';i+=2;while(i<lines.length&&/^\|/.test(lines[i])){html+='<tr>'+cells(lines[i]).map(x=>'<td>'+x+'</td>').join('')+'</tr>';i++;}i--;html+='</tbody></table></div>';continue;
    }
    const h=l.match(/^(#{1,6})\s+(.+)$/),li=l.match(/^\s*(?:[-*]|\d+\.)\s+(.+)$/);if(h){close();html+=`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`;}else if(li){const type=/^\s*\d/.test(l)?'ol':'ul';if(list!==type){close();list=type;html+=`<${type}>`;}html+=`<li>${inline(li[1])}</li>`;}else{close();if(l.trim())html+='<p>'+inline(l)+'</p>';}
  }close();if(inCode)html+='<pre>'+esc(code.join('\n'))+'</pre>';return html;
}
function openDocument(path,title){
  $('#document-title').textContent=title;$('#document-body').innerHTML=markdown(DATA.documents[path]||'文档未纳入当前展示包。');$('#document-download').href=path;$('#document-dialog').showModal();$('#document-dialog').scrollTop=0;
}
$('#close-document').onclick=()=>$('#document-dialog').close();$('#close-image').onclick=()=>$('#image-dialog').close();
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('#print-button').onclick=()=>{window.print();};
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;$$('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});const found=DATA.cases.filter(matches);if(found.length&&!found.some(c=>c.id===current))selectCase(found[0].id);else renderCards();}));
$('#case-search').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();const found=DATA.cases.filter(matches);if(found.length&&!found.some(c=>c.id===current))selectCase(found[0].id);else renderCards();});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('dialog[open]')){e.preventDefault();$('#case-search').focus();}});
window.addEventListener('hashchange',()=>{const [id,section]=location.hash.slice(1).split('/');if(ids.includes(id)){if(current!==id)selectCase(id,sectionIds.includes(section)?section:'brief');$('#'+(sectionIds.includes(section)?section:'brief'))?.scrollIntoView();}});
renderCards();renderCase();
if(ids.includes(location.hash.slice(1).split('/')[0]))requestAnimationFrame(()=>$('#'+(location.hash.split('/')[1]||'brief'))?.scrollIntoView({behavior:'instant'}));
