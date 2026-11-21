(()=>{'use strict';
 const data=JSON.parse(document.getElementById('case-data').textContent),p=document.getElementById('film-player'),status=document.getElementById('play-status'),note=document.getElementById('preview-note');
 let version='long',mode='sol',generation=0;
 const names={sol:'GPT-6.1 Sol · 原始成片预览',deepseek:'dpsk4.1flash · 中间音乐诊断预览',original:'原片混合音轨 · 随画面重剪',input:'无声题目画面'};
 function change(nextVersion,nextMode){
  const keep=nextVersion===version?p.currentTime:0,playing=!p.paused;version=nextVersion;mode=nextMode;const current=++generation;
  p.pause();p.src=`v5-media/${mode}-${version}.mp4`;p.poster=`v5-media/${version}-poster.jpg`;
  p.onloadedmetadata=()=>{if(generation!==current)return;p.currentTime=Math.min(Number.isFinite(keep)?keep:0,Math.max(0,p.duration-.1));if(playing)p.play().catch(()=>{});};p.load();
  document.querySelectorAll('[data-version]').forEach(b=>{const a=b.dataset.version===version;b.classList.toggle('active',a);b.setAttribute('aria-pressed',String(a))});
  document.querySelectorAll('[data-mode]').forEach(b=>{const a=b.dataset.mode===mode;b.classList.toggle('active',a);b.setAttribute('aria-pressed',String(a))});
  status.textContent=`${version==='long'?'主版':'短版'} · ${data.versions[version]}秒 · ${names[mode]}`;
  note.textContent=mode==='deepseek'?'未完成的提交。主办方仅将原样中间WAV与锁画封装，未修音、未补交付，不代表模型完成了成片。':mode==='original'?'原片混音包含对白、角色发声和音效；这里按新画面重新取段，仅供观看对照。未提供给参试模型及本次评审，也不作为配乐答案。':mode==='input'?'模型收到的锁定画面没有音轨。音乐素材另以160段匿名WAV提供，没有原片混合声音和事件标签。':'服务器生成的压缩预览；原始MP4、WAV和工程保存在原始交付包中。';
 }
 document.querySelectorAll('[data-version]').forEach(b=>b.addEventListener('click',()=>change(b.dataset.version,mode)));
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>change(version,b.dataset.mode)));
 p.addEventListener('error',()=>{status.textContent='视频载入失败，请重新选择试听来源或刷新页面。'});
})();
