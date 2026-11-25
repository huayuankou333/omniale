'use strict';
(() => {
  const data = window.RESCUE_CASE_DATA;
  if (!data) return;
  const video = document.getElementById('review-video');
  const targetAudio = document.getElementById('target-audio');
  const residualAudio = document.getElementById('residual-audio');
  const media = [video, targetAudio, residualAudio];
  const state = {scene: 'A', mode: 'target', filter: 'all', request: 0};
  const time = value => {const rounded = Math.round(value * 10) / 10; return `${Math.floor(rounded / 60).toString().padStart(2, '0')}:${(rounded % 60).toFixed(1).padStart(4, '0')}`;};
  const groupNames = {O: '真实重叠', P: '其他目标发声', N: '目标停声'};
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  media.forEach(player => player.addEventListener('play', () => media.forEach(other => {if (other !== player) other.pause();})));
  function loadVideo(position, play) {
    const request = ++state.request;
    const wanted = `media/${state.scene}-${state.mode}.mp4`;
    media.forEach(player => player.pause());
    document.getElementById('load-status').textContent = '';
    const finish = () => {
      if (request !== state.request) return;
      video.currentTime = Math.min(59.95, Math.max(0, position));
      if (play) video.play().catch(() => {document.getElementById('load-status').textContent = '已定位，请点击播放继续试听。';});
    };
    if (video.getAttribute('src') !== wanted) {
      video.addEventListener('loadedmetadata', finish, {once: true});
      video.src = wanted;
      video.poster = `media/${state.scene}-person.jpg`;
      video.load();
    } else if (video.readyState >= 1) finish();
    else video.addEventListener('loadedmetadata', finish, {once: true});
    document.getElementById('monitor-label').textContent = `${state.scene} / ${state.mode === 'target' ? 'SOL TARGET' : 'ORIGINAL MIX'}`;
    document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode)));
  }
  function drawWaveforms() {
    const wave = data.waveforms[state.scene];
    const peak = Math.max(...wave.original, ...wave.target, 0.000001);
    ['original', 'target'].forEach(mode => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', wave[mode].map((v, i) => {const height = Math.min(20, v / peak * 20); return `M${i},${22 - height}v${height * 2}`;}).join(''));
      document.getElementById(`wave-${mode}`).replaceChildren(path);
    });
  }
  function renderUnits() {
    const list = document.getElementById('unit-list');
    list.replaceChildren();
    const rows = data.units.filter(unit => unit.clip === state.scene && (state.filter === 'all' || unit.group === state.filter));
    document.getElementById('unit-count').textContent = `${rows.length} 个单元`;
    rows.forEach(unit => {
      const button = node('button', 'unit');
      button.type = 'button';
      button.dataset.group = unit.group;
      button.dataset.start = unit.start;
      button.dataset.end = unit.end;
      button.setAttribute('aria-current', 'false');
      const header = node('div', 'unit-header');
      header.append(node('b', '', unit.id), node('span', '', `${time(unit.start)}—${time(unit.end)}`));
      button.append(header, node('div', 'type', `${unit.group} · ${groupNames[unit.group]}`));
      const ratings = Object.entries(unit.point_ratings).map(([key, value]) => `${key} ${value}/4`).join(' · ');
      button.append(node('div', unit.unknown ? 'ratings unknown' : 'ratings', unit.unknown ? `待复核 · 中点 ${ratings}` : ratings));
      if (!unit.unknown && unit.issue_zh) button.append(node('div', 'unit-issue', unit.issue_zh));
      button.setAttribute('aria-label', `${unit.id} ${groupNames[unit.group]} ${time(unit.start)}至${time(unit.end)}${unit.unknown ? ' 待复核' : ''}`);
      button.addEventListener('click', () => loadVideo(unit.start, true));
      list.append(button);
    });
    updateTime();
  }
  function updateTime() {
    const t = video.currentTime || 0;
    document.getElementById('clock').textContent = `${time(t)} / 01:00.0`;
    document.querySelectorAll('.unit').forEach(button => button.setAttribute('aria-current', String(t >= Number(button.dataset.start) && t < Number(button.dataset.end))));
  }
  document.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => {
    if (state.scene === button.dataset.scene) return;
    state.scene = button.dataset.scene;
    state.filter = 'all';
    document.querySelectorAll('[data-scene]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === 'all')));
    const scene = data.scenes[state.scene];
    document.getElementById('target-image').src = `media/${state.scene}-person.jpg`;
    document.getElementById('target-image').alt = `记录${state.scene}的目标人物指示图`;
    document.getElementById('target-name').textContent = `${state.scene} · ${scene.name}`;
    document.getElementById('scene-description').textContent = scene.description;
    targetAudio.src = `media/${state.scene}-target.mp3`;
    residualAudio.src = `media/${state.scene}-residual.mp3`;
    for (const kind of ['target', 'residual', 'original']) document.getElementById(`${kind}-download`).href = `media/${state.scene}-${kind}.mp3`;
    loadVideo(0, false);
    drawWaveforms();
    renderUnits();
  }));
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    if (state.mode === button.dataset.mode) return;
    const position = video.currentTime || 0;
    const playing = !video.paused;
    state.mode = button.dataset.mode;
    loadVideo(position, playing);
  }));
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    renderUnits();
  }));
  video.addEventListener('timeupdate', updateTime);
  video.addEventListener('seeked', updateTime);
  video.addEventListener('error', () => {document.getElementById('load-status').textContent = '媒体加载失败，请刷新页面，或使用旁边的独立音轨链接。';});
  drawWaveforms();
  renderUnits();
})();
