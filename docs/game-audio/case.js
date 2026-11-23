'use strict';
const data=JSON.parse(document.getElementById('case-data').textContent);
const player=document.getElementById('game-player');
let scene='objective',mode='sol',generation=0;
const normalize=document.getElementById('monitor-match');
function volume(){player.volume=normalize.checked&&mode==='sol'?Math.pow(10,data.monitoring_gain_db/20):1;}
function status(){
 const item=data.scenes[scene];
 document.getElementById('play-status').textContent=`${item.label} · ${item.duration}秒 · ${mode==='sol'?'GPT-6.2 Sol实际引擎输出':'组织者参考实现'} · ${normalize.checked?'统一监听增益':'原始增益'}`;
 document.getElementById('scene-description').textContent=item.description;
 document.querySelectorAll('[data-scene]').forEach(b=>{const active=b.dataset.scene===scene;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 document.querySelectorAll('[data-mode]').forEach(b=>{const active=b.dataset.mode===mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
}
function setSource(nextScene,nextMode){
 const time=nextScene===scene?player.currentTime:0,playing=!player.paused;const id=++generation;
 player.pause();scene=nextScene;mode=nextMode;player.poster=`media/ref-${scene}.jpg`;
 player.src=`media/${mode}-${scene}.mp4`;volume();status();
 player.addEventListener('loadedmetadata',()=>{if(id!==generation)return;player.currentTime=Math.min(time,Math.max(0,player.duration-.05));if(playing)player.play().catch(()=>{});},{once:true});
 player.load();
}
document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>setSource(b.dataset.scene,mode)));
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setSource(scene,b.dataset.mode)));
normalize.addEventListener('change',()=>{volume();status();});
const inputDetails=document.getElementById('input-recordings'),inputPlayer=document.getElementById('input-player'),inputSelect=document.getElementById('input-select');
function loadInput(){inputPlayer.pause();inputPlayer.src=`media/input-${inputSelect.value}.mp4`;inputPlayer.load();document.getElementById('input-status').textContent=`原始示范 ${inputSelect.value} / 4 · 60秒 · 压缩网页预览`;}
inputDetails.addEventListener('toggle',()=>{if(inputDetails.open){if(!inputPlayer.getAttribute('src'))loadInput();player.pause();}else inputPlayer.pause();});
inputSelect.addEventListener('change',loadInput);
player.addEventListener('play',()=>inputPlayer.pause());inputPlayer.addEventListener('play',()=>player.pause());
player.addEventListener('error',()=>{document.getElementById('play-status').textContent='预览暂未加载，请刷新或下载完整交付。';});
volume();status();
