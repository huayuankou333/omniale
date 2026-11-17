/* Charts and gallery use archived solver diagnostics only. */
(()=>{'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.mountRecentEvidence=(node,c,prefix='')=>{
 const d=c.diagnostic;
 node.innerHTML=`<div class="chart-panel diagnostic-panel"><div class="chart-top"><div><h4>${esc(d.title)}</h4><p>${esc(d.caption)}</p></div><label class="diagnostic-select">诊断指标 <select class="select" aria-label="选择诊断指标">${d.labels.map((x,i)=>`<option value="${i}">${esc(x)}</option>`).join('')}</select></label></div><div class="diagnostic-chart" aria-live="polite"></div><p class="chart-caption">按归档数值重绘，数值与状态可从原始文件复核。<a href="${prefix+d.source}" download>原始诊断 JSON ↓</a></p></div><div class="gallery-heading"><div><h4>模型实际交付图</h4><p>图注保留计算性质与适用范围；点击图片放大。</p></div><span>${c.visuals.length} 张选取原图</span></div><div class="gallery-filters" role="group" aria-label="按交付类型筛选图片"><button class="active" aria-pressed="true" data-gallery-group="all">全部图像</button>${[...new Set(c.visuals.map(x=>x.group))].map(g=>`<button aria-pressed="false" data-gallery-group="${esc(g)}">${esc(g)}</button>`).join('')}</div><div class="recent-gallery-grid"></div><button class="gallery-more doc-button">查看全部 ${c.visuals.length} 张交付图 ↓</button>`;
 const draw=()=>{
  const index=Number(node.querySelector('select').value),values=d.rows.map(r=>r.values[index]),max=Math.max(...values,d.threshold||0)*1.16||1;
  const width=700,left=56,right=85,row=51,height=42+d.rows.length*row,span=width-left-right;
  let svg=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(d.title+'：'+d.labels[index])}"><text x="${left}" y="18" fill="#68736c" font-size="11">${esc(d.labels[index])} / ${esc(d.unit)}</text>`;
  for(let i=0;i<d.rows.length;i++){
   const y=37+i*row,v=values[i];
   svg+=`<text x="8" y="${y+17}" font-size="12" fill="#1c2c29">${esc(d.rows[i].id)}</text><rect x="${left}" y="${y}" width="${span}" height="26" rx="3" fill="#eff1eb"/><rect x="${left}" y="${y}" width="${Math.max(1,v/max*span)}" height="26" rx="3" fill="${c.color}"/><text x="${width-right+12}" y="${y+17}" font-size="12" fill="#1c2c29">${v<.01?v.toFixed(4):v.toFixed(2)}${esc(d.unit)}</text>`;
  }
  if(d.threshold){const x=left+d.threshold/max*span;svg+=`<line x1="${x}" x2="${x}" y1="27" y2="${height-12}" stroke="#b1533b" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${x+5}" y="${height-2}" font-size="10" fill="#b1533b">合同门槛 ${d.threshold}%</text>`;}
  node.querySelector('.diagnostic-chart').innerHTML=svg+'</svg>';
 };
 node.querySelector('select').onchange=draw;draw();
 let group='all',expanded=false;
 const render=()=>{
  const all=c.visuals.filter(x=>group==='all'||x.group===group),shown=expanded?all:all.slice(0,4);
  node.querySelector('.recent-gallery-grid').innerHTML=shown.map(v=>`<figure class="recent-figure"><button class="image-button" data-image="${prefix+v.file}" data-title="${esc(v.title)}" data-caption="${esc(v.caption)}"><img src="${prefix+v.file}" alt="${esc(v.title)}" loading="lazy"><span>模型原图 · 放大查看 ↗</span></button><figcaption><strong>${esc(v.title)}</strong><p>${esc(v.caption)}</p><a href="${prefix+v.file}" download>下载原图 ↓</a></figcaption></figure>`).join('');
  node.querySelector('.gallery-more').hidden=expanded||all.length<=4;
  node.querySelectorAll('[data-image]').forEach(b=>b.onclick=()=>{
   const dialog=document.querySelector('#image-dialog');document.querySelector('#large-image').src=b.dataset.image;document.querySelector('#large-image').alt=b.dataset.title;document.querySelector('#image-title').textContent=b.dataset.title;document.querySelector('#large-image-caption').textContent=b.dataset.caption;dialog.showModal();
  });
 };
 node.querySelectorAll('[data-gallery-group]').forEach(b=>b.onclick=()=>{group=b.dataset.galleryGroup;expanded=group!=='all';node.querySelectorAll('[data-gallery-group]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});render();});
 node.querySelector('.gallery-more').onclick=()=>{expanded=true;render();};render();
};
})();
