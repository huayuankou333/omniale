'use strict';
(async()=>{
 const host=document.getElementById('trace-browser');if(!host)return;
 const models=await fetch('data/results.json').then(r=>r.json());
 const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 const controls=make('div','trace-controls'),ml=make('label','','模型'),model=make('select'),al=make('label','','工具类型'),action=make('select'),ql=make('label','search-label','搜索调用参数、说明与返回'),query=make('input');
 model.id='trace-model';model.setAttribute('aria-label','选择轨迹模型');action.setAttribute('aria-label','筛选工具类型');query.placeholder='例如 Q16、render_pdf、频谱';query.type='search';
 for(const m of models){const o=make('option','',m.label);o.value=m.id;model.append(o)}
 const fromUrl=new URLSearchParams(location.search).get('model');if(models.some(m=>m.id===fromUrl))model.value=fromUrl;
 ml.append(model);al.append(action);ql.append(query);controls.append(ml,al,ql);
 const metrics=make('div','trace-metrics'),status=make('p','subtle'),milestones=make('div','milestones'),list=make('div',host.dataset.full?'trace-list full':'trace-list');status.setAttribute('aria-live','polite');host.append(controls,metrics,milestones,status,list);
 let events=[],current=null,limit=host.dataset.full?10000:40;
 function pre(value){return make('pre','',typeof value==='string'?value:JSON.stringify(value,null,2))}
 function render(){
  const search=query.value.toLowerCase().trim(),filtered=events.filter(e=>(!action.value||e.action===action.value)&&(!search||JSON.stringify(e).toLowerCase().includes(search)));
  status.textContent=`${current.label} · 显示 ${Math.min(filtered.length,limit)} / ${filtered.length} 条匹配记录（总计 ${events.length} 条）`;list.replaceChildren();
  for(const e of filtered.slice(0,limit)){
   const detail=make('details','card trace-event'),summary=make('summary'),num=make('span','event-number',e.tool_call?`#${e.tool_call} · 请求 ${e.request}`:`请求 ${e.request??'—'}`),tag=make('span','event-action'+(e.error?' event-error':''),e.action),reason=make('span','event-reason',e.reason||'接口与传输记录');summary.append(num,tag,reason);detail.append(summary);
   detail.addEventListener('toggle',()=>{if(!detail.open||detail.dataset.loaded)return;detail.dataset.loaded='true';
    if(e.at)detail.append(make('p','subtle',e.at));
    if(e.tool_arguments!==undefined){detail.append(make('p','subtle',`params_json 原始类型：${e.params_json_type}；本工具要求 string。`));const raw=make('details'),s=make('summary','','查看原始工具参数');raw.append(s,pre(e.tool_arguments));detail.append(raw)}
    if(e.params!==undefined)detail.append(make('h4','','调用参数'),pre(e.params));
    if(e.result!==undefined)detail.append(make('h4','','工具返回'),pre(e.result));
    if(e.images?.length){const gallery=make('div','trace-images');for(const img of e.images){const figure=make('figure'),link=make('a'),image=make('img');link.href=img.src;link.target='_blank';link.rel='noopener';image.src=img.src;image.alt=`工具 ${e.tool_call} 返回图像：${img.label}`;image.loading='lazy';link.append(image);figure.append(link,make('figcaption','',img.label));gallery.append(figure)}detail.append(gallery)}
   });list.append(detail);
  }
  if(filtered.length>limit){const more=make('button','','继续显示更多记录');more.onclick=()=>{limit+=40;render()};list.append(more)}
 }
 async function load(){current=models.find(m=>m.id===model.value);host.setAttribute('aria-busy','true');events=await fetch(current.trace_url).then(r=>r.json());
  action.replaceChildren();for(const a of ['',...new Set(events.map(e=>e.action))]){const o=make('option','',a||'全部工具');o.value=a;action.append(o)}
  metrics.textContent=`${current.tool_calls} 次工具调用　·　${current.requests} 次模型请求　·　${current.minutes} 分钟　·　${current.tool_errors} 次工具/代码报错`;
  milestones.replaceChildren();for(const [label,predicate] of [['首次读题',e=>e.action==='read_text'],['首次谱面观察',e=>e.action==='render_pdf'],['首次信号分析',e=>e.action==='analyze_audio'],['保存网页',e=>e.action==='write_text'&&JSON.stringify(e.params).includes('index.html')],['结束提交',e=>e.action==='finish']]){const e=events.find(predicate);if(e)milestones.append(make('span','milestone',`${label} · #${e.tool_call}`))}
  host.setAttribute('aria-busy','false');render();
 }
 model.onchange=load;action.onchange=render;query.oninput=render;await load();
})().catch(e=>{const h=document.getElementById('trace-browser');if(h)h.textContent='轨迹加载失败，请刷新页面。'+e.message});
