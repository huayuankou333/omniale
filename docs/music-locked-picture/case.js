'use strict';
(() => {
  const data = JSON.parse(document.getElementById('case-data').textContent);
  const player = document.getElementById('film-player');
  const names = {final:'SOL / ', input:'INPUT / ', baseline:'BASELINE / '};
  const descriptions = {final:'Sol 制作的音乐', input:'无音轨 · 只有画面', baseline:'Childhood 连续直铺 · 仅响度规范化'};
  let version = 'long', mode = 'final', revision = 0;
  const versions = [...document.querySelectorAll('[data-version]')];
  const modes = [...document.querySelectorAll('[data-mode]')];
  const allMedia = [...document.querySelectorAll('video,audio')];
  allMedia.forEach(media => media.addEventListener('play', () => allMedia.forEach(other => { if(other !== media) other.pause(); })));
  function labels() {
    const item = data.versions[version];
    versions.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.version===version)));
    modes.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
    const caption = item.label + ({final:'成片',input:'无声锁画',baseline:'直铺对照'}[mode]);
    document.getElementById('film-label').textContent=names[mode]+caption;
    document.getElementById('film-spec').textContent=item.seconds+' s · 1280 × 546 · 24 fps';
    document.getElementById('version-description').textContent=item.description;
    document.getElementById('audio-status').textContent=descriptions[mode];
    player.setAttribute('aria-label',item.seconds+'秒'+caption);
    document.getElementById('film-download').href=item.final;
    document.getElementById('music-download').href=item.wav;
  }
  async function select(nextVersion,nextMode,position,autoPlay=false) {
    const current=++revision;
    player.pause(); version=nextVersion;mode=nextMode;
    const item=data.versions[version];labels();
    player.preload='metadata';player.poster=item.poster;
    const ready=new Promise(resolve=>{
      const controller=new AbortController();
      const timer=setTimeout(()=>{controller.abort();resolve(false)},20000);
      const finish=success=>{clearTimeout(timer);controller.abort();resolve(success)};
      player.addEventListener('loadedmetadata',()=>finish(true),{once:true,signal:controller.signal});
      player.addEventListener('error',()=>finish(false),{once:true,signal:controller.signal});
    });
    player.src=item[mode];player.load();
    try{
      if(!await ready)throw Error('media load');
      if(current!==revision)return;
      player.currentTime=Math.min(Math.max(0,position),Math.max(0,player.duration-.05));
      if(autoPlay)await player.play();
    }catch(error){if(current===revision)document.getElementById('audio-status').textContent='请重试播放器，或下载原文件播放';}
  }
  versions.forEach(b=>b.addEventListener('click',()=>{if(b.dataset.version!==version)select(b.dataset.version,mode,0)}));
  modes.forEach(b=>b.addEventListener('click',()=>{if(b.dataset.mode!==mode)select(version,b.dataset.mode,player.currentTime||0,!player.paused)}));
  document.querySelectorAll('[data-seek]').forEach(b=>b.addEventListener('click',()=>{
    const [v,t]=b.dataset.seek.split(':');select(v,'final',Number(t),true);
    document.getElementById('watch').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }));
  labels();
})();
