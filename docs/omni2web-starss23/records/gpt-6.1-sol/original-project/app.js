'use strict';
const $ = s => document.querySelector(s);
const video = $('#scene-video'), viewport = $('[data-testid="viewport"]'), canvas = $('#panorama'), paint = canvas.getContext('2d');
const seek = $('#seek'), yawInput = $('#yaw'), volume = $('#volume'), playButton = $('#play'), loop = $('#loop'), loopStart = $('#loop-start'), loopEnd = $('#loop-end'), filter = $('#filter');
const colors = {speech:'#bfdf9e',water:'#83c9dc',door:'#e7b47e',footsteps:'#acb9f1',laughter:'#e7a9c0'};
const classNames = {speech:'Speech',water:'Water',door:'Door',footsteps:'Footsteps',laughter:'Laughter'};
const sourceNames = {'seat-right':'Conversation · right','seat-center':'Conversation · center','seat-left':'Conversation · left','room-door':'Room door','sink':'Sink / water','moving-center':'Steps · toward door','moving-right':'Steps · near sink'};
const shortNames = {'seat-right':'Right-side voice','seat-center':'Center voice','seat-left':'Left-side voice','room-door':'Room door','sink':'Sink','moving-center':'Toward door','moving-right':'Near sink'};
const descriptions = {
'speech-right-01':['Travel plans','A conversational turn about hoping to travel.'],
'speech-center-01':['Heading out','A different voice says they need to leave.'],
'speech-left-01':['A brief reply','A short conversational response; source attribution is less certain here.'],
'laughter-left-01':['Possible chuckle','Weak classifier evidence for brief laughter under the end of the exchange. Source assignment is tentative.'],
'speech-right-02':['Getting water','A voice mentions getting water, with direction changing toward the sink.'],
'steps-center-01':['Toward the door','Low-confidence footfall estimate during the departure. Overlapping voices obscure individual steps.'],
'steps-right-01':['Toward the sink','Quiet movement / shuffle estimate. The exact beginning and path are uncertain.'],
'door-01':['Door opens','A strong door-like sound, spatially consistent with the room door.'],
'water-01':['Water at the sink','Liquid / sizzle-like acoustic evidence is consistent with the sink. The quiet tail and end time are uncertain.'],
'door-02':['Door closes','A second strong mechanical / door transient. Drawer and cupboard labels are alternative classifier predictions.'],
'steps-right-02':['Back to the seat','Tentative quiet footfalls during the return from the sink; timing is approximate.'],
'speech-right-03':['An ideal job?','A question about what kind of job would be ideal, with a moving direction.'],
'speech-left-02':['Work & studies','A reply about studies and related work.'],
'speech-right-04':['Short interjection','A brief directional switch suggests an overlapping interjection. Attribution is uncertain.'],
'speech-right-05':['Acknowledgment','A short acknowledgment between turns.'],
'speech-left-03':['Machine learning','A brief continuation of the reply.'],
'speech-right-06':['Finding work','A question about whether finding work will be difficult.'],
'speech-left-04':['The job search','A longer reply about the difficulty of finding suitable work.'],
'speech-right-07':['A short response','A brief conversational response.'],
'speech-left-05':['A difficult search','A short continuation from the left-side direction.'],
'speech-right-08':['A shared experience','The conversation continues about similar issues across fields.']
};
let events = [], markerNodes = new Map(), barNodes = new Map(), yaw = 0, selected = null, intent = false, dirty = true, waiting = false, actionToken = 0, audioRaw = null, audioLoadError = null;
let context = null, audioBuffer = null, sourceNode = null, splitter = null, merger = null, master = null, matrix = null, sourceOffset = 0, sourceClock = 0, lastDriftCheck = 0;
const wrap = a => ((a + 180) % 360 + 360) % 360 - 180;
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const fmt = n => {n=clamp(Number(n)||0,0,60);return `${String(Math.floor(n/60)).padStart(2,'0')}:${(n%60).toFixed(1).padStart(4,'0')}`;};
const title = e => descriptions[e.id]?.[0] || classNames[e.class];
const tentative = e => ['footsteps','laughter','water'].includes(e.class) || e.id==='speech-right-04' || e.id==='speech-left-01';
function position(e,t){
 const tr=e.trajectory;if(t<=tr[0].time)return tr[0];
 for(let i=1;i<tr.length;i++){if(t<=tr[i].time){const a=tr[i-1],b=tr[i],q=(t-a.time)/(b.time-a.time);return {azimuth:wrap(a.azimuth+wrap(b.azimuth-a.azimuth)*q),elevation:a.elevation+(b.elevation-a.elevation)*q};}}
 return tr[tr.length-1];
}
function visibleEvents(t){return events.filter(e => e.start<=t && t<e.end && (filter.value==='all'||filter.value===e.class));}
const audioFetch = fetch('/media/scene-foa.wav').then(r=>{if(!r.ok)throw Error('FOA audio could not be loaded.');return r.arrayBuffer();}).then(b=>{audioRaw=b;$('#status').textContent='FOA ready · 4 channels';return b;}).catch(e=>{audioLoadError=e;$('#status').textContent='Audio unavailable — reload to retry';return null;});
function pcmBuffer(raw){
 const d=new DataView(raw);const str=(p,n)=>{let s='';for(let i=0;i<n;i++)s+=String.fromCharCode(d.getUint8(p+i));return s;};
 if(str(0,4)!=='RIFF'||str(8,4)!=='WAVE')throw Error('Expected a RIFF WAVE recording.');
 let channels=0,rate=0,bits=0,format=0,block=0,dataAt=0,dataSize=0;
 for(let p=12;p+8<=d.byteLength;){const tag=str(p,4),len=d.getUint32(p+4,true),at=p+8;if(tag==='fmt '){format=d.getUint16(at,true);channels=d.getUint16(at+2,true);rate=d.getUint32(at+4,true);block=d.getUint16(at+12,true);bits=d.getUint16(at+14,true);if(format===65534&&len>=40)format=d.getUint16(at+24,true);}if(tag==='data'){dataAt=at;dataSize=Math.min(len,d.byteLength-at);}p=at+len+(len%2);}
 if(channels!==4||!dataAt||!rate||!block||!((format===1&&bits===16)||(format===3&&bits===32)))throw Error('This preview requires four-channel PCM16 (or float32) W,Y,Z,X audio.');
 const frames=Math.floor(dataSize/block),buf=context.createBuffer(4,frames,rate),bytes=bits/8;
 for(let c=0;c<4;c++){const out=buf.getChannelData(c);for(let i=0;i<frames;i++){const p=dataAt+i*block+c*bytes;out[i]=format===3?d.getFloat32(p,true):d.getInt16(p,true)/32768;}}
 return buf;
}
function graph(){
 if(matrix)return;
 audioBuffer=pcmBuffer(audioRaw);
 splitter=context.createChannelSplitter(4);splitter.channelInterpretation='discrete';
 merger=context.createChannelMerger(2);merger.channelInterpretation='discrete';
 matrix=[];
 // Each path is mono. Original Ambisonic order is W,Y,Z,X; Z has no output path.
 for(const ch of [0,1,3])for(let ear=0;ear<2;ear++){
  const gain=context.createGain();gain.channelCount=1;gain.channelCountMode='explicit';gain.channelInterpretation='discrete';splitter.connect(gain,ch,0);gain.connect(merger,0,ear);matrix.push({ch,ear,gain});
 }
 master=context.createGain();master.gain.value=Number(volume.value);merger.connect(master);master.connect(context.destination);updateMatrix();
}
function updateMatrix(){if(!matrix)return;const a=yaw*Math.PI/180;for(const p of matrix){const value=p.ch===0?.5:p.ch===1?(p.ear===0?.5:-.5)*Math.cos(a):(p.ear===0?-.5:.5)*Math.sin(a);p.gain.gain.setValueAtTime(value,context.currentTime);}}
function stopSource(){if(sourceNode){const s=sourceNode;sourceNode=null;try{s.stop();}catch(_){}s.disconnect();}}
function loopRange(){return [clamp(Number(loopStart.value)||0,0,59.9),clamp(Number(loopEnd.value)||60,.1,60)];}
function startSource(){
 if(!intent||!audioBuffer||!context||context.state!=='running'||video.paused||video.seeking||waiting||video.readyState<3)return;
 stopSource();const t=video.currentTime;if(t>=audioBuffer.duration)return;
 const src=context.createBufferSource();src.buffer=audioBuffer;src.channelInterpretation='discrete';src.connect(splitter);
 const [a,b]=loopRange();if(loop.checked&&b>a){src.loop=true;src.loopStart=a;src.loopEnd=Math.min(b,audioBuffer.duration);}
 sourceOffset=t;sourceClock=context.currentTime;sourceNode=src;src.start(sourceClock,Math.max(0,t));
}
function setPlayingUI(){playButton.setAttribute('aria-label',intent?'Pause recording':'Play recording');playButton.setAttribute('aria-pressed',String(intent));$('#play-symbol').textContent=intent?'Ⅱ':'▶';$('#play-label').textContent=intent?'Pause':'Play';$('#view-state').textContent=intent?'PLAYING':'PAUSED';}
function pause(){intent=false;actionToken++;video.pause();stopSource();setPlayingUI();dirty=true;}
async function play(){
 if(intent){pause();return;}
 intent=true;const token=++actionToken;setPlayingUI();$('#status').textContent='Preparing spatial audio…';
 try{
  if(!context)context=new (window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});
  await context.resume();await audioFetch;if(!intent||token!==actionToken)return;
  if(audioLoadError||!audioRaw)throw audioLoadError||Error('Audio unavailable.');graph();
  if(video.currentTime>=59.98)video.currentTime=loop.checked?loopRange()[0]:0;
  const [a,b]=loopRange();if(loop.checked&&(video.currentTime<a||video.currentTime>=b))video.currentTime=a;
  waiting=false;await video.play();if(!intent||token!==actionToken){video.pause();return;}if(!sourceNode)startSource();$('#status').textContent='FOA stereo · live rotation';
 }catch(e){if(token!==actionToken)return;pause();$('#status').textContent=e.message||'Playback could not start.';}
}
playButton.addEventListener('click',play);
function seekTo(t){t=clamp(Number(t)||0,0,60);stopSource();video.currentTime=t;seek.value=t;dirty=true;updateVisuals(t);drawPanorama();}
for(const name of ['input','change'])seek.addEventListener(name,()=>seekTo(seek.value));
video.addEventListener('seeking',()=>{stopSource();dirty=true;updateVisuals(video.currentTime);});
video.addEventListener('seeked',()=>{waiting=false;dirty=true;drawPanorama();updateVisuals(video.currentTime);if(intent&&!video.paused)startSource();});
video.addEventListener('playing',()=>{waiting=false;if(intent&&!sourceNode)startSource();dirty=true;});
video.addEventListener('waiting',()=>{waiting=true;stopSource();});
video.addEventListener('pause',stopSource);
video.addEventListener('ended',()=>{if(intent&&loop.checked){seekTo(loopRange()[0]);video.play().catch(()=>pause());}else pause();});
video.addEventListener('loadeddata',()=>{$('#video-loading').hidden=true;dirty=true;drawPanorama();});
video.addEventListener('error',()=>{$('#video-loading').hidden=false;$('#video-loading').textContent='Video could not load. Please reload.';pause();});
function setYaw(n){yaw=clamp(Number(n)||0,-180,180);yawInput.value=yaw;$('#yaw-output').textContent=`${Math.round(yaw)}°`;$('#view-heading').textContent=`${Math.round(yaw)}° · ${Math.abs(yaw)<.5?'FRONT':yaw>0?'LEFT':'RIGHT'}`;updateMatrix();dirty=true;drawPanorama();updateVisuals(video.currentTime);}
for(const name of ['input','change'])yawInput.addEventListener(name,()=>setYaw(yawInput.value));
$('#reset-yaw').addEventListener('click',()=>setYaw(0));
for(const name of ['input','change'])volume.addEventListener(name,()=>{const v=Number(volume.value);$('#volume-output').textContent=`${Math.round(v*100)}%`;if(master)master.gain.setValueAtTime(v,context.currentTime);});
let drag=null;
viewport.addEventListener('pointerdown',e=>{if(e.target.closest('.marker'))return;drag={x:e.clientX,yaw};viewport.setPointerCapture(e.pointerId);viewport.classList.add('dragging');});
viewport.addEventListener('pointermove',e=>{if(drag){const width=viewport.getBoundingClientRect().width;setYaw(wrap(drag.yaw+(e.clientX-drag.x)/width*120));}});
function endDrag(){drag=null;viewport.classList.remove('dragging');}
viewport.addEventListener('pointerup',endDrag);viewport.addEventListener('pointercancel',endDrag);
viewport.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setYaw(wrap(yaw+(e.key==='ArrowLeft'?5:-5)));}});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!/^(INPUT|SELECT|BUTTON|TEXTAREA|SUMMARY)$/.test(e.target.tagName)){e.preventDefault();play();}});
function validateLoop(){let [a,b]=loopRange();if(b<=a)b=Math.min(60,a+.1);loopStart.value=Number(a.toFixed(1));loopEnd.value=Number(b.toFixed(1));updateLoop();if(intent&&loop.checked&&(video.currentTime<a||video.currentTime>=b))seekTo(a);else if(intent)startSource();}
for(const node of [loopStart,loopEnd]){node.addEventListener('input',()=>{updateLoop();});node.addEventListener('change',validateLoop);}
loop.addEventListener('change',validateLoop);
function updateLoop(){const [a,b]=loopRange();const band=$('#seek-loop');band.style.display=loop.checked?'block':'none';band.style.left=`${a/60*100}%`;band.style.width=`${Math.max(0,b-a)/60*100}%`;const tl=$('#timeline-loop');if(tl){tl.hidden=!loop.checked;const w=$('#timeline').clientWidth-147;tl.style.left=`${147+w*a/60}px`;tl.style.width=`${w*(b-a)/60}px`;}}
function drawPanorama(){
 if(video.readyState<2||!video.videoWidth)return;
 const rect=viewport.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);const w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 const vw=video.videoWidth,vh=video.videoHeight,sw=vw/3,sh=vh/2,sy=vh/4;
 let sx=((180-yaw-60)/360*vw%vw+vw)%vw;const first=Math.min(sw,vw-sx),out=first/sw*w;
 paint.drawImage(video,sx,sy,first,sh,0,0,out,h);
 if(first<sw)paint.drawImage(video,0,sy,sw-first,sh,out,0,w-out,h);
 dirty=false;
}
function buildTimeline(){
 const present=[...new Set(events.map(e=>e.class))];for(const c of present){const opt=document.createElement('option');opt.value=c;opt.textContent=classNames[c];filter.append(opt);const legend=document.createElement('span');const dot=document.createElement('i');dot.style.background=colors[c];legend.append(dot,document.createTextNode(classNames[c]));$('#legend').append(legend);}
 for(let i=0;i<=60;i+=10){const tick=document.createElement('span');tick.className='ruler-tick';tick.style.left=`${i/60*100}%`;tick.textContent=`${String(Math.floor(i/60)).padStart(2,'0')}:${String(i%60).padStart(2,'0')}`;$('#ruler-ticks').append(tick);}
 const order=['seat-right','seat-center','seat-left','room-door','sink','moving-center','moving-right'];
 for(const s of order){const lane=document.createElement('div');lane.className='lane';lane.dataset.source=s;const name=document.createElement('div');name.className='lane-name';name.textContent=sourceNames[s];const track=document.createElement('div');track.className='lane-track';
  for(const e of events.filter(e=>e.source===s)){const button=document.createElement('button');button.className='event-bar'+(tentative(e)?' tentative':'');button.dataset.eventId=e.id;button.dataset.role='event';button.style.setProperty('--event-color',colors[e.class]);button.style.left=`${e.start/60*100}%`;button.style.width=`${(e.end-e.start)/60*100}%`;button.textContent=e.end-e.start>3?title(e):'';button.title=`${classNames[e.class]} · ${title(e)} · ${fmt(e.start)}–${fmt(e.end)}${tentative(e)?' · tentative':''}`;button.setAttribute('aria-label',button.title);button.addEventListener('click',()=>selectEvent(e));track.append(button);barNodes.set(e.id,button);}
  lane.append(name,track);$('#timeline-lanes').append(lane);
 }
 const band=document.createElement('div');band.id='timeline-loop';band.className='timeline-loop';band.hidden=true;$('#timeline').append(band);const head=document.createElement('div');head.id='timeline-playhead';head.className='timeline-playhead';$('#timeline').append(head);
 for(const e of events){const marker=document.createElement('button');marker.className='marker';marker.dataset.eventId=e.id;marker.dataset.role='marker';marker.style.setProperty('--event-color',colors[e.class]);marker.hidden=true;marker.setAttribute('aria-label',`${classNames[e.class]}: ${title(e)}`);const label=document.createElement('span');label.className='marker-label';label.append(document.createTextNode(classNames[e.class]));const small=document.createElement('small');small.textContent=`${shortNames[e.source]}${tentative(e)?' · estimated':''}`;label.append(document.createElement('br'),small);marker.append(label);marker.addEventListener('click',ev=>{ev.stopPropagation();selectEvent(e);});$('#markers').append(marker);markerNodes.set(e.id,marker);}
 filter.addEventListener('change',()=>{applyFilter();updateVisuals(video.currentTime);});applyFilter();
}
function applyFilter(){const f=filter.value;let count=0;for(const e of events){const show=f==='all'||e.class===f;barNodes.get(e.id).hidden=!show;if(show)count++;}for(const lane of document.querySelectorAll('.lane'))lane.hidden=!events.some(e=>e.source===lane.dataset.source&&(f==='all'||e.class===f));$('#event-count').textContent=`${count} intervals`;updateLoop();}
function selectEvent(e){
 pause();selected=e.id;const t=(e.start+e.end)/2;seekTo(t);setYaw(position(e,t).azimuth);
 const box=$('#selection');box.replaceChildren();const eye=document.createElement('div');eye.className='eyebrow';eye.textContent=`${classNames[e.class].toUpperCase()} / ${tentative(e)?'TENTATIVE ESTIMATE':'INFERRED EVENT'}`;const heading=document.createElement('h3');heading.textContent=title(e);const meta=document.createElement('div');meta.className='selection-meta';meta.textContent=`${fmt(e.start)} — ${fmt(e.end)} · ${Math.round(position(e,t).azimuth)}°`;const p=document.createElement('p');p.textContent=descriptions[e.id]?.[1]||'Estimated audible event in the mixed scene.';const button=document.createElement('button');button.textContent='↻ Loop this interval';button.addEventListener('click',()=>{loopStart.value=e.start;loopEnd.value=e.end;loop.checked=true;validateLoop();seekTo(e.start);});box.append(eye,heading,meta,p,button);
 for(const [id,node]of barNodes)node.classList.toggle('selected',id===selected);updateVisuals(t);
}
let lastActiveKey='';
function updateVisuals(t){
 seek.value=clamp(t,0,60);$('#clock').textContent=fmt(t);
 const active=visibleEvents(t),ids=new Set(active.map(e=>e.id));
 for(const e of events){const node=markerNodes.get(e.id);if(!node)continue;const p=position(e,t),d=wrap(p.azimuth-yaw),show=ids.has(e.id)&&Math.abs(d)<60&&Math.abs(p.elevation)<45;node.hidden=!show;if(show){const x=.5-d/120;node.style.left=`${x*100}%`;node.style.top=`${(.5-p.elevation/90)*100}%`;node.classList.toggle('flip',x>.6);}barNodes.get(e.id)?.classList.toggle('active',ids.has(e.id));}
 const unique=new Set(active.map(e=>e.source));$('#active-count').textContent=`${unique.size} ${unique.size===1?'source':'sources'}`;
 const key=active.map(e=>e.id).join('|');if(key!==lastActiveKey||!$('#active-sources').childElementCount){lastActiveKey=key;const list=$('#active-sources');list.replaceChildren();if(!active.length){const empty=document.createElement('p');empty.className='empty-source';empty.textContent='No marked events at this moment.';list.append(empty);}for(const e of active){const b=document.createElement('button');b.className='active-source';b.style.setProperty('--event-color',colors[e.class]);const dot=document.createElement('span');dot.className='source-dot';const info=document.createElement('div');const strong=document.createElement('strong');strong.textContent=classNames[e.class]+(tentative(e)?' · estimated':'');const small=document.createElement('small');small.textContent=shortNames[e.source];info.append(strong,small);const angle=document.createElement('span');angle.dataset.angleId=e.id;angle.textContent=`${Math.round(position(e,t).azimuth)}° ↗`;b.append(dot,info,angle);b.addEventListener('click',()=>setYaw(position(e,video.currentTime).azimuth));list.append(b);}}
 for(const el of document.querySelectorAll('[data-angle-id]')){const e=events.find(e=>e.id===el.dataset.angleId);if(e)el.textContent=`${Math.round(position(e,t).azimuth)}° ↗`;}
 const ph=$('#timeline-playhead');if(ph){const w=$('#timeline').clientWidth-147;ph.style.left=`${147+w*t/60}px`;}
 drawRadar(active,t);
}
const radar=$('#radar'),radarPaint=radar.getContext('2d');
function drawRadar(active,t){const p=radarPaint,w=radar.width,h=radar.height,cx=w/2,cy=h/2-3,r=117;p.clearRect(0,0,w,h);const xy=(a,radius)=>[cx-Math.sin(a*Math.PI/180)*radius,cy-Math.cos(a*Math.PI/180)*radius];
 p.strokeStyle='#354c43';p.lineWidth=1;for(const radius of [r*.5,r]){p.beginPath();p.arc(cx,cy,radius,0,Math.PI*2);p.stroke();}p.setLineDash([3,6]);p.beginPath();p.moveTo(cx-r,cy);p.lineTo(cx+r,cy);p.moveTo(cx,cy-r);p.lineTo(cx,cy+r);p.stroke();p.setLineDash([]);
 p.beginPath();p.moveTo(cx,cy);for(let a=yaw-60;a<=yaw+60;a+=2){const [x,y]=xy(a,r);p.lineTo(x,y);}p.closePath();p.fillStyle='#c1e8ab12';p.fill();p.strokeStyle='#c1e8ab44';p.stroke();
 const front=xy(yaw,r*.8);p.beginPath();p.moveTo(cx,cy);p.lineTo(...front);p.strokeStyle='#c1e8ab66';p.stroke();
 p.fillStyle='#8da393';p.font='16px ui-sans-serif, sans-serif';p.textAlign='center';p.fillText('0°',cx,cy-r-14);p.fillText('180°',cx,cy+r+25);p.fillText('+90°',cx-r-38,cy+5);p.fillText('−90°',cx+r+39,cy+5);
 p.fillStyle='#c1e8ab';p.beginPath();p.arc(cx,cy,7,0,Math.PI*2);p.fill();p.fillStyle='#14241b';p.beginPath();p.arc(cx,cy,2,0,Math.PI*2);p.fill();
 for(const e of active){const q=position(e,t),[x,y]=xy(q.azimuth,r*.79);p.fillStyle=colors[e.class]+'20';p.beginPath();p.arc(x,y,14,0,Math.PI*2);p.fill();p.fillStyle=colors[e.class];p.beginPath();p.arc(x,y,6,0,Math.PI*2);p.fill();}
}
radar.addEventListener('click',e=>{const rect=radar.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*radar.width-radar.width/2,y=(e.clientY-rect.top)/rect.height*radar.height-(radar.height/2-3);setYaw(wrap(Math.atan2(-x,-y)*180/Math.PI));});
new ResizeObserver(()=>{dirty=true;drawPanorama();updateLoop();updateVisuals(video.currentTime);}).observe(viewport);
window.addEventListener('resize',()=>{dirty=true;updateLoop();updateVisuals(video.currentTime);});
function frame(now){
 const t=video.currentTime,[a,b]=loopRange();
 if(intent&&!video.seeking&&loop.checked&&b>a&&t>=b){seekTo(a);if(video.paused)video.play().catch(()=>pause());}
 else{
  if(intent&&!video.paused&&!video.seeking&&!waiting&&context&&audioBuffer){if(!sourceNode)startSource();if(sourceNode&&now-lastDriftCheck>350){let at=sourceOffset+(context.currentTime-sourceClock);if(loop.checked&&at>=b)at=a+(at-a)%(b-a);if(Math.abs(at-t)>.085)startSource();lastDriftCheck=now;}}
  if(dirty||!video.paused)drawPanorama();updateVisuals(t);
 }
 requestAnimationFrame(frame);
}
fetch('events.json').then(r=>{if(!r.ok)throw Error('Event file unavailable');return r.json();}).then(data=>{events=data.events;buildTimeline();updateVisuals(video.currentTime);}).catch(e=>{$('#event-count').textContent=e.message;});
video.muted=true;video.volume=0;updateLoop();setPlayingUI();requestAnimationFrame(frame);
