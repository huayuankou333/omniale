(() => {
 'use strict';
 const $=s=>document.querySelector(s),names={initial:'初始证据',model:'模型请求',tool:'取证工具',submission:'最终提交'};
 let current=null,loadId=0;
 const q=new URLSearchParams(location.search),requested=q.get('model');if([...$('#model').options].some(o=>o.value===requested))$('#model').value=requested;
 const element=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e};
 const pre=(parent,title,value)=>{if(value===undefined||value===null)return;parent.append(element('h3',title),element('pre',typeof value==='string'?value:JSON.stringify(value,null,2)))};
 const a=(href,text)=>{const e=element('a',text);e.href=href;return e};
 function render(){
  if(!current)return;
  const kind=$('#kind').value,query=$('#query').value.trim().toLowerCase(),events=current.events.filter(e=>(kind==='all'||e.kind===kind)&&(!query||JSON.stringify(e).toLowerCase().includes(query)));
  $('#trace-events').replaceChildren();
  for(const e of events){
   const d=element('details',undefined,'trace-event');d.dataset.eventIndex=e.index;
   const s=element('summary');s.append(element('span','#'+String(e.index).padStart(2,'0'),'event-number'),element('strong',names[e.kind]+' · '+(e.tool??e.phase??'')),element('span',e.request?'请求 '+e.request:'模型调用前','muted'));
   if(e.result?.error)s.append(element('span','工具拒绝','status-error'));
   d.append(s);let loaded=false;
   d.addEventListener('toggle',()=>{if(!d.open||loaded)return;loaded=true;
    if(e.usage)pre(d,'请求使用量（记录值）',{input_tokens:e.usage.input_tokens,output_tokens:e.usage.output_tokens,reasoning_tokens:e.usage.output_tokens_details?.reasoning_tokens});
    if(e.transport)pre(d,'请求记录时间 / 传输',e.transport);
    if(e.text)pre(d,'模型可见输出',e.text);
    if(e.kind==='model'&&!e.text)d.append(element('p','这一响应没有额外的可见说明文字；工具调用见下方。','muted'));
    pre(d,'调用参数',e.arguments);pre(d,'请求中的工具调用',e.calls);pre(d,'工具返回',e.result);
    if(e.frames?.length){const g=element('div',undefined,'trace-frames');for(const f of e.frames){const fig=element('figure'),img=element('img');img.src=f.url;img.loading='lazy';img.alt=f.time+'秒实际取证帧';const l=a(f.url,'');l.append(img);fig.append(l,element('figcaption',f.time+'秒'+(f.slots?' · 可见槽位 '+f.slots.join(','):'')));g.append(fig)}d.append(g)}
    if(e.kind==='submission'){d.append(element('p','首次提交立即封存，后续没有受测模型返修。'),a(current.product,'打开部署成品'),' · ',a(current.manifest,'原始提交文件哈希'))}
   });$('#trace-events').append(d);
  }
  if(!events.length)$('#trace-events').append(element('p','没有符合条件的记录。','trace-events-empty'));
  const st=current.status;$('#trace-summary').textContent=current.model+' · '+st.model_requests+'次模型请求 · '+st.evidence_tool_calls+'次取证调用 · '+st.reference_frames+'帧 · '+st.submissions+'次交付 · 显示'+events.length+'/'+current.events.length+'条记录';
 }
 async function load(){const mine=++loadId;$('#trace-events').replaceChildren();$('#trace-summary').textContent='读取轨迹…';try{const r=await fetch('data/'+$('#model').value+'-trace.json');if(!r.ok)throw Error('HTTP '+r.status);const value=await r.json();if(mine!==loadId)return;current=value;const u=new URL(location.href);u.searchParams.set('model',current.model);history.replaceState(null,'',u);$('#raw-links').replaceChildren(a(current.raw_trace,'原始trace.json'),a(current.evaluation,'独立评分'),a(current.manifest,'封存清单'),...current.responses.map((r,i)=>a(r,'API原始响应 '+(i+1))));render()}catch(e){$('#trace-summary').textContent='轨迹读取失败：'+e.message}}
 $('#model').addEventListener('change',load);$('#kind').addEventListener('change',render);$('#query').addEventListener('input',render);load();
})();
