'use strict';
const $=s=>document.querySelector(s);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
let report,events=[],generation=0;
const bad=e=>Boolean(e.result?.error||e.result?.tool_error||e.result?.ok===false||e.result?.success===false||e.result?.status==='error');
function render(){
 const action=$('#trace-action').value,q=$('#trace-query').value.toLowerCase().trim(),onlyErrors=$('#errors-only').checked;
 const selected=events.filter(e=>(action==='all'||e.action===action)&&(!onlyErrors||bad(e))&&(!q||JSON.stringify(e).toLowerCase().includes(q)));
 const m=report.models.find(m=>m.model===$('#trace-model').value);
 $('#trace-summary').textContent=`${m.model} · ${m.api_requests}次API / ${m.tool_calls}次工具 · 有效${(m.elapsed_seconds/60).toFixed(2)}分钟 · 当前显示${selected.length}/${events.length}条。${m.infrastructure_recovery?'含同工程基础设施恢复；未提供编辑帮助。':''}`;
 const parent=$('#trace-events');parent.replaceChildren();if(!selected.length){parent.append(el('p','没有匹配的工具事件。','trace-empty'));return;}
 for(const event of selected){
  const d=el('details',undefined,'trace-event'+(bad(event)?' trace-error':''));d.id='event-'+event.ordinal;
  const s=el('summary');s.append(el('span','#'+event.tool_call,'step'),el('span',event.action,'action'),el('span',event.at_local||'','time'),el('span',event.arguments?.reason||'无可见操作理由字段','reason'));d.append(s);
  let built=false;d.addEventListener('toggle',()=>{if(!d.open||built)return;built=true;const content=el('div',undefined,'trace-content');content.append(el('p',`工具序号 ${event.tool_call} · API请求 ${event.api_request} · 日志条目 ${event.ordinal}`,'trace-meta'));
   if(event.observations?.length){const grid=el('div',undefined,'observation-grid');for(const o of event.observations){const f=el('figure');const img=el('img');img.src=o.src;img.alt=`${o.source} @ ${o.time}秒，模型实际观察帧`;img.loading='lazy';f.append(img,el('figcaption',`${o.source} · 源${o.time}秒`));grid.append(f);}content.append(el('h4','模型实际观察到的AMI画面'),grid);}
   if(event.omitted_media?.length)content.append(el('p','此调用还观察了官方教程帧。本站保留来源/时间/哈希记录，教程画面请由原发布方获取。','caption'));
   content.append(el('h4','实际工具参数'),el('pre',JSON.stringify(event.arguments,null,2)),el('h4','实际工具返回'),el('pre',JSON.stringify(event.result,null,2)));d.append(content);
  });parent.append(d);
 }
 const anchor=location.hash.match(/^#event-(\d+)$/);if(anchor){const d=document.getElementById('event-'+anchor[1]);if(d){d.open=true;d.scrollIntoView({block:'start'});}}
}
async function loadModel(){const seq=++generation,model=$('#trace-model').value,m=report.models.find(x=>x.model===model);$('#trace-summary').textContent='正在加载 '+model+' 的实际工具轨迹…';
 const response=await fetch(m.trace_url);if(!response.ok)throw new Error('trace '+response.status);const data=await response.json();if(seq!==generation)return;events=data.events;
 const select=$('#trace-action');select.replaceChildren();let o=el('option','全部工具');o.value='all';select.append(o);for(const name of [...new Set(events.map(e=>e.action))].sort()){o=el('option',name+' · '+events.filter(e=>e.action===name).length);o.value=name;select.append(o);}
 const links=$('#trace-downloads');links.replaceChildren();const a=el('a','下载完整公开工具轨迹 JSON');a.href=m.trace_url;a.download='';links.append(a);const b=el('a','回看该模型成片');b.href='./#'+m.id;links.append(b);render();
}
async function boot(){const r=await fetch('data/report.json');if(!r.ok)throw new Error('report '+r.status);report=await r.json();const wanted=new URLSearchParams(location.search).get('model');if(report.models.some(m=>m.model===wanted))$('#trace-model').value=wanted;
 $('#trace-model').addEventListener('change',()=>{history.replaceState(null,'','?model='+encodeURIComponent($('#trace-model').value));loadModel().catch(fail);});$('#trace-action').addEventListener('change',render);$('#errors-only').addEventListener('change',render);$('#trace-query').addEventListener('input',render);await loadModel();}
function fail(err){$('#trace-summary').textContent='轨迹加载失败：'+err.message;$('#trace-summary').classList.add('warn');}
boot().catch(fail);
