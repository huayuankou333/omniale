'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const ids = ['a','b','c','d','e'];
  const video = $('scene');
  video.muted = true;
  video.defaultMuted = true;
  const state = {position:0,playing:false,preparing:false,origin:0,offset:0,loop:false,a:0,b:90,gains:{a:1,b:1,c:1,d:1,e:1},master:0.8,active:null};
  let plan, ctx, masterNode, nodes = {}, buffers = {}, voices = [], loadingAudio, generation = 0, videoPending = false;
  const fmt = t => `${String(Math.floor(Math.max(0,t)/60)).padStart(2,'0')}:${(Math.max(0,t)%60).toFixed(2).padStart(5,'0')}`;
  const cap = (v,min,max) => Math.min(max,Math.max(min,v));
  const status = text => { $('status').textContent = text; };
  const time = () => {
    if (!state.playing || !ctx) return state.position;
    let t = state.offset + Math.max(0,ctx.currentTime-state.origin);
    if(state.loop && t >= state.b) t = state.a + ((t-state.b) % (state.b-state.a));
    return cap(t,0,90);
  };
  function stopVoices() {
    voices.forEach(s => {try{s.stop();}catch(_){} s.disconnect();});
    voices = [];
  }
  function updatePlay() {
    $('play').textContent = state.preparing ? 'Ⅱ Cancel' : state.playing ? 'Ⅱ Pause' : '▶ Play';
    $('play').setAttribute('aria-pressed',String(state.playing || state.preparing));
  }
  function alignVideo(t,force=false) {
    if(force || Math.abs(video.currentTime-t)>0.14) {
      try {video.currentTime = cap(t,0,89.999);} catch(_){}
    }
    if(state.playing && video.paused && !videoPending) {
      videoPending = true;
      const p = video.play();
      if(p) p.catch(()=>{}).finally(()=>{videoPending=false;}); else videoPending=false;
    }
  }
  function pause(message='Paused · your mix is preserved') {
    generation++;
    state.position = time();
    state.playing = false;
    state.preparing = false;
    stopVoices();
    video.pause();
    alignVideo(state.position,true);
    updatePlay();
    status(message);
    renderTime();
  }
  async function audioReady() {
    if(!ctx) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if(!Audio) throw new Error('WebAudio is not available in this browser.');
      ctx = new Audio();
      masterNode = ctx.createGain();
      masterNode.gain.value = state.master;
      masterNode.connect(ctx.destination);
      ids.forEach(id => {nodes[id]=ctx.createGain();nodes[id].gain.value=state.gains[id];nodes[id].connect(masterNode);});
    }
    const resume = ctx.resume();
    if(!loadingAudio) {
      loadingAudio = Promise.all(ids.map(async id => {
        const res = await fetch(`../../media/track-${id}.wav`);
        if(!res.ok) throw new Error(`Could not load track ${id.toUpperCase()}.`);
        const bytes = await res.arrayBuffer();
        buffers[id] = await ctx.decodeAudioData(bytes);
      })).catch(e => {loadingAudio=null;throw e;});
    }
    await Promise.all([resume,loadingAudio]);
  }
  function launch(t) {
    stopVoices();
    state.position=t;
    state.offset=t;
    state.origin=ctx.currentTime+0.045;
    state.playing=true;
    state.preparing=false;
    ids.forEach(id => {
      const s=ctx.createBufferSource();
      s.buffer=buffers[id];
      s.connect(nodes[id]);
      s.loop=state.loop;
      if(state.loop){s.loopStart=state.a;s.loopEnd=state.b;}
      s.start(state.origin,t);
      voices.push(s);
    });
    alignVideo(t,true);
    updatePlay();
    status(state.loop ? 'Playing · sample-aligned A–B loop' : 'Playing · five synchronized stems');
  }
  async function play() {
    const token=++generation;
    state.preparing=true;
    updatePlay();
    status('Preparing the five local stems…');
    try {
      await audioReady();
      if(token!==generation) return;
      let t=state.position;
      if(t>=89.999)t=0;
      if(state.loop && (t<state.a || t>=state.b))t=state.a;
      launch(t);
    } catch(e) {
      if(token!==generation)return;
      state.preparing=false;state.playing=false;updatePlay();
      status(`${e.message} Press Play to retry.`);
    }
  }
  function seek(t) {
    t=cap(Number(t)||0,0,90);
    const wasPlaying=state.playing;
    if(state.loop && (t<state.a || t>=state.b)) {
      state.loop=false; $('loop').checked=false;
    }
    state.position=t;
    if(wasPlaying) {
      if(t>=90)pause('End of excerpt');
      else launch(t);
    } else alignVideo(t,true);
    renderTime();
  }
  function setGain(id,value) {
    state.gains[id]=cap(Number(value),0,1);
    if(nodes[id])nodes[id].gain.setValueAtTime(state.gains[id],ctx.currentTime);
    $(`gain-${id}`).value=state.gains[id];
    $(`value-${id}`).textContent=state.gains[id].toFixed(2);
  }
  function setMaster(value) {
    state.master=cap(Number(value),0,1);
    if(masterNode)masterNode.gain.setValueAtTime(state.master,ctx.currentTime);
    $('master').value=state.master;
    $('master-value').textContent=state.master.toFixed(2);
  }
  function selection(id) {
    state.active=id;
    const card=plan.cards.find(c=>c.id===id);
    document.querySelectorAll('[data-role="performer"]').forEach(el=>{el.dataset.selected=String(!!card && el.dataset.track===card.target);});
    document.querySelectorAll('[data-role="rehearsal"]').forEach(el=>{
      const active=el.dataset.cardId===id;
      el.dataset.active=String(active);
      el.querySelector('button').setAttribute('aria-pressed',String(active));
      el.querySelector('.button-label').textContent=active?'Restart this rehearsal':'Rehearse this passage';
    });
    $('active-label').textContent=card?`${id.toUpperCase()} · target ${card.target.toUpperCase()}`:'Free rehearsal';
  }
  function applyCard(card) {
    pause('Applying rehearsal…');
    state.a=card.start;state.b=card.end;state.loop=true;state.position=card.start;
    $('loop-start').value=card.start;$('loop-end').value=card.end;$('loop').checked=true;
    ids.forEach(id=>setGain(id,card.gains[id]));setMaster(card.master);
    selection(card.id);alignVideo(card.start,true);renderTime();play();
  }
  function editLoop() {
    const a=Number($('loop-start').value),b=Number($('loop-end').value);
    if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b>90||b<=a||$('loop-start').value===''||$('loop-end').value==='') {
      $('loop-end').setCustomValidity('Choose 0 ≤ A < B ≤ 90.');
      status('Loop not changed: choose 0 ≤ A < B ≤ 90.');return;
    }
    $('loop-end').setCustomValidity('');
    let t=time();
    state.a=a;state.b=b;state.loop=$('loop').checked;
    if(state.loop && (t<a || t>=b))t=a;
    if(state.playing)launch(t);
    else {state.position=t;alignVideo(t,true);renderTime();}
  }
  function renderTime() {
    const t=time();$('seek').value=t;$('clock').textContent=fmt(t);
  }
  function tick() {
    if(state.playing) {
      const t=time();
      if(!state.loop && t>=90) {state.position=90;pause('End of excerpt · press Play to begin again');}
      else alignVideo(t);
    }
    renderTime();
  }
  function build() {
    const ordered=[...plan.tracks].sort((a,b)=>a.slot-b.slot);
    $('performers').innerHTML=ordered.map(t=>`<article class="performer" data-role="performer" data-slot="${t.slot}" data-track="${t.id}" data-selected="false"><div class="performer-top"><span class="slot">SLOT ${t.slot}<span class="target-indicator"> / TARGET</span></span><span class="track-tag">${t.id.toUpperCase()}</span></div><h3>${t.instrument[0].toUpperCase()+t.instrument.slice(1)}</h3><p class="description">${t.description}</p><label class="gain-label" for="gain-${t.id}"><span>TRACK ${t.id.toUpperCase()} / GAIN</span><output id="value-${t.id}">1.00</output></label><input data-testid="gain-${t.id}" id="gain-${t.id}" aria-label="Slot ${t.slot}, track ${t.id}, gain" type="range" min="0" max="1" step="0.01" value="1"></article>`).join('');
    const actions={q1:'Take the gray-shirt viola part. All other players stay at full gain; master 0.80.',q2:'Listen to the printed-shirt violin and cello at 0.60 each; master 0.70.',q3:'Take the earlier violin. Later violin 0.50 · red viola 0.30 · gray viola 0.70 · cello 0.80; master 0.75.'};
    const modes={q1:'PLAY THE MISSING PART',q2:'ISOLATE & LISTEN',q3:'LEAD THE RETURN'};
    plan.cards.forEach((c,i)=>{
      const target=plan.tracks.find(t=>t.id===c.target);
      const container=document.createElement('article');
      container.className=`rehearsal-card ${c.id}`;container.dataset.role='rehearsal';container.dataset.cardId=c.id;container.dataset.active='false';
      container.innerHTML=`<div class="card-top"><span class="card-number">0${i+1} / ${c.id.toUpperCase()}</span><span class="card-mode">${modes[c.id]}</span></div><h3>${c.title}</h3><div class="interval">${c.start.toFixed(2)} — ${c.end.toFixed(2)} s <span>${(c.end-c.start).toFixed(2)} s loop</span></div><p class="target-text">Target: slot ${target.slot} · ${target.instrument} · track ${c.target.toUpperCase()}</p><p class="action-copy">${actions[c.id]}</p><p class="reason">${c.reason}</p><p class="evidence-line">EVIDENCE / ${[...new Set(c.evidence.map(e=>e.call))].join(' · ')}</p><button type="button" class="rehearse-button" data-testid="rehearse-${c.id}" aria-pressed="false"><span class="button-label">Rehearse this passage</span><span aria-hidden="true">↗</span></button>`;
      container.querySelector('button').addEventListener('click',()=>applyCard(c));$('rehearsals').appendChild(container);
      const row=document.createElement('div');row.className=`timeline-row ${c.id}`;
      row.innerHTML=`<span class="timeline-label"><b>${c.id.toUpperCase()}</b> Slot ${target.slot} · ${target.description.split(' · ')[0]}</span><div class="timeline-lane" aria-label="${c.id}, ${c.start} to ${c.end} seconds, target slot ${target.slot}"><span class="timeline-marker" style="left:${c.start/90*100}%;width:${(c.end-c.start)/90*100}%" title="${c.start}–${c.end} s"></span></div>`;$('timeline').appendChild(row);
    });
    ids.forEach(id=>['input','change'].forEach(event=>$(`gain-${id}`).addEventListener(event,e=>setGain(id,e.target.value))));
    ['input','change'].forEach(event=>{
      $('master').addEventListener(event,e=>setMaster(e.target.value));
      $('seek').addEventListener(event,e=>seek(e.target.value));
      $('loop-start').addEventListener(event,editLoop);$('loop-end').addEventListener(event,editLoop);
    });
    $('loop').addEventListener('change',editLoop);
    $('play').addEventListener('click',()=>{if(state.playing||state.preparing)pause();else play();});
    $('reset').addEventListener('click',()=>{
      pause('Room reset · all stems at unity');
      state.position=0;state.a=0;state.b=90;state.loop=false;
      $('loop').checked=false;$('loop-start').value=0;$('loop-end').value=90;$('loop-end').setCustomValidity('');
      ids.forEach(id=>setGain(id,1));setMaster(.8);selection(null);alignVideo(0,true);renderTime();
    });
    $('play').disabled=false;status('Ready · press Play or choose a rehearsal. No audio has started.');
  }
  video.addEventListener('loadedmetadata',()=>alignVideo(time(),true));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)alignVideo(time(),true);});
  fetch('analysis.json').then(r=>{if(!r.ok)throw new Error('Could not load analysis.json');return r.json();}).then(data=>{plan=data;build();}).catch(e=>status(e.message));
  setInterval(tick,35);
})();
