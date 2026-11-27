const models = {
  sol: { name: 'GPT-6.2 Sol', total: 39 },
  luna: { name: 'GPT-6 Luna', total: 26 },
};
const modelSelect = document.querySelector('#model');
const pageSelect = document.querySelector('#page');
const preview = document.querySelector('#pdf-preview');
const caption = document.querySelector('#page-caption');
const previous = document.querySelector('#prev');
const next = document.querySelector('#next');
const openPage = document.querySelector('#open-page');
const count = document.querySelector('#page-count');
let currentModel;

function showPage(model, page) {
  const { name, total } = models[model];
  if (model !== currentModel) {
    const options = Array.from({ length: total }, (_, index) => new Option(index + 1, index + 1));
    pageSelect.replaceChildren(...options);
    currentModel = model;
  }
  const label = `${name} · 第 ${page} / ${total} 页`;
  modelSelect.value = model;
  pageSelect.value = page;
  count.textContent = `/ ${total}`;
  previous.disabled = page === 1;
  next.disabled = page === total;
  openPage.href = `records/${model}/tutorial.pdf#page=${page}`;
  caption.textContent = label;
  preview.alt = label;
  preview.src = `pages/${model}-${String(page).padStart(2, '0')}.webp`;
}

modelSelect.addEventListener('change', () => showPage(modelSelect.value, 1));
pageSelect.addEventListener('change', () => showPage(modelSelect.value, Number(pageSelect.value)));
previous.addEventListener('click', () => showPage(modelSelect.value, Number(pageSelect.value) - 1));
next.addEventListener('click', () => showPage(modelSelect.value, Number(pageSelect.value) + 1));
for (const link of document.querySelectorAll('[data-preview]')) {
  link.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    const [model, page] = link.dataset.preview.split(':');
    showPage(model, Number(page));
    modelSelect.focus({ preventScroll: true });
    document.querySelector('.viewer').scrollIntoView();
  });
}
showPage('sol', 1);
document.querySelector('.viewer-tools').hidden = false;
