'use strict';
const $=s=>document.querySelector(s);
const fmt=x=>Number(x).toFixed(2).replace(/\.00$/,'');
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
function seek(model,time){const v=$('#video-'+model);if(!v)return;v.currentTime=Number(time);v.scrollIntoView({behavior:'smooth',block:'center'});v.focus({preventScroll:true});}
document.addEventListener('click',e=>{const b=e.target.closest('[data-model][data-time]');if(b)seek(b.dataset.model,b.dataset.time);});
$('#camera').addEventListener('change',e=>{const v=$('#source-video');v.pause();v.src='media/input-'+e.target.value+'.mp4';v.poster='media/input-'+e.target.value+'.jpg';v.load();});
async function load(){
 const response=await fetch(document.documentElement.dataset.report||'data/report.json');if(!response.ok)throw new Error('report '+response.status);const report=await response.json();
 const rubricResponse=await fetch(report.rubric_url||'files/rubric.v2.1.json');if(!rubricResponse.ok)throw new Error('rubric '+rubricResponse.status);const rubric=await rubricResponse.json();
 function render(){const target=$('#rubric-table');target.replaceChildren();const filter=$('#rubric-filter').value;
  const key=el('div',undefined,'score-key');report.models.forEach(m=>key.append(el('span',({'luna':'Luna','sol':'Sol'}[m.id]||m.model)+' / 满分')));target.append(key);
  report.models[0].items.forEach(l=>{if(filter!=='all'&&l.category!==filter)return;const rows=report.models.map(m=>m.items.find(r=>r.id===l.id));
   const d=el('details',undefined,'criterion');d.dataset.id=l.id;const s=el('summary');
   s.append(el('span',l.id,'criterion-id'),el('span',l.title,'criterion-name'));
   const nums=el('span',undefined,'criterion-points');rows.forEach((row,j)=>{const number=el('span',row?fmt(row.points)+' / '+fmt(row.weight):'待复核');number.title=report.models[j].model;nums.append(number);});s.append(nums);
   d.append(s);let built=false;d.addEventListener('toggle',()=>{if(!d.open||built)return;built=true;
    const definition=rubric.items.find(r=>r.id===l.id),guide=el('div',undefined,'criterion-definition');
    if(definition){
     guide.append(el('h4','判据与版本映射'));
     if(definition.source_ids)guide.append(el('p','对应 v2.1：'+definition.source_ids.join('、')+'。以下条目ID均属当前v3，旧ID仅用于追溯。','caption'));
     if(definition.scope)guide.append(el('p',definition.scope));
     (definition.necessary_links||[]).forEach(link=>{guide.append(el('p','必要环节（v2.1 '+link.source_id+' · '+link.source_title+'）'));const list=el('ul');link.assertions.forEach(a=>list.append(el('li',a)));guide.append(list);});
     (definition.components||[]).forEach(c=>guide.append(el('p',c.title+'：'+fmt(c.weight)+'分（v2.1 '+c.source_id+'）')));
     if(typeof definition.scoring==='object'){['full','partial','zero','method'].forEach(k=>{if(definition.scoring[k])guide.append(el('p',definition.scoring[k]));});}
     else if(definition.scoring)guide.append(el('p',definition.scoring));
     if(definition.boundary)guide.append(el('p',definition.boundary,'scoring-boundary'));
     if(!definition.source_ids)(definition.assertions||[]).forEach(a=>guide.append(el('p',a)));
     d.append(guide);
    }
    const body=el('div',undefined,'criterion-body');
    rows.forEach((row,j)=>{const c=el('div');c.append(el('h4',report.models[j].model),el('p',row?.reason||'尚待证据复核。'));if(!row){body.append(c);return;}
     if(row.adjudication&&!row.components){c.append(el('p','用户明确裁决：本项记零；权重保留。此前观察在原始评分JSON中留存。','adjudication'));}
     if(row.source_judgments&&row.id!=='O08'){const audit=el('details',undefined,'source-judgments');audit.append(el('summary','查看 v2.1 原始判断（旧版ID）'));row.source_judgments.forEach(old=>audit.append(el('p',old.id+' '+old.title+'：'+fmt(old.points)+' / '+fmt(old.weight)+'。'+old.reason)));c.append(audit);}
     (row.output_ranges_seconds||[]).slice(0,6).forEach(([a,b])=>{const btn=el('button',`${a}–${b}秒`,'seek');btn.type='button';btn.dataset.model=report.models[j].id;btn.dataset.time=a;c.append(btn);});body.append(c);});d.append(body);});target.append(d);
  });}
 $('#rubric-filter').addEventListener('change',render);render();
}
load().catch(err=>{$('#rubric-table').replaceChildren(el('p','评分文件加载失败，请刷新或下载JSON。'+err.message,'load-error'));});

// Preserve evidence links from the detailed analysis, including a fresh page load.
const evidenceParams=new URLSearchParams(location.search);
if(document.getElementById('video-'+evidenceParams.get('model'))&&evidenceParams.has('time')){
 const target=document.getElementById('video-'+evidenceParams.get('model')),time=Number(evidenceParams.get('time'));
 if(Number.isFinite(time)&&time>=0){const apply=()=>{target.currentTime=Math.min(time,Math.max(0,target.duration-.05));};if(target.readyState>=1)apply();else target.addEventListener('loadedmetadata',apply,{once:true});}
}
