const labels={execution:'执行',interaction:'交互与状态',visual:'视觉',usability:'可用性'};
const escapeHTML=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(filter='all'){
 document.getElementById('checklist').innerHTML=window.CHECKLIST.items.filter(i=>filter==='all'||i.category===filter).map(i=>`<details><summary><span class="item-id">${i.id}</span><span class="item-title">${escapeHTML(i.title)}</span><span class="item-cat">${labels[i.category]}</span><span class="item-weight">${i.weight} 分 ＋</span></summary><div class="item-body"><ul>${i.assertions.map(a=>`<li>${escapeHTML(a.claim)}</li>`).join('')}</ul><small>场景 ${i.scenario} · ${'start_seconds' in i.evidence_anchor?`录屏 ${i.evidence_anchor.start_seconds}–${i.evidence_anchor.end_seconds} 秒`:'公开任务约定'} · 每个断言均分本项权重</small></div></details>`).join('');
}
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');render(b.dataset.filter)}));
document.querySelectorAll('[data-time]').forEach(b=>b.addEventListener('click',()=>{document.getElementById('demo').currentTime=Number(b.dataset.time);document.querySelectorAll('[data-time]').forEach(x=>x.classList.remove('active'));b.classList.add('active')}));
const names={'gpt-6-luna':'GPT-6-Luna','glm-5.3':'GLM-5.3','kimi-k3':'Kimi-K3','gpt-6.1-sol':'GPT-6.1-Sol'};
document.getElementById('models').innerHTML=window.RESULTS.models.map(m=>`<article class="model"><b>${names[m.model]}</b><strong>—</strong><small>未运行 · 没有可报告成绩</small></article>`).join('');render();
