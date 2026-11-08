(function(){
  var globalRate=1;
  function fmt(t){ if(!isFinite(t)) return '0:00'; var m=Math.floor(t/60), s=Math.floor(t%60); return m+':'+(s<10?'0':'')+s; }
  function build(el){
    var src=el.getAttribute('data-src');
    var audio=document.createElement('audio');
    audio.setAttribute('src',src); audio.preload='metadata'; audio.loop=true; audio.className='hidden-audio';
    el.appendChild(audio);
    var row=document.createElement('div'); row.className='row';
    var btn=document.createElement('button'); btn.className='primary'; btn.textContent='播放';
    var rep=document.createElement('button'); rep.textContent='重听';
    var sel=document.createElement('select');
    [['1','原速 1×'],['0.75','0.75×']].forEach(function(p){var o=document.createElement('option');o.value=p[0];o.textContent=p[1];sel.appendChild(o);});
    var seek=document.createElement('input'); seek.type='range'; seek.min=0; seek.max=1000; seek.value=0;
    var tm=document.createElement('span'); tm.className='time'; tm.textContent='0:00 / 0:00';
    row.appendChild(btn); row.appendChild(rep); row.appendChild(sel); row.appendChild(seek); row.appendChild(tm); el.appendChild(row);
    audio.addEventListener('loadedmetadata',function(){ tm.textContent='0:00 / '+fmt(audio.duration); });
    audio.addEventListener('timeupdate',function(){ if(!audio.duration) return; seek.value=Math.round(audio.currentTime/audio.duration*1000); tm.textContent=fmt(audio.currentTime)+' / '+fmt(audio.duration); });
    btn.onclick=function(){ if(audio.paused){ audio.play(); btn.textContent='暂停'; } else { audio.pause(); btn.textContent='播放'; } };
    rep.onclick=function(){ audio.currentTime=0; audio.play(); btn.textContent='暂停'; };
    sel.onchange=function(){ audio.playbackRate=parseFloat(sel.value); globalRate=audio.playbackRate; };
    seek.oninput=function(){ if(audio.duration) audio.currentTime=seek.value/1000*audio.duration; };
    audio.playbackRate=globalRate; sel.value=String(globalRate);
    audio.addEventListener('ended',function(){ btn.textContent='播放'; });
  }
  document.addEventListener('DOMContentLoaded',function(){
    var nodes=document.querySelectorAll('.clip');
    for(var i=0;i<nodes.length;i++){ build(nodes[i]); }
  });
})();
