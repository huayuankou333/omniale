'use strict';
(() => {
 const $=(selector,root=document)=>root.querySelector(selector);
 const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=(v,d=2)=>v==null||!Number.isFinite(v)?'未测得':Number(v).toLocaleString('en-US',{maximumFractionDigits:d});
 const observer=new IntersectionObserver(entries=>{const entry=entries.find(e=>e.isIntersecting);if(entry)$$('.section-nav a').forEach(a=>a.classList.toggle('active',a.hash===`#${entry.target.id}`));},{rootMargin:'-8% 0px -65% 0px'});
 $$('.detail-section').forEach(s=>observer.observe(s));
 fetch('../../files/opamp-porting/task.md').then(r=>{if(!r.ok)throw Error(r.status);return r.text();}).then(text=>$('#original-task').textContent=text).catch(()=>$('#original-task').textContent='题面未能载入，可在文件区打开完整原题。');
 fetch('../../data/opamp-porting.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(init).catch(error=>{
  const notice=document.createElement('div');notice.className='opamp-error';notice.textContent='仿真数据暂时未能载入。请通过网站的 HTTP 地址访问，或在文件区下载完整报告与测量数据。';$('#results').prepend(notice);console.error(error);
 });

 function init(data){
  let modelId='sol',attemptIndex=2,showReference=true;
  const model=()=>data.models.find(m=>m.id===modelId);
  const attempt=()=>model().attempts[attemptIndex];
  const unitValue=(value,spec)=>{
   if(value==null||!Number.isFinite(value))return '未测得';
   if(spec.key==='ugf_Hz'&&value<1000)return `${number(value)} Hz`;
   return `${number(value*spec.scale,spec.key==='n_triode'?0:2)} ${spec.unit}`;
  };
  const requirement=spec=>`${spec.op==='>='?'≥':'≤'} ${unitValue(spec.limit,spec)}`;
  const metricCell=(value,spec,pass)=>`<span class="${pass?'metric-pass':'metric-fail'}">${unitValue(value,spec)}<span class="metric-symbol" aria-label="${pass?'达标':'未达标'}">${pass?'✓':'×'}</span></span>`;
  const final=m=>m.attempts.at(-1);
  $('#final-metrics tbody').innerHTML=data.specs.map(spec=>`<tr><td>${escape(spec.label)}</td><td>${requirement(spec)}</td>${[...data.models.map(final),data.reference].map(a=>metricCell(a.metrics[spec.key],spec,a.checks.find(c=>c.metric===spec.key).pass)).map(s=>`<td>${s}</td>`).join('')}</tr>`).join('');
  $('#attempt-matrix').innerHTML=data.models.map(m=>`<div class="attempt-model-row"><span><i class="dot ${m.id}"></i>${escape(m.label)}</span>${m.attempts.map((a,i)=>`<button class="attempt-choice" data-model="${m.id}" data-index="${i}" aria-label="查看 ${escape(m.label)} 第 ${a.number} 次设计，F，${a.passed}项达标"><span><span class="attempt-num">ATTEMPT 0${a.number}</span><strong>${a.passed} / 8 项达标</strong></span><span class="f-label">${a.outcome} ↗</span></button>`).join('')}</div>`).join('');
  $$('.attempt-choice').forEach(b=>b.addEventListener('click',()=>{modelId=b.dataset.model;attemptIndex=Number(b.dataset.index);render();$('#simulation').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}));
  $$('#design-model button').forEach(b=>b.addEventListener('click',()=>{modelId=b.dataset.model;render();}));
  $$('#design-attempt button').forEach(b=>b.addEventListener('click',()=>{attemptIndex=Number(b.dataset.attempt)-1;renderDesign();}));
  $('#show-reference').addEventListener('change',e=>{showReference=e.target.checked;renderDesign();});
  $('#copy-netlist').addEventListener('click',async()=>{
   try{await navigator.clipboard.writeText(attempt().netlist);$('#copy-netlist').textContent='已复制';}
   catch{$('#copy-netlist').textContent='请选中下方网表复制';}
   setTimeout(()=>$('#copy-netlist').textContent='复制网表',1800);
  });
  let resizeTimer;
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(renderDesign,120);});

  function render(){renderDesign();renderTrajectory();}
  function renderDesign(){
   const m=model(),a=attempt(),color=m.id==='sol'?'#246a5e':'#bb7049';
   $$('#design-model button').forEach(b=>{const on=b.dataset.model===m.id;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
   $$('#design-attempt button').forEach(b=>{const on=Number(b.dataset.attempt)===a.number;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
   $('#selected-design').textContent=`${m.label} · 第 ${a.number} 次设计`;
   $('#selected-result').textContent=`${a.outcome} · ${a.passed}/8 项达标`;
   $('#selected-score-link').href=a.files.score;
   $('.selected-line').style.borderColor=color;
   $$('.reference-legend').forEach(el=>el.hidden=!showReference);
   $('#selected-metrics').innerHTML=data.specs.map(spec=>{const c=a.checks.find(c=>c.metric===spec.key);return `<div class="mini-metric"><span>${escape(spec.label)}</span><strong class="${c.pass?'metric-pass':'metric-fail'}">${unitValue(c.value,spec)} ${c.pass?'✓':'×'}</strong><small>要求 ${requirement(spec)}</small></div>`;}).join('');
   $('#netlist-code').textContent=a.netlist;
   $('#netlist-sha').textContent=`SHA256 ${a.sha256.slice(0,20)}…`;
   $('#netlist-sha').title=a.sha256;
   $('#netlist-download').href=a.files.netlist;
   $('#netlist-download').download=`${m.model}-attempt-${a.number}.sp`;
   $('#transient-download').href=a.files.transient;
   $('#transient-caption').textContent=`${m.label} · 第 ${a.number} 次 · ${a.source_transient_rows.toLocaleString()} 个原始采样点（所示周期）`;
   $('#operating-points tbody').innerHTML=a.headroom.devices.map(d=>`<tr class="${d.margin_V<0?'triode-row':''}"><td>${escape(d.device)}</td><td>${escape(d.type)}</td>${['id_uA','vgs_V','vds_V','vdsat_V','margin_V'].map(key=>`<td>${number(d[key],3)}</td>`).join('')}<td class="${d.margin_V<0?'metric-fail':'metric-pass'}">${d.margin_V<0?'× 未饱和':'✓ 饱和'}</td></tr>`).join('');
   const reference=showReference?data.reference:null;
   chart($('#transient-chart'),{
    name:`${m.label} 第 ${a.number} 次设计瞬态响应`,type:'transient',color,
    series:[{label:'输入',className:'input-curve',rows:a.transient.map(p=>[p[0],p[1]])},
            ...(reference?[{label:'参考解',className:'reference-curve',rows:reference.transient.map(p=>[p[0],p[2]])}]:[]),
            {label:m.label,className:'selected-curve',rows:a.transient.map(p=>[p[0],p[2]])}],
    domain:[100,200],ticks:[100,120,140,160,180,200],xlabel:'time / ns',ylabel:'V',height:280});
   const common={domain:[1,10],ticks:[1,2,3,4,5,6,7,8,9,10],xlabel:'frequency / Hz',height:280,color};
   chart($('#gain-chart'),{...common,name:`${m.label} 第 ${a.number} 次设计环路增益`,type:'gain',ylabel:'dB',threshold:0,
    series:[...(reference?[{label:'参考解',className:'reference-curve',rows:reference.loop.map(p=>[Math.log10(p[0]),p[1]])}]:[]),{label:m.label,className:'selected-curve',rows:a.loop.map(p=>[Math.log10(p[0]),p[1]])}]});
   chart($('#phase-chart'),{...common,name:`${m.label} 第 ${a.number} 次设计环路相位`,type:'phase',ylabel:'degree',threshold:-180,
    series:[...(reference?[{label:'参考解',className:'reference-curve',rows:reference.loop.map(p=>[Math.log10(p[0]),p[2]])}]:[]),{label:m.label,className:'selected-curve',rows:a.loop.map(p=>[Math.log10(p[0]),p[2]])}]});
  }

  function renderTrajectory(){
   const m=model();$('#trajectory-model-label').textContent=m.label;
   $('#design-trajectory').innerHTML=m.attempts.map(a=>{
    const failed=data.specs.filter(spec=>!a.checks.find(c=>c.metric===spec.key).pass).map(s=>s.label).join('、');
    return `<article class="design-round"><div class="round-head"><div><span class="round-number">DESIGN ATTEMPT 0${a.number} / 03</span><h3>第 ${a.number} 次：${a.outcome} · ${a.passed}/8 项达标</h3><p>输出 ${a.usage.output_tokens.toLocaleString()} token（含推理 ${a.usage.reasoning_tokens.toLocaleString()}） · API 耗时 ${number(a.usage.wall_seconds,1)} s</p></div><a href="#simulation" class="text-link jump-design" data-index="${a.number-1}">检查此版波形与电路 ↗</a></div><p class="round-fails"><b>未达标</b> ${escape(failed)}</p><div class="round-disclosures"><details><summary>模型实际回复 <span>＋</span></summary><pre>${escape(a.reply)}</pre></details>${a.feedback?`<details><summary>本次发送的仿真反馈 <span>＋</span></summary><pre>${escape(a.feedback)}</pre></details>`:'<p class="last-round-note">达到三次设计上限，冻结这份提交，独立复测；没有继续向模型发送修订反馈。</p>'}</div></article>`;
   }).join('');
   $$('.jump-design').forEach(link=>link.addEventListener('click',()=>{attemptIndex=Number(link.dataset.index);renderDesign();}));
   $('#usage-summary').innerHTML=[['输入 token',m.usage.input_tokens.toLocaleString()],['输出 token（含推理）',m.usage.output_tokens_including_reasoning.toLocaleString()],['其中推理 token',m.usage.reasoning_tokens.toLocaleString()],['累计 API 耗时',`${number(m.usage.inference_wall_seconds,1)} s`]].map(([label,value])=>`<div>${label}<b>${value}</b></div>`).join('');
  }

  function chart(container,config){
   const W=Math.max(320,Math.min(1000,Math.round(container.getBoundingClientRect().width))),H=config.height,L=51,R=15,T=25,B=43,pw=W-L-R,ph=H-T-B;
   const all=config.series.flatMap(s=>s.rows.map(p=>p[1])).filter(Number.isFinite);
   if(config.threshold!=null)all.push(config.threshold);
   let lo=Math.min(...all),hi=Math.max(...all),pad=Math.max((hi-lo)*.12,config.type==='transient'?.04:10);
   lo-=pad;hi+=pad;
   const span=hi-lo,rough=span/5,power=10**Math.floor(Math.log10(rough));
   const step=[1,2,2.5,5,10].map(x=>x*power).find(x=>x>=rough)||power*10;
   lo=Math.floor(lo/step)*step;hi=Math.ceil(hi/step)*step;
   const x=v=>L+(v-config.domain[0])/(config.domain[1]-config.domain[0])*pw;
   const y=v=>T+(hi-v)/(hi-lo)*ph;
   const tickLabel=v=>config.type==='transient'?String(v):({1:'10',2:'100',3:'1k',4:'10k',5:'100k',6:'1M',7:'10M',8:'100M',9:'1G',10:'10G'})[v];
   let markup=`<svg viewBox="0 0 ${W} ${H}" role="img" tabindex="0" aria-label="${escape(config.name)}。用左右方向键查看数值。"><title>${escape(config.name)}</title><defs><clipPath id="clip-${config.type}"><rect x="${L}" y="${T}" width="${pw}" height="${ph}"/></clipPath></defs>`;
   for(let value=lo;value<=hi+step/100;value+=step){markup+=`<line class="grid-line" x1="${L}" y1="${y(value)}" x2="${W-R}" y2="${y(value)}"/><text class="axis-label" x="${L-9}" y="${y(value)+4}" text-anchor="end">${number(Math.abs(value)<step/100?0:value,config.type==='transient'?2:0)}</text>`;}
   config.ticks.filter((v,i)=>W>=480||config.type==='transient'||i%2===0||i===config.ticks.length-1).forEach(value=>{markup+=`<line class="grid-line" x1="${x(value)}" y1="${T}" x2="${x(value)}" y2="${H-B}"/><text class="axis-label" x="${x(value)}" y="${H-B+20}" text-anchor="middle">${tickLabel(value)}</text>`;});
   markup+=`<text class="axis-unit" x="${L}" y="12">${config.ylabel}</text><text class="axis-unit" x="${W-R}" y="${H-5}" text-anchor="end">${config.xlabel}</text>`;
   if(config.threshold!=null)markup+=`<line class="threshold" x1="${L}" x2="${W-R}" y1="${y(config.threshold)}" y2="${y(config.threshold)}"/>`;
   config.series.forEach(series=>{
    let path='',valid=false;
    series.rows.forEach(([xx,yy])=>{if(!Number.isFinite(xx)||!Number.isFinite(yy)){valid=false;return;}path+=`${valid?'L':'M'}${x(xx).toFixed(2)},${y(yy).toFixed(2)} `;valid=true;});
    markup+=`<path class="chart-curve ${series.className}" d="${path}" clip-path="url(#clip-${config.type})" ${series.className==='selected-curve'?`style="stroke:${config.color}"`:''}/>`;
   });
   markup+=`<g class="crosshair-group" style="display:none"><line class="crosshair" x1="0" x2="0" y1="${T}" y2="${H-B}"/></g><rect class="chart-hit" x="${L}" y="${T}" width="${pw}" height="${ph}" fill="transparent"/></svg><div class="chart-readout" aria-live="off">悬停或用方向键读取曲线数值</div>`;
   container.innerHTML=markup;
   const svg=$('svg',container),hit=$('.chart-hit',container),cross=$('.crosshair-group',container),readout=$('.chart-readout',container);
   let current=0;
   const selected=config.series.at(-1).rows;
   function nearest(rows,value){let a=0,b=rows.length-1;while(a<b){let mid=Math.floor((a+b)/2);if(rows[mid][0]<value)a=mid+1;else b=mid;}if(a>0&&Math.abs(rows[a-1][0]-value)<Math.abs(rows[a][0]-value))a--;return a;}
   function inspect(value){
    current=nearest(selected,value);const xx=selected[current][0];
    cross.style.display='';const line=$('line',cross);line.setAttribute('x1',x(xx));line.setAttribute('x2',x(xx));
    const axis=config.type==='transient'?`${number(xx)} ns`:`${number(10**xx,1)} Hz`;
    const suffix=config.type==='transient'?'V':config.type==='gain'?'dB':'°';
    readout.textContent=axis+' · '+config.series.map(s=>`${s.label} ${number(s.rows[nearest(s.rows,xx)][1],3)} ${suffix}`).join(' · ');
   }
   hit.addEventListener('pointermove',event=>{const r=svg.getBoundingClientRect(),vx=(event.clientX-r.left)*W/r.width;inspect(config.domain[0]+Math.min(1,Math.max(0,(vx-L)/pw))*(config.domain[1]-config.domain[0]));});
   svg.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();current=event.key==='Home'?0:event.key==='End'?selected.length-1:Math.max(0,Math.min(selected.length-1,current+(event.key==='ArrowRight'?1:-1)));inspect(selected[current][0]);}});
   svg.addEventListener('focus',()=>inspect(selected[current][0]));
  }
  render();
 }
})();
