'use strict';
(() => {
  const data = window.AD_CASE_DATA;
  if (!data) return;
  const video = document.getElementById('result-video');
  const audio = document.getElementById('ad-audio');
  const timeline = document.getElementById('ad-timeline');
  const cueList = document.getElementById('cue-list');
  const playhead = document.getElementById('playhead');
  const statusLabels = {full: '完整 · 1', partial: '部分 · 0.5', missing: '遗漏 · 0'};
  const cueButtons = new Map();
  const timelineButtons = new Map();
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const timeText = t => `${Math.floor(t / 60).toString().padStart(2, '0')}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
  const seek = (time, scroll = false) => {
    audio.pause();
    video.currentTime = Math.max(0, Math.min(time, data.duration));
    video.play().catch(() => {});
    if (scroll) video.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center'});
  };

  data.segments.forEach(cue => {
    const button = element('button', 'cue-button');
    button.type = 'button';
    button.append(element('time', '', timeText(cue.start)), element('span', '', cue.text));
    button.setAttribute('aria-label', `${timeText(cue.start)} ${cue.text}`);
    button.setAttribute('aria-current', 'false');
    button.addEventListener('click', () => seek(cue.start));
    cueList.append(button);
    cueButtons.set(cue.id, button);

    const marker = element('button', 'cue-marker');
    marker.type = 'button';
    marker.style.left = `${cue.start / data.duration * 100}%`;
    marker.style.width = `${(cue.end - cue.start) / data.duration * 100}%`;
    marker.title = `${timeText(cue.start)} ${cue.text}`;
    marker.setAttribute('aria-label', marker.title);
    marker.setAttribute('aria-pressed', 'false');
    marker.addEventListener('click', () => seek(cue.start));
    timeline.append(marker);
    timelineButtons.set(cue.id, marker);
  });

  let previousId = null;
  function updatePlayback() {
    const t = video.currentTime;
    const active = data.segments.find(cue => t >= cue.start && t < cue.end);
    const id = active?.id || null;
    playhead.style.left = `${Math.min(100, t / data.duration * 100)}%`;
    document.getElementById('time-display').textContent = `${timeText(t)} / ${timeText(data.duration)}`;
    if (id === previousId) return;
    if (previousId) {
      cueButtons.get(previousId).setAttribute('aria-current', 'false');
      timelineButtons.get(previousId).setAttribute('aria-pressed', 'false');
    }
    previousId = id;
    document.getElementById('current-id').textContent = active ? active.id : '原声 / 间隙';
    document.getElementById('current-text').textContent = active ? active.text : '当前没有安排新增口述。';
    if (active) {
      const button = cueButtons.get(id);
      button.setAttribute('aria-current', 'true');
      timelineButtons.get(id).setAttribute('aria-pressed', 'true');
      const top = button.offsetTop - cueList.offsetTop;
      if (top < cueList.scrollTop || top + button.offsetHeight > cueList.scrollTop + cueList.clientHeight) {
        cueList.scrollTop = Math.max(0, top - cueList.clientHeight / 3);
      }
    }
  }
  video.addEventListener('timeupdate', updatePlayback);
  video.addEventListener('seeked', updatePlayback);
  video.addEventListener('play', () => audio.pause());
  audio.addEventListener('play', () => video.pause());
  document.querySelectorAll('[data-seek]').forEach(button => button.addEventListener('click', () => seek(Number(button.dataset.seek), true)));

  const captionToggle = document.getElementById('caption-toggle');
  captionToggle.addEventListener('click', () => {
    const enabled = captionToggle.getAttribute('aria-pressed') !== 'true';
    captionToggle.setAttribute('aria-pressed', String(enabled));
    captionToggle.textContent = enabled ? '隐藏新增口述字幕' : '显示新增口述字幕';
    if (video.textTracks[0]) video.textTracks[0].mode = enabled ? 'showing' : 'disabled';
  });
  document.getElementById('load-source').addEventListener('click', () => {
    video.pause(); audio.pause();
    const iframe = element('iframe');
    iframe.title = '创作者原片：Your Good Old Days are Happening Now';
    iframe.src = 'https://www.youtube-nocookie.com/embed/xtA741ReayA';
    iframe.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    document.getElementById('source-embed').replaceChildren(iframe);
  });

  const factBody = document.getElementById('fact-body');
  const episodeLookup = new Map(data.episodes.map(episode => [episode.id, episode]));
  const factRows = [];
  data.facts.forEach(fact => {
    const episode = episodeLookup.get(fact.episode_id);
    const row = element('tr');
    const status = fact.coverage === 1 ? 'full' : fact.coverage === .5 ? 'partial' : 'missing';
    row.dataset.status = status;
    const idCell = element('td');
    idCell.append(element('span', '', fact.fact_id));
    const timeButton = element('button', '', `${timeText(episode.reference_start_seconds_locator_only)} ↗`);
    timeButton.type = 'button';
    timeButton.setAttribute('aria-label', `跳转至参考事件约${timeText(episode.reference_start_seconds_locator_only)}`);
    timeButton.addEventListener('click', () => seek(episode.reference_start_seconds_locator_only, true));
    idCell.append(timeButton);
    const targetCell = element('td', '', fact.reference_fact);
    const scoreCell = element('td');
    scoreCell.append(element('span', `status ${status}`, statusLabels[status]));
    const evidenceCell = element('td');
    fact.candidate_cues.forEach(cue => {
      const line = element('span', 'candidate-text');
      const cueButton = element('button', '', `${timeText(cue.start)} · ${cue.text}`);
      cueButton.type = 'button';
      cueButton.addEventListener('click', () => seek(cue.start, true));
      line.append(cueButton);
      evidenceCell.append(line);
    });
    evidenceCell.append(element('p', 'fact-reason', fact.reason_zh));
    row.append(idCell, targetCell, scoreCell, evidenceCell);
    factBody.append(row);
    factRows.push(row);
  });
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    let count = 0;
    factRows.forEach(row => {
      row.hidden = filter !== 'all' && row.dataset.status !== filter;
      if (!row.hidden) count++;
    });
    document.getElementById('fact-count').textContent = `显示${count}项`;
  }));
})();
