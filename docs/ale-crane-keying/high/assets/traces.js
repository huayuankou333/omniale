'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const runSelect = $('trace-run'), actions = $('trace-action'), search = $('trace-search'), errors = $('trace-errors');
  let events = [], metadata, requestVersion = 0;
  const element = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  function fillBody(details, event) {
    if (details.dataset.filled) return;
    details.dataset.filled = '1';
    const body = element('div');
    body.append(element('p', event.arguments?.reason || '未提供操作理由', 'reason'));
    body.append(element('p', `记录时间：${event.at_local || '未记录'}`, 'event-time'));
    const permalink = element('a', '此步骤链接 ↗');
    permalink.href = `?run=${runSelect.value}#event-${event.tool_call}`;
    body.append(permalink, element('h4', '实际参数'), element('pre', JSON.stringify(event.arguments?.params || {}, null, 2)));
    body.append(element('h4', '工具返回结果'), element('pre', JSON.stringify(event.result, null, 2)));
    if (event.observations?.length) {
      body.append(element('h4', `当时可见的真实观察图 · ${event.observations.length} 张`));
      const grid = element('div', undefined, 'observation-grid');
      for (const observation of event.observations) {
        const figure = element('figure'), link = element('a'), img = document.createElement('img');
        link.href = observation.src;
        link.target = '_blank'; link.rel = 'noopener';
        img.src = observation.src; img.loading = 'lazy';
        const time = observation.time == null ? '' : ` · ${observation.time} s`;
        const crop = observation.crop ? ` · 裁切 ${JSON.stringify(observation.crop)}` : '';
        img.alt = `工具 #${event.tool_call} 的实际观察图${time}${crop}`;
        link.append(img);
        figure.append(link, element('figcaption', `${observation.source || '工具观察'}${time}${crop}`));
        grid.append(figure);
      }
      body.append(grid);
    }
    details.append(body);
  }
  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const filtered = events.filter(e => (!actions.value || e.action === actions.value) && (!errors.checked || e.failed) && (!query || e.searchText.includes(query)));
    const children = filtered.map(event => {
      const details = element('details', undefined, 'event');
      details.id = `event-${event.tool_call}`;
      const summary = element('summary');
      summary.append(element('span', `#${event.tool_call} · API ${event.api_request}`, 'event-title'));
      summary.append(' ', element('span', event.action, 'event-tag'));
      if (event.failed) summary.append(element('span', '工具错误', 'event-tag bad'));
      if (event.observations?.length) summary.append(element('span', `${event.observations.length} 张观察图`, 'note'));
      const reason = event.arguments?.reason || '';
      summary.append(document.createElement('br'), element('span', reason.length > 145 ? reason.slice(0, 145) + '…' : reason));
      details.append(summary);
      details.addEventListener('toggle', () => {if (details.open) fillBody(details, event);});
      return details;
    });
    $('events').replaceChildren(...children);
    $('trace-status').textContent = filtered.length ? `显示 ${filtered.length} / ${events.length} 条工具记录` : '没有符合条件的记录，请调整筛选。';
  }
  function openHash() {
    if (!/^#event-\d+$/.test(location.hash)) return;
    const target = document.getElementById(location.hash.slice(1));
    if (target) {
      target.open = true;
      const event = events.find(e => `event-${e.tool_call}` === target.id);
      if (event) fillBody(target, event);
      requestAnimationFrame(() => target.scrollIntoView());
    }
  }
  async function load(id) {
    const version = ++requestVersion;
    $('trace-status').textContent = '载入轨迹…';
    $('events').replaceChildren();
    runSelect.value = id;
    try {
      const response = await fetch(`runs/${id}/tool-trace.json`);
      if (!response.ok) throw Error(response.status);
      const data = await response.json();
      if (version !== requestVersion) return;
      metadata = data;
      events = data.events.map(event => ({...event, searchText: JSON.stringify(event).toLocaleLowerCase()}));
      actions.replaceChildren(element('option', '全部动作'));
      actions.firstChild.value = '';
      for (const action of [...new Set(events.map(e => e.action))].sort()) {
        const option = element('option', `${action} (${events.filter(e => e.action === action).length})`);
        option.value = action; actions.append(option);
      }
      const images = events.reduce((n, e) => n + (e.observations?.length || 0), 0);
      $('trace-meta').textContent = `${metadata.model} · 第 ${metadata.trial} 轮 · ${events.length} 次工具调用 · ${images} 张观察图 · ${events.filter(e => e.failed).length} 次显式工具错误`;
      $('trace-json').href = `runs/${id}/tool-trace.json`;
      $('trace-score').href = `runs/${id}/score.json`;
      $('trace-video').href = `runs/${id}/output.mp4`;
      render(); openHash();
    } catch (error) {
      if (version === requestVersion) {
        $('trace-status').textContent = '轨迹载入失败，可通过 JSON 链接下载原记录后查看。';
        $('trace-status').classList.add('error-message');
      }
    }
  }
  runSelect.addEventListener('change', () => {
    search.value = ''; errors.checked = false;
    history.replaceState(null, '', `?run=${runSelect.value}`);
    load(runSelect.value);
  });
  actions.addEventListener('change', render); errors.addEventListener('change', render);
  search.addEventListener('input', render);
  $('expand-all').addEventListener('click', () => document.querySelectorAll('.event').forEach(d => {d.open = true;}));
  $('collapse-all').addEventListener('click', () => document.querySelectorAll('.event').forEach(d => {d.open = false;}));
  window.addEventListener('hashchange', openHash);
  const requested = new URLSearchParams(location.search).get('run');
  const initial = [...runSelect.options].some(o => o.value === requested) ? requested : 'sol-1';
  load(initial);
})();
