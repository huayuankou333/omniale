'use strict';
const comparison=document.getElementById('comparison-player');
const reference=document.getElementById('reference-player');
const film=document.getElementById('final-player');
const players=[comparison,reference,film];
const tracks={guide:{src:'v4-short/preview/Guide.wav',label:'原始导唱'},sol:{src:'v4-short/preview/Converted-preview.wav',label:'Sol 转换干声'}};
let version=0;
for(const player of players)player.addEventListener('play',()=>{for(const other of players)if(other!==player)other.pause()});
for(const button of document.querySelectorAll('[data-track]'))button.addEventListener('click',()=>{
  if(button.getAttribute('aria-pressed')==='true')return;
  const track=tracks[button.dataset.track],position=comparison.currentTime||0,wasPlaying=!comparison.paused,token=++version;
  comparison.pause();
  comparison.onloadedmetadata=()=>{
    if(token!==version)return;
    comparison.currentTime=Math.min(position,Math.max(0,comparison.duration-.05));
    if(wasPlaying)comparison.play().catch(()=>{});
  };
  comparison.src=track.src;
  for(const item of document.querySelectorAll('[data-track]'))item.setAttribute('aria-pressed',String(item===button));
  document.getElementById('playing-label').textContent='正在对比：'+track.label;
});
