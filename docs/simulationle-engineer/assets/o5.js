'use strict';
const video=document.querySelector('#o5-video');
const download=document.querySelector('#o5-video-download');
for(const button of document.querySelectorAll('[data-seed]')) button.addEventListener('click',()=>{const seed=button.dataset.seed;video.pause();video.poster=`../../assets/automotive-harness-assembly/physical-${seed}-last-frame.png`;video.querySelector('source').src=`../../assets/automotive-harness-assembly/physical-${seed}-verification.mp4`;video.load();download.href=`../../assets/automotive-harness-assembly/physical-${seed}-verification.mp4`;for(const option of document.querySelectorAll('[data-seed]'))option.setAttribute('aria-pressed',String(option===button));});
