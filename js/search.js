(function (root) {
  const normalize = value => String(value || '').toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (typeof module === 'object' && module.exports) module.exports = { normalize };
  if (!root.document) return;
  const page = document.querySelector('[data-search-page]');
  if (!page) return;
  const form = page.querySelector('form'), query = form.elements.q, type = form.elements.type;
  const items = Array.from(page.querySelectorAll('[data-search-item]')).map(el => ({ el, text: normalize(el.textContent) }));
  const render = (updateUrl = false) => {
    const words = normalize(query.value).trim().split(/\s+/).filter(Boolean);
    let count = 0;
    items.forEach(({ el, text }) => { const match = (!type.value || type.value === el.dataset.type) && words.every(word => text.includes(word)); el.hidden = !match; if (match) count++; });
    document.getElementById('search-count').textContent = `${count} ${count === 1 ? 'result' : 'results'}${query.value.trim() ? ` for “${query.value.trim()}”` : ''}`;
    document.getElementById('search-empty').hidden = count > 0;
    if (updateUrl) { const url = new URL(location.href); ['q','type'].forEach(key => { const val = form.elements[key].value.trim(); val ? url.searchParams.set(key, val) : url.searchParams.delete(key); }); history.replaceState(null, '', url); }
  };
  const fromUrl = () => { const params = new URLSearchParams(location.search); query.value = params.get('q') || ''; type.value = params.get('type') || ''; render(); };
  form.addEventListener('submit', e => { e.preventDefault(); render(true); });
  form.addEventListener('input', () => render(true));
  form.addEventListener('change', () => render(true));
  form.addEventListener('reset', () => { setTimeout(() => render(true), 0); });
  window.addEventListener('popstate', fromUrl); fromUrl();
})(typeof window === 'undefined' ? globalThis : window);
