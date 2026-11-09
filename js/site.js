(() => {
  const menu = document.querySelector('.mobile-menu-toggle');
  const nav = document.getElementById('mainNavLinks');
  if (!menu || !nav) return;
  const close = () => { nav.classList.remove('nav-open'); menu.setAttribute('aria-expanded', 'false'); };
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; nav.classList.toggle('nav-open', open); menu.setAttribute('aria-expanded', String(open)); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { close(); menu.focus(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.site-header')) close(); });
  nav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  window.matchMedia('(min-width: 1001px)').addEventListener('change', close);
  nav.querySelectorAll('a').forEach(a => { if (a.pathname === location.pathname || a.pathname !== '/' && location.pathname.startsWith(a.pathname)) a.setAttribute('aria-current', 'page'); });
})();
