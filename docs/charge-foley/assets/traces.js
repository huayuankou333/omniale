'use strict';
const $=s=>document.querySelector(s),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let dataset,loadId=0;
const error=r=>Boolean(r.result?.error||r.result?.ok===false||r.result?.success===false||r.error);
function render(){
 const action=$('#trace-action').value,stage=$('#trace-stage').value,q=$('#trace-search').value.toLowerCase(),only=$('#trace-errors').checked;
 const rows=dataset.events.filter(r=>(action==='all'||(r.arguments?.action||'invalid_call')===action)&&(stage==='all'||r.stage===stage)&&(!only||error(r))&&(!q||JSON.stringify(r).toLowerCase().includes(q)));
 $('#trace-status').textContent=`${dataset.model} · 显示 ${rows.length}/${dataset.events.length} 条 · 观察图引用 ${dataset.observation_images} · 原记录SHA256 ${dataset.source_sha256.slice(0,16)}…`;
 $('#trace-list').innerHTML=rows.length?rows.map(r=>`<details class="trace-event ${error(r)?'trace-error':''}" id="event-${r.tool_call}"><summary><b>#${r.tool_call}</b> <span class="action">${esc(r.arguments?.action||'invalid_call')}</span> <span class="caption">${esc(r.stage)}</span><span class="time">${esc(r.at_local||'')}</span><span class="reason">${esc(r.arguments?.reason||'未提供操作理由')}</span></summary><div class="trace-body"><h4>实际参数</h4><pre>${esc(JSON.stringify(r.arguments,null,2))}</pre><h4>工具返回</h4><pre>${esc(JSON.stringify(r.result??r.error,null,2))}</pre>${(r.result?.images||[]).some(i=>i.public_url)?`<h4>当时看到的真实画面</h4><div class="observation-grid">${r.result.images.filter(i=>i.public_url).map(i=>`<figure><a href="${esc(i.public_url)}"><img loading="lazy" src="${esc(i.public_url)}" alt="${esc(i.source)} · ${esc(i.time_s)}秒的实际观察帧"></a><figcaption>${esc(i.source)} · ${esc(i.time_s)} s</figcaption></figure>`).join('')}</div>`:''}</div></details>`).join(''):'<p class="empty">没有匹配记录。</p>';
}
async function load(){
 const id=++loadId,slug=$('#trace-model').value;$('#trace-status').textContent='正在加载实际轨迹…';
 const response=await fetch(`records/${slug}/trace.json`);if(!response.ok)throw new Error('轨迹读取失败');const value=await response.json();if(id!==loadId)return;
 dataset=value;$('#trace-json').href=`records/${slug}/trace.json`;
 const actions=[...new Set(dataset.events.map(r=>r.arguments?.action||'invalid_call'))].sort();$('#trace-action').innerHTML='<option value="all">全部工具</option>'+actions.map(a=>`<option value="${esc(a)}">${esc(a)}</option>`).join('');
 const url=new URL(location.href);url.searchParams.set('model',slug);history.replaceState(null,'',url);render();
 const hash=location.hash;if(/^#event-\d+$/.test(hash)){const el=document.querySelector(hash);if(el){el.open=true;el.scrollIntoView()}}
}
const initial=new URL(location.href).searchParams.get('model');if(['luna','sol','deepseek'].includes(initial))$('#trace-model').value=initial;
$('#trace-model').addEventListener('change',()=>load().catch(e=>$('#trace-status').textContent=e.message));
for(const s of ['#trace-action','#trace-stage','#trace-errors'])$(s).addEventListener('change',render);$('#trace-search').addEventListener('input',render);
load().catch(e=>$('#trace-status').textContent=e.message);
