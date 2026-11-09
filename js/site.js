(() => {
  'use strict';
  const doc = document;
  const header = doc.querySelector('.site-header');
  const menu = doc.querySelector('.mobile-menu-toggle');
  const nav = doc.getElementById('mainNavLinks');

  /* Mobile drawer */
  if (menu && nav) {
    const close = () => {
      nav.classList.remove('nav-open');
      doc.body.classList.remove('menu-open');
      menu.setAttribute('aria-expanded', 'false');
    };
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      nav.classList.toggle('nav-open', open);
      doc.body.classList.toggle('menu-open', open);
      menu.setAttribute('aria-expanded', String(open));
    });
    doc.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (menu.getAttribute('aria-expanded') === 'true') { close(); menu.focus(); }
      closeMegas();
    });
    doc.addEventListener('click', e => { if (!e.target.closest('.site-header')) { close(); closeMegas(); } });
    if (window.matchMedia) {
      const mq = window.matchMedia('(min-width: 1181px)');
      if (mq.addEventListener) mq.addEventListener('change', close);
    }
    nav.querySelectorAll('a').forEach(a => {
      const p = a.pathname;
      if (a.classList.contains('nav-link') && p !== '/' && location.pathname.startsWith(p)) a.setAttribute('aria-current', 'page');
    });
  }

  /* Mega menu toggles (touch, keyboard, mobile accordion) */
  const items = Array.from(doc.querySelectorAll('.nav-item'));
  function closeMegas(except) {
    items.forEach(li => {
      if (li === except) return;
      li.classList.remove('is-open');
      const b = li.querySelector('.mega-toggle');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  items.forEach(li => {
    const btn = li.querySelector('.mega-toggle');
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = !li.classList.contains('is-open');
      closeMegas(li);
      li.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* Header shadow once the page scrolls */
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* "Read more" for long intro text */
  doc.querySelectorAll('[data-readmore]').forEach(box => {
    const text = box.querySelector('.intro-text');
    const btn = box.querySelector('.readmore-btn');
    if (!text || !btn) return;
    if (text.scrollHeight <= text.clientHeight + 8) return;
    btn.hidden = false;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      box.classList.toggle('is-expanded', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Read less' : 'Read more';
    });
  });

  /* Reading progress (articles) */
  const bar = doc.querySelector('.read-progress span');
  const article = doc.querySelector('.article-body');
  if (bar && article) {
    const upd = () => { const r = article.getBoundingClientRect(); const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight))); bar.style.transform = `scaleX(${p})`; };
    window.addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* Gentle reveal on scroll for figures and cards */
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const els = doc.querySelectorAll('.article-figure, .card-grid > .card, .row-list > .row-card');
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => { if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('reveal'); io.observe(el); } });
  }

  /* Horizontal scrollers: arrow buttons */
  doc.querySelectorAll('[data-scroller]').forEach(wrap => {
    const track = wrap.querySelector('.scroller-track');
    wrap.querySelectorAll('[data-dir]').forEach(b => b.addEventListener('click', () => {
      track.scrollBy({ left: Number(b.dataset.dir) * track.clientWidth * 0.8, behavior: 'smooth' });
    }));
  });
})();
