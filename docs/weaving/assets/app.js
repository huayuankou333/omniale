'use strict';
const $=s=>document.querySelector(s);
const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const clock=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const traceCache=new Map();
async function getTrace(model){if(!traceCache.has(model)){const response=await fetch(`records/${model}/trajectory.json`);if(!response.ok)throw Error(`HTTP ${response.status}`);traceCache.set(model,await response.json());}return traceCache.get(model);}
async function renderTrace(){
  const model=$('#trace-model').value,filter=$('#trace-filter').value,query=$('#trace-search').value.trim().toLowerCase();
  $('#trace-download').href=`records/${model}/trajectory.json`;$('#trace-initial').href=`records/${model}/initial_prompt.txt`;
  const root=$('#trace-list');root.setAttribute('aria-busy','true');
  try{
    const trace=await getTrace(model);if($('#trace-model').value!==model)return;
    const events=trace.events.filter(e=>{
      if(filter==='errors'&&e.status!=='error'&&e.kind!=='api_retry')return false;
      if(filter==='images'&&!e.images?.length)return false;
      if(!['all','errors','images'].includes(filter)&&e.action!==filter)return false;
      return !query||JSON.stringify(e).toLowerCase().includes(query);
    });
    root.replaceChildren();$('#trace-summary').textContent=`${model} · ${trace.counts.tool_calls} 次工具 · ${trace.counts.api_retries} 次API重试 · 图像观察 ${trace.counts.delivered_images} 幅（留存 ${trace.counts.preserved_images}，中间图缺失 ${trace.counts.missing_images}） · 当前显示 ${events.length} 条事件`;
    for(const event of events){
      const d=make('details',undefined,'trace-event');const summary=make('summary');
      if(event.kind==='api_retry'){
        summary.append(make('span',`请求 ${event.request}`,'event-number'),make('span','API 重试','event-action event-error'),make('span','网关限流；按原协议自动重试','event-reason'));
        d.append(summary,make('pre',event.error));root.append(d);continue;
      }
      summary.append(make('span',`#${String(event.tool_call).padStart(2,'0')} · ${clock(event.elapsed_seconds)}`,'event-number'),make('span',event.action,'event-action'+(event.status==='error'?' event-error':'')),make('span',event.reason,'event-reason'),make('span',event.status==='error'?'工具错误':`${event.images.length?event.images.length+' 幅图像':'完成'}`,event.status==='error'?'event-error':'subtle'));
      d.append(summary);d.dataset.tool=event.tool_call;
      d.addEventListener('toggle',()=>{
        if(!d.open||d.dataset.loaded)return;d.dataset.loaded='true';
        d.append(make('p',`北京时间 ${new Date(event.at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})} · 逻辑请求 ${event.request}`,'subtle'));
        if(event.images.length){
          const grid=make('div',undefined,'trace-images');
          event.images.forEach((item,index)=>{
            if(!item.available){const notice=make('div',undefined,'callout warn');notice.append(make('strong',`观察 ${index+1}：历史图片缺失`),make('p',`${item.original_file_name} 被后续版本覆盖，日志未保存图像二进制；保留该调用记录，不显示后来图像。`));grid.append(notice);return;}
            const figure=make('figure');const a=make('a');a.href=`records/${model}/${item.path}`;a.target='_blank';a.rel='noopener';
            const img=make('img');img.src=`records/${model}/${item.thumbnail}`;img.alt=`工具${event.tool_call}当时实际观察图${index+1}`;img.loading='lazy';a.append(img);
            figure.append(a,make('figcaption',`观察 ${index+1} · ${item.width}×${item.height} · 点击原快照`));grid.append(figure);
          });d.append(grid);
        }
        d.append(make('h4','实际调用参数'));
        const params={...event.params};const code=params.code;delete params.code;
        if(Object.keys(params).length)d.append(make('pre',JSON.stringify(params,null,2)));
        if(code!==undefined)d.append(make('pre',code));
        d.append(make('h4','实际工具结果'),make('pre',JSON.stringify(event.result,null,2)));
      });root.append(d);
    }
    if(!events.length)root.append(make('p','没有匹配的事件。','subtle'));
  }catch(error){$('#trace-summary').textContent=`轨迹加载失败：${error.message}。可使用上方JSON下载链接。`;}
  finally{root.removeAttribute('aria-busy');}
}
if($('#trace-model')){
  ['#trace-model','#trace-filter'].forEach(s=>$(s).addEventListener('change',renderTrace));
  let timer;$('#trace-search').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(renderTrace,160);});
  const fromHash=()=>{const match=location.hash.match(/^#trajectory-(gpt-6(?:\.1)?-(?:luna|sol))$/);if(match){$('#trace-model').value=match[1];$('#trajectory').scrollIntoView();renderTrace();}};
  window.addEventListener('hashchange',fromHash);fromHash();renderTrace();
}
if($('.reader')){
  const reader=$('.reader'),total=Number(reader.dataset.pages),record=reader.dataset.record;let current=1;
  function show(n,hash=true){current=Math.max(1,Math.min(total,n));$('#pdf-page').src=`${record}pages/page-${String(current).padStart(2,'0')}.jpg`;$('#pdf-page').alt=`${reader.dataset.model} PDF 第${current}页`;$('#page-select').value=current;$('#page-caption').textContent=`第 ${current} 页 / ${total} 页`;$('#prev-page').disabled=current===1;$('#next-page').disabled=current===total;if(hash)history.replaceState(null,'',`#page=${current}`);}
  $('#prev-page').addEventListener('click',()=>show(current-1));$('#next-page').addEventListener('click',()=>show(current+1));$('#page-select').addEventListener('change',e=>show(Number(e.target.value)));
  $('#zoom-page').addEventListener('click',()=>{const z=$('#page-canvas').classList.toggle('zoom');$('#zoom-page').textContent=z?'适合页面':'放大细节';$('#zoom-page').setAttribute('aria-pressed',String(z));});
  document.querySelectorAll('[data-page]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();show(Number(a.dataset.page));reader.scrollIntoView({behavior:'smooth'});}));
  const hashPage=()=>{const m=location.hash.match(/^#page=(\d+)$/);show(m?Number(m[1]):1,false);};window.addEventListener('hashchange',hashPage);hashPage();
  document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;if(e.key==='ArrowRight')show(current+1);if(e.key==='ArrowLeft')show(current-1);});
}
