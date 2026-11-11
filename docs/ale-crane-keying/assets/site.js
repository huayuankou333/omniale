'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const videos = [$('compare-source'), $('compare-sol'), $('compare-terra')];
  const source = videos[0], slider = $('compare-time'), play = $('play-toggle');
  const selectors = {sol: $('sol-run'), terra: $('terra-run')};
  let report, running = false, changing = false, timer = 0;
  const duration = () => Number.isFinite(source.duration) ? source.duration : 10.041667;
  const fmt = (n, digits = 6) => Number(n).toFixed(digits);
  const element = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  function pause() {
    running = false;
    videos.forEach(v => v.pause());
    play.textContent = '同步播放';
    cancelAnimationFrame(timer);
    updateClock();
  }
  function updateClock() {
    const time = source.currentTime || 0;
    slider.max = Math.max(0, duration() - 1 / 24);
    slider.value = Math.min(time, Number(slider.max));
    $('compare-clock').textContent = `${fmt(time, 3)} / ${fmt(duration(), 3)} s`;
  }
  function setTime(video, time) {
    if (video.readyState >= 1) {
      const max = Number.isFinite(video.duration) ? video.duration - 1 / 24 : 10;
      video.currentTime = Math.max(0, Math.min(time, max));
    } else {
      video.addEventListener('loadedmetadata', () => setTime(video, time), {once: true});
    }
  }
  function seek(time) {
    pause();
    videos.forEach(v => setTime(v, time));
    slider.value = time;
    $('compare-clock').textContent = `${fmt(time, 3)} / ${fmt(duration(), 3)} s`;
  }
  function tick() {
    if (!running) return;
    if (source.ended || source.currentTime >= duration() - 0.015) { pause(); return; }
    videos.slice(1).forEach(v => {
      if (v.readyState >= 2 && Math.abs(v.currentTime - source.currentTime) > 0.085) setTime(v, source.currentTime);
    });
    updateClock();
    timer = requestAnimationFrame(tick);
  }
  async function start() {
    if (changing) return;
    if (source.currentTime >= duration() - 0.07) seek(0);
    videos.slice(1).forEach(v => setTime(v, source.currentTime));
    play.disabled = true;
    const results = await Promise.allSettled(videos.map(v => v.play()));
    play.disabled = false;
    if (results.some(r => r.status === 'rejected')) {
      pause();
      $('compare-status').textContent = '浏览器尚未准备好全部视频，请稍候重试；也可下载原始 MP4 查看。';
      return;
    }
    $('compare-status').textContent = '';
    running = true;
    play.textContent = '同步暂停';
    tick();
  }
  function chooseRun(short, id) {
    const time = source.currentTime || 0;
    pause();
    selectors[short].value = id;
    const video = $(`compare-${short}`);
    const record = report?.runs.find(r => r.id === id);
    video.poster = `runs/${id}/poster.jpg`;
    video.src = `runs/${id}/output.mp4`;
    changing = true;
    play.disabled = true;
    const done = () => {changing = false; play.disabled = false;};
    video.addEventListener('loadedmetadata', () => {setTime(video, time); done();}, {once: true});
    video.addEventListener('error', done, {once: true});
    video.load();
    if (record) $(`${short}-caption`).textContent = `轮次 ${record.trial} · ${fmt(record.native_score)} / 1`;
  }
  play.addEventListener('click', () => running ? pause() : start());
  $('restart').addEventListener('click', () => seek(0));
  slider.addEventListener('input', () => seek(Number(slider.value)));
  source.addEventListener('loadedmetadata', updateClock);
  source.addEventListener('seeked', updateClock);
  source.addEventListener('ended', pause);
  document.querySelectorAll('[data-seek]').forEach(b => b.addEventListener('click', () => seek(Number(b.dataset.seek))));
  for (const short of ['sol', 'terra']) selectors[short].addEventListener('change', e => chooseRun(short, e.target.value));
  function showScore(id) {
    const run = report.runs.find(r => r.id === id);
    if (!run) return;
    $('score-run').value = id;
    $('score-overview').textContent = `五帧均值 ${fmt(run.native_score)} / 1`;
    $('score-json').href = `runs/${id}/score.json`;
    $('judge-json').href = `runs/${id}/judge-responses.json`;
    const rows = [], pictures = [], judgments = [];
    for (const frame of run.frames) {
      const row = document.createElement('tr');
      [ `${frame.time_sec} s`, fmt(frame.roi_input_cv), fmt(frame.soft_frame_score, 4),
        fmt(frame.full_frame_edge_iou), fmt(frame.roi_edge_iou),
        frame.roi_input_gate_passed && frame.soft_gate_passed ? '通过 / 通过' : '未通过',
        fmt(frame.final_frame_score)
      ].forEach((text, i) => row.append(element('td', text, i ? 'num' : '')));
      rows.push(row);
      const figure = document.createElement('figure');
      const a = document.createElement('a');
      a.href = `runs/${id}/frame-${frame.time_sec}.jpg`;
      const image = document.createElement('img');
      image.src = a.href;
      image.loading = 'lazy';
      image.alt = `${run.model} 第 ${run.trial} 轮，${frame.time_sec} 秒正式成片帧`;
      a.append(image);
      figure.append(a, element('figcaption', `${frame.time_sec} s · 帧分 ${fmt(frame.final_frame_score, 4)}`));
      pictures.push(figure);
      const judge = run.soft_evaluations.find(e => e.identifier === frame.identifier);
      if (judge) {
        const details = document.createElement('details');
        details.append(element('summary', `${frame.time_sec} s · 原始三项软判断与裁判说明`));
        const answers = element('div', undefined, 'checklist');
        const labels = {real_keying_edit_done: '做了实际抠像', not_raw_input_copy: '不是原片拷贝', foreground_subject_preserved: '主体合理保留'};
        for (const [key, value] of Object.entries(judge.checklist_answers)) answers.append(element('span', `${labels[key] || key}：${value}`, value === 'YES' ? 'ok' : 'fail'));
        details.append(answers, element('p', judge.summary, 'judge-summary'));
        judgments.push(details);
      }
    }
    $('frame-scores').replaceChildren(...rows);
    $('score-frames').replaceChildren(...pictures);
    $('judge-details').replaceChildren(...judgments);
  }
  $('score-run').addEventListener('change', e => {if (report) showScore(e.target.value);});
  document.querySelectorAll('[data-compare]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.compare;
    chooseRun(id.split('-')[0], id);
    if (report) showScore(id);
    $('compare').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }));
  fetch('data/report.json').then(r => {if (!r.ok) throw Error(r.status); return r.json();}).then(data => {
    report = data;
    showScore('sol-1');
    $('data-status').textContent = '';
  }).catch(() => {
    $('data-status').textContent = '数值数据暂时未载入，可下载原始 score.json 与完整结果查看。';
    $('data-status').classList.add('error-message');
  });
})();
