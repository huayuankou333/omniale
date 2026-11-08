'use strict';
const players=[...document.querySelectorAll('audio')];
function stamp(seconds){const s=Math.floor(Math.max(0,seconds));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
players.forEach(audio=>{
 const card=audio.closest('.audio-card');
 const rate=card.querySelector('.speed');
 const repeat=card.querySelector('.repeat');
 const start=Number(audio.dataset.start);
 const clock=card.querySelector('.clock');
 rate.addEventListener('change',()=>{audio.playbackRate=Number(rate.value);audio.preservesPitch=true});
 repeat.addEventListener('change',()=>{audio.loop=repeat.checked});
 card.querySelector('.restart').addEventListener('click',()=>{audio.currentTime=0;audio.play().catch(()=>{clock.textContent='请使用播放器上的播放按钮'})});
 audio.addEventListener('play',()=>{players.forEach(other=>{if(other!==audio)other.pause()});audio.playbackRate=Number(rate.value);audio.loop=repeat.checked});
 audio.addEventListener('timeupdate',()=>{clock.textContent='原录音 '+stamp(start+audio.currentTime)});
 audio.addEventListener('error',()=>{clock.textContent='素材读取失败，请检查目录完整性'});
});
const marks=[...document.querySelectorAll('.mark-btn')];
let saved=[];try{saved=JSON.parse(localStorage.getItem('piano-study-v1')||'[]')}catch(error){saved=[]}
function updateMarks(){
 marks.forEach(button=>{const done=saved.includes(button.dataset.q);button.setAttribute('aria-pressed',String(done));button.textContent=done?'已研习 ✓':'标记已研习'});
 document.querySelectorAll('.outline-link').forEach(link=>link.classList.toggle('done',saved.includes(link.dataset.q)));
 const progress=document.querySelector('#progress-text');if(progress)progress.textContent=saved.length+' / 20 题已研习';
 const bar=document.querySelector('.progress-fill');if(bar)bar.style.width=(saved.length*5)+'%';
}
marks.forEach(button=>button.addEventListener('click',()=>{const q=button.dataset.q;saved=saved.includes(q)?saved.filter(item=>item!==q):[...saved,q];try{localStorage.setItem('piano-study-v1',JSON.stringify(saved))}catch(error){}updateMarks()}));
updateMarks();
const dialog=document.querySelector('#score-dialog');const dialogImage=dialog.querySelector('img');const dialogTitle=dialog.querySelector('#dialog-title');let previousFocus=null;
document.querySelectorAll('.score-window img').forEach(image=>{
 image.addEventListener('click',()=>{previousFocus=image;dialogImage.src=image.src;dialogImage.alt=image.alt;dialogTitle.textContent=image.dataset.title;dialog.showModal()});
 image.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();image.click()}});
});
dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
dialog.addEventListener('close',()=>{if(previousFocus)previousFocus.focus()});
