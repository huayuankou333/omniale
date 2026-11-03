(() => {
  function revealRubric() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!/^rubric-(?:T\d\d|C\d\d|V\d\d|R\d\d|E\d\d|L\d\d)$/.test(id)) return;
    const detail = document.getElementById(id);
    if (!detail || detail.tagName !== 'DETAILS') return;
    detail.open = true;
    requestAnimationFrame(() => detail.scrollIntoView({block: 'start'}));
  }
  window.addEventListener('hashchange', revealRubric);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#rubric-"]');
    if (link && link.hash === location.hash) revealRubric();
  });
  revealRubric();
})();
