'use strict';
const data=JSON.parse(document.getElementById('case-data').textContent),order=['sol','deepseek','terra'];
const names={sol:'GPT-6.1 Sol',deepseek:'DeepSeek 4.1 Flash',terra:'GPT-6.1 Terra'},shortNames={sol:'6.1 Sol',deepseek:'DS 4.1 Flash',terra:'6.1 Terra',guide:'导引 · 原始表演'};
const rubricNames={target_identity:'目标身份',naturalness:'自然度',artifact_freedom:'伪影控制',content_preservation:'内容与可懂度',worst_chunk_target_identity:'最差片段身份',spectral_target_progress:'相对谱形改进',performance_preservation:'表演保持'};
const $=s=>document.querySelector(s),fixed=(v,n=2)=>Number.isFinite(v)?v.toFixed(n):'—';
const elt=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x};
const link=(label,path)=>{const a=elt('a',label);a.href=data.downloadUrls?.[path]||path;return a},sizes=Object.fromEntries((data.files||[]).map(f=>[f.path,f.bytes]));
const formatBytes=v=>v===undefined?'下载':v>1048576?`${(v/1048576).toFixed(1)} MB`:`${Math.max(1,Math.round(v/1024))} KB`;
for(const slug of order){
 const m=data.models[slug],e=m.evaluation,card=elt('article',undefined,'model-card');card.style.setProperty('--model-color',`var(--${slug})`);
 const heading=elt('div',undefined,'model-name');heading.append(elt('h3',names[slug]),elt('span',slug.toUpperCase(),'model-initial'));card.append(heading,elt('p',m.condition,'condition'));
 const score=elt('div',undefined,'score-line'),number=elt('div',e?fixed(e.score):'—','big-score');number.append(elt('small','/100'));score.append(number,elt('span',e?(e.accepted?'验收通过':'未达验收线'):'运行中',`result-label ${e?.accepted?'pass':''}`));card.append(score);
 const track=elt('div',undefined,'score-track'),bar=elt('span');bar.style.width=`${e?.score||0}%`;track.append(bar);card.append(track);
 const details=elt('div',undefined,'model-details');for(const [label,value]of[['工程门槛',e?(e.engineering_gate_pass?'通过 · 0 分':'未通过 · 0 分'):'待复核'],['模式级质量上限',e?`${e.overall_quality_cap} /100`:'—']]){const d=elt('div');d.append(elt('span',label),elt('b',value));details.append(d)}card.append(details);
 const links=elt('div',undefined,'model-links');links.append(link('评分明细 ↗',`${slug}/evaluation.json`),link('完整交付 ↓',`${slug}/deliverables.zip`));card.append(links);$('#model-cards').append(card);
 const tr=elt('tr');for(const value of[names[slug],fixed(e?.mode_results.speech.mean_query_score),fixed(e?.mode_results.singing.mean_query_score),fixed(m.state?.active_seconds/60,1),m.state?.successful_calls??'—',m.state?.output_tokens?.toLocaleString('en-US')??'—',m.fresh_pass===undefined?'—':`${m.fresh_pass} /15`])tr.append(elt('td',String(value)));$('#run-table tbody').append(tr);
 const fileCard=elt('article',undefined,'file-card');fileCard.append(elt('h3',names[slug]));for(const [label,path]of[['完整交付 · 引擎 / 工程 / 音频',`${slug}/deliverables.zip`],['逐查询评分 JSON',`${slug}/evaluation.json`],['Qwen 提示与响应',`${slug}/judge-evidence.zip`],['工程门槛报告',`${slug}/engineering-gate.json`],['运行协议与预算',`${slug}/run-protocol.json`]]){const a=link(label,path);a.append(elt('span',formatBytes(sizes[path])));fileCard.append(a)}$('#file-grid').append(fileCard);
 const opt=elt('option',names[slug]);opt.value=slug;$('#detail-model').append(opt);
}
for(const [key,weight]of Object.entries(data.weights)){const tr=elt('tr');tr.append(elt('td',rubricNames[key]),elt('td',String(weight)));for(const slug of order){const p=data.models[slug].evaluation?.rubrics_before_caps[key],td=elt('td',fixed(p));if(Number.isFinite(p)){const track=elt('span',undefined,'rubric-bar'),bar=elt('i');bar.style.width=`${p/weight*100}%`;track.append(bar);td.append(track)}tr.append(td)}$('#rubric-table tbody').append(tr)}
const player=$('#comparison-player'),reference=$('#reference-player');let active='guide',currentSample=data.samples.find(s=>s.id==='sing_unseen_01')||data.samples[0],loadVersion=0;
for(const sample of data.samples){const option=elt('option',`${sample.mode==='speech'?'朗读':'歌唱'} / ${sample.id}`);option.value=sample.id;$('#sample-select').append(option)}$('#sample-select').value=currentSample.id;
const pathFor=slug=>slug==='guide'?currentSample.guide:currentSample.outputs[slug];
function updateInsight(){
 const box=$('#query-insight');box.replaceChildren();$('#playing-label').textContent=shortNames[active];
 if(active==='guide'){const v=elt('div');v.append(elt('span','NO-CHANGE 基线'),elt('b','0 /100'));box.append(v,elt('div','真实人声，但目标身份未转换。原样返回整段查询计 0 分。','insight-note'));return}
 const q=data.models[active].evaluation?.queries[currentSample.id];if(!q){box.append(elt('div','该运行尚无可用复测评分。'));return}
 for(const [label,value]of[['该查询分',fixed(q.score)],['身份进度',fixed(q.identity.progress,3)],['自然度 /4',fixed(q.judge_ratings.naturalness)],['质量上限',String(q.cap)]]){const v=elt('div');v.append(elt('span',label),elt('b',value));box.append(v)}
 box.append(elt('div',q.no_change.no_change?'命中 no-change：该查询 0 分。':q.cap<100?'身份、自然度或内容触发质量上限。':'该查询未触发核心质量上限。','insight-note'));
}
function switchAudio(slug,preserve=true){
 const wasPlaying=!player.paused,position=preserve?(player.currentTime||0):0,version=++loadVersion;player.pause();active=slug;const path=pathFor(slug);$('#clip-status').textContent='';
 player.onloadedmetadata=null;if(path){player.src=path;player.onloadedmetadata=()=>{if(version!==loadVersion)return;player.currentTime=Math.min(position,Math.max(0,player.duration-.05));if(wasPlaying&&preserve)player.play().catch(()=>{})}}else{player.removeAttribute('src');player.load();$('#clip-status').textContent='该输出不可用。'}
 for(const button of document.querySelectorAll('#audio-switcher button'))button.setAttribute('aria-pressed',String(button.dataset.slug===slug));updateInsight();
}
function updateSample(){
 reference.pause();player.pause();$('#reference-heading').textContent=`目标表演者 · ${currentSample.mode==='speech'?'朗读':'歌唱'}`;reference.src=`media/target-${currentSample.mode}.mp3`;$('#sample-range').textContent=`${fixed(currentSample.start_seconds,1)}–${fixed(currentSample.start_seconds+currentSample.seconds,1)} s`;$('#preview-duration').textContent=String(currentSample.seconds);
 const svg=$('#waveform');svg.replaceChildren();currentSample.waveform.forEach((value,i)=>{const r=document.createElementNS('http://www.w3.org/2000/svg','rect'),h=Math.max(1,value*80);for(const[k,v]of Object.entries({x:i*3,y:46-h/2,width:1.6,height:h,rx:.8,fill:'currentColor'}))r.setAttribute(k,String(v));svg.append(r)});
 $('#audio-switcher').replaceChildren();for(const slug of['guide',...order]){const b=elt('button',shortNames[slug]);b.type='button';b.dataset.slug=slug;b.disabled=!pathFor(slug);b.addEventListener('click',()=>switchAudio(slug));$('#audio-switcher').append(b)}if(!pathFor(active))active='guide';switchAudio(active,false);
}
$('#sample-select').addEventListener('change',event=>{currentSample=data.samples.find(s=>s.id===event.target.value);updateSample()});reference.addEventListener('play',()=>player.pause());player.addEventListener('play',()=>reference.pause());player.addEventListener('error',()=>{$('#clip-status').textContent='音频加载失败，请检查文件或本地服务。'});
function renderQueryTable(){const model=data.models[$('#detail-model').value],mode=$('#detail-mode').value,body=$('#query-table tbody');body.replaceChildren();if(!model.evaluation)return;for(const[id,q]of Object.entries(model.evaluation.queries)){if(mode!=='all'&&q.mode!==mode)continue;const tr=elt('tr');for(const value of[id,fixed(q.identity.progress,3),fixed(q.judge_ratings.naturalness),fixed(q.judge_ratings.artifact_freedom),fixed(q.judge_ratings.content_preservation),fixed(q.raw_score),q.no_change.no_change?'NO-CHANGE /0':String(q.cap),fixed(q.score)])tr.append(elt('td',String(value)));tr.lastChild.className='score-cell';body.append(tr)}}
$('#detail-model').addEventListener('change',renderQueryTable);$('#detail-mode').addEventListener('change',renderQueryTable);updateSample();renderQueryTable();
if(data.draft)document.body.prepend(elt('div','草稿预览：新增模型仍在运行，空白处不是评分结果。','draft-banner'));
else{
 const findings={sol:'身份转换与自然度仍有差距；逐查询上限后为 57.67，未被整体直接改为 59。',deepseek:'身份特征高度接近目标，但辅助评审显示强机械感与伪影，触发 39 分上限。总渲染峰值另未通过工程电平门槛。',terra:'自然度较高；朗读与歌唱身份进度均低于 0.5，触发 59 分上限。'};
 document.querySelectorAll('.model-card').forEach((card,i)=>{const slug=order[i],e=data.models[slug].evaluation;const rows=card.querySelector('.model-details');for(const[label,value]of[['上限前贡献合计',fixed(Object.values(e.rubrics_before_caps).reduce((a,b)=>a+b,0))],['逐查询上限后均分',fixed(e.mean_query_score_before_mode_cap)]]){const row=elt('div');row.append(elt('span',label),elt('b',value));rows.append(row)}card.append(elt('p',findings[slug],'model-finding'))});
}
