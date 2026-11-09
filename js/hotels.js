(() => {
  'use strict';
  const form = document.getElementById('hotel-filters');
  if (!form) return;
  const cards = Array.from(document.querySelectorAll('[data-hotel]'));
  const search = document.getElementById('hotel-search');
  const area = document.getElementById('hotel-area');
  const type = document.getElementById('hotel-type');
  const result = document.getElementById('hotel-results');
  const empty = document.getElementById('hotel-empty');
  // Turkish names also match a Latin keyboard: Kaş/kas, Kaleiçi/kaleici.
  const normalize = (value) => value.toLowerCase().replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const entries = cards.map((card) => ({card, text: normalize((card.querySelector('[data-search-text]') || card).textContent)}));
  function filter(updateUrl = true) {
    const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let count = 0;
    entries.forEach(({card, text}) => {
      const matches = (!area.value || card.dataset.area === area.value)
        && (!type.value || card.dataset.type === type.value)
        && words.every((word) => text.includes(word));
      card.hidden = !matches;
      if (matches) count++;
    });
    result.textContent = `Showing ${count} of ${cards.length} hotels`;
    empty.hidden = count !== 0;
    if (updateUrl) {
      const url = new URL(location.href);
      for (const [key, value] of [['q', search.value], ['area', area.value], ['type', type.value]]) value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
      history.replaceState(null, '', url);
    }
  }
  form.hidden = false;
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', filter);
  form.addEventListener('change', filter);
  form.addEventListener('reset', () => { window.setTimeout(filter, 0); });
  document.getElementById('hotel-reset-empty').addEventListener('click', () => {
    form.reset();
    search.focus();
  });
  function fromUrl() {
    const params = new URLSearchParams(location.search);
    search.value = params.get('q') || '';
    area.value = params.get('area') || '';
    type.value = params.get('type') || '';
    filter(false);
  }
  window.addEventListener('popstate', fromUrl);
  fromUrl();
})();
