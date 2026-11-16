'use strict';
// These files are verifier self-checks, not model results or reference policies.
const video = document.querySelector('#o5-video');
const download = document.querySelector('#o5-video-download');
const buttons = [...document.querySelectorAll('[data-seed]')];
for (const button of buttons) {
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') return;
    const seed = button.dataset.seed;
    const prefix = '../../assets/automotive-harness-assembly/control-';
    video.pause();
    video.poster = `${prefix}${seed}.png`;
    video.querySelector('source').src = `${prefix}${seed}.mp4`;
    video.load();
    download.href = `${prefix}${seed}.mp4`;
    for (const option of buttons) option.setAttribute('aria-pressed', String(option === button));
  });
}
