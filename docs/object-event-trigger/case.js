(() => {
  'use strict';
  const data = window.CASE_DATA;
  const $ = id => document.getElementById(id);
  const source = $('source-player'), clip = $('clip-player'), reel = $('reel-player');
  const names = {impact: '碰撞', friction: '摩擦'};
  const state = {scene:'B', target:'Q1', filter:'all', selected:null};
  let currentEvents = [], seekPending = null;
  const num = x => Number(x).toFixed(2);
  const press = (selector, key, value) => document.querySelectorAll(selector).forEach(b => {
    const active = b.dataset[key] === value;
    b.setAttribute('aria-pressed', String(active));
    b.classList.toggle('active', active);
  });
  function pauseOthers(active) { document.querySelectorAll('video,audio').forEach(p => { if(p !== active) p.pause(); }); }
  document.querySelectorAll('video,audio').forEach(p => p.addEventListener('play', () => pauseOthers(p)));
  function play(player) { pauseOthers(player); const promise = player.play(); if(promise) promise.catch(() => {}); }
  function seekSource(time, autoplay) {
    const position = Math.max(0,Math.min(data.scenes[state.scene].duration - .01,time));
    if(source.readyState >= 1) source.currentTime = position;
    else seekPending = position;
    if(autoplay) play(source);
    updateClock();
  }
  source.addEventListener('loadedmetadata', () => { if(seekPending !== null){source.currentTime=seekPending;seekPending=null;} updateClock(); });
  function query() { return data.queries[state.scene+'-'+state.target]; }
  function updateClock() {
    const t = source.currentTime || 0, duration = data.scenes[state.scene].duration;
    $('source-clock').textContent = num(t)+' / '+num(duration)+' s';
    document.querySelectorAll('.playhead').forEach(p => p.style.left = Math.min(100,t/duration*100)+'%');
    const live = currentEvents.filter(e => t >= e.start && t < e.end);
    const label = $('live-trigger');
    label.className = 'live-trigger';
    if(live.length) {
      const types = new Set(live.map(e=>e.class));
      label.classList.add(types.size>1 ? 'is-both' : 'is-'+live[0].class);
      label.querySelector('span').textContent = live.map(e => names[e.class]+' #'+String(e.number).padStart(2,'0')).join(' · ');
    } else label.querySelector('span').textContent = '当前无预测触发';
  }
  source.addEventListener('timeupdate',updateClock);
  source.addEventListener('seeked',updateClock);
  let frameLoop = false;
  const animate = () => { updateClock(); if(!source.paused&&!source.ended) requestAnimationFrame(animate); else frameLoop=false; };
  source.addEventListener('play',()=>{ if(!frameLoop){frameLoop=true;requestAnimationFrame(animate);} });
  function renderTracks() {
    const duration=data.scenes[state.scene].duration;
    ['impact','friction'].forEach(type => {
      const track = $(type+'-track'); track.replaceChildren();
      currentEvents.filter(e=>e.class===type).forEach(e=>{
        const b=document.createElement('button'); b.type='button'; b.className='event-bar '+type;
        b.dataset.event=e.event_id; b.style.left=(e.start/duration*100)+'%';
        b.style.width=Math.max(.35,(e.end-e.start)/duration*100)+'%';
        b.title='#'+e.number+' '+names[type]+' '+num(e.start)+'–'+num(e.end)+' s';
        b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed','false');
        b.addEventListener('click',()=>{ selectEvent(e,false);seekSource(e.start-1,true); });
        track.append(b);
      });
      const head=document.createElement('span');head.className='playhead';track.append(head);
    });
    $('timeline-ticks').replaceChildren(...[0,.25,.5,.75,1].map(r=>{const x=document.createElement('span');x.textContent=num(r*duration)+'s';return x;}));
  }
  function renderList() {
    const visible=currentEvents.filter(e=>state.filter==='all'||state.filter===e.class);
    const list=$('event-list');list.replaceChildren();
    visible.forEach(e=>{
      const b=document.createElement('button');b.type='button';b.className='event-row '+e.class;
      b.dataset.event=e.event_id;b.setAttribute('aria-pressed',String(e.event_id===state.selected));
      const number=document.createElement('span');number.className='number';number.textContent='#'+String(e.number).padStart(2,'0');
      const type=document.createElement('span');type.className='type';type.append(document.createElement('i'),names[e.class]);
      const times=document.createElement('span');times.textContent=num(e.start)+' – '+num(e.end)+' s';
      const confidence=document.createElement('span');confidence.className='confidence';confidence.textContent='置信 '+num(e.confidence);
      b.append(number,type,times,confidence);b.setAttribute('aria-label',`事件${e.number}，${names[e.class]}，${num(e.start)}至${num(e.end)}秒，模型置信度${num(e.confidence)}`);
      b.addEventListener('click',()=>selectEvent(e,true));list.append(b);
    });
    list.hidden=visible.length===0;
    $('empty-state').hidden=visible.length!==0;
    if(!visible.length){
      $('empty-state').querySelector('h4').textContent=currentEvents.length?'此类别没有预测':'没有预测事件';
      $('empty-state').querySelector('p').innerHTML='请播放完整录像判断是否漏检。<br>空输出本身不代表正确。';
    }
    $('event-total').textContent=state.filter==='all'?currentEvents.length+' 条预测':visible.length+' / '+currentEvents.length+' 条预测';
  }
  function selectEvent(e,autoplay) {
    state.selected=e.event_id;
    document.querySelectorAll('[data-event]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.event===e.event_id)));
    const changed=clip.getAttribute('src')!==e.clip;
    if(changed){clip.pause();clip.src=e.clip;clip.poster=e.poster;clip.load();}
    $('clip-title').textContent='#'+String(e.number).padStart(2,'0')+' '+names[e.class]+' · '+num(e.start)+'–'+num(e.end)+'s';
    $('evidence-text').textContent=e.evidence||'原始交付未提供额外文字依据。';
    $('model-evidence').open=false;
    $('clip-file').href=e.clip;
    $('clip-player').hidden=false;$('clip-placeholder').hidden=true;
    $('jump-source').disabled=false;$('clip-file').hidden=false;$('model-evidence').hidden=false;
    if(autoplay){clip.currentTime=0;play(clip);}
  }
  function clearClip(message) {
    state.selected=null;clip.pause();
    clip.removeAttribute('src');clip.removeAttribute('poster');clip.load();clip.hidden=true;
    $('clip-title').textContent=message;$('clip-placeholder').hidden=false;
    $('jump-source').disabled=true;$('clip-file').hidden=true;$('model-evidence').hidden=true;
    document.querySelectorAll('[data-event]').forEach(b=>b.setAttribute('aria-pressed','false'));
  }
  function renderQuery(changeScene) {
    const scene=data.scenes[state.scene], q=query();
    clip.pause();
    currentEvents=q.events.map((e,i)=>({...e,number:i+1}));state.selected=null;
    if(changeScene){
      source.pause();seekPending=null;source.src=scene.video;source.poster=q.target_image;source.load();
    } else source.poster=q.target_image;
    $('scene-label').textContent='场景 '+state.scene+' · '+(scene.split==='development'?'开发原交付':'封存代码 · 未见录像重跑');
    $('target-image').src=q.target_image;$('target-image').alt=q.id+' 目标指示：'+q.description;
    $('target-name').textContent=q.description;
    $('target-reference').textContent='指示帧 '+num(q.reference_time)+'s；标记本身不代表此刻有声音。';
    $('impact-count').textContent=q.counts.impact;$('friction-count').textContent=q.counts.friction;
    $('raw-review').href=q.base+'index.html';$('raw-events').href=q.base+'events.json';$('raw-triggers').href=q.base+'triggers.jsonl';
    press('[data-scene]','scene',state.scene);press('[data-target]','target',state.target);press('[data-filter]','filter',state.filter);
    renderTracks();renderList();
    if(currentEvents.length){selectEvent(currentEvents[0],false);}else{clearClip('没有预测片段');}
    updateClock();
  }
  document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>{if(state.scene===b.dataset.scene)return;state.scene=b.dataset.scene;state.filter='all';renderQuery(true);}));
  document.querySelectorAll('[data-target]').forEach(b=>b.addEventListener('click',()=>{if(state.target===b.dataset.target)return;state.target=b.dataset.target;state.filter='all';renderQuery(false);}));
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
    state.filter=b.dataset.filter;press('[data-filter]','filter',state.filter);renderList();
    const visible=currentEvents.filter(e=>state.filter==='all'||state.filter===e.class);
    if(visible.length)selectEvent(visible.find(e=>e.event_id===state.selected)||visible[0],false);
    else clearClip('此类别没有预测片段');
  }));
  $('jump-source').addEventListener('click',()=>{const e=currentEvents.find(x=>x.event_id===state.selected);if(e){seekSource(e.start-1,true);source.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}});
  reel.addEventListener('timeupdate',()=>{
    const segment=data.reel.segments.find(s=>reel.currentTime>=s.reel_start&&reel.currentTime<s.reel_end);
    $('reel-caption').textContent=segment?segment.query+' · '+names[segment.class]+' · 原录像预测 '+num(segment.source_start)+'–'+num(segment.source_end)+'s（含上下文）':'原混合录音 · 片间停顿 0.8 秒';
  });
  const counts=$('all-query-counts');
  Object.values(data.queries).forEach(q=>{const tr=document.createElement('tr');const scene=data.scenes[q.scene];[q.id,q.description,scene.split==='development'?'开发原交付':'未见重跑',q.counts.impact,q.counts.friction].forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td);});counts.append(tr);});
  renderQuery(true);
})();
