/* Click a photo on a detail page to see it large. Arrows/swipe/keys move between photos. */
(function () {
  var SEL = '.detail-gallery figure img, .editorial-photo img, .page-hero-media img';
  var imgs = Array.prototype.slice.call(document.querySelectorAll(SEL));
  if (!imgs.length) return;
  var box, big, cap, idx = 0, opener = null, startX = null;

  function full(img) {
    var s = img.currentSrc || img.src;
    return s.replace(/-\d+\.webp(\?.*)?$/, '-1280.webp');
  }
  function build() {
    box = document.createElement('div');
    box.className = 'lb'; box.hidden = true;
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Photo viewer');
    box.innerHTML = '<button class="lb-close" type="button" aria-label="Close photo">×</button>' +
      '<button class="lb-nav lb-prev" type="button" aria-label="Previous photo">‹</button>' +
      '<figure class="lb-fig"><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lb-nav lb-next" type="button" aria-label="Next photo">›</button>';
    document.body.appendChild(box);
    big = box.querySelector('img'); cap = box.querySelector('figcaption');
    box.addEventListener('click', function (e) { if (e.target === box || e.target.classList.contains('lb-fig')) close(); });
    box.querySelector('.lb-close').addEventListener('click', close);
    box.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    box.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (startX === null) return; var dx = e.changedTouches[0].clientX - startX; startX = null;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    });
  }
  function show(i) {
    idx = (i + imgs.length) % imgs.length;
    var img = imgs[idx], src = full(img);
    big.onerror = function () { big.onerror = null; big.src = img.currentSrc || img.src; };
    big.src = src; big.alt = img.alt || '';
    var fc = img.closest('figure') && img.closest('figure').querySelector('figcaption');
    cap.textContent = fc ? fc.textContent.trim() : (img.alt || '');
    var many = imgs.length > 1;
    box.querySelector('.lb-prev').hidden = !many; box.querySelector('.lb-next').hidden = !many;
  }
  function open(i, from) {
    if (!box) build();
    opener = from; show(i); box.hidden = false;
    document.documentElement.classList.add('lb-open');
    box.querySelector('.lb-close').focus();
  }
  function close() {
    if (!box || box.hidden) return;
    box.hidden = true; big.removeAttribute('src');
    document.documentElement.classList.remove('lb-open');
    if (opener) opener.focus();
  }
  document.addEventListener('keydown', function (e) {
    if (!box || box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'Tab') {
      var f = box.querySelectorAll('button:not([hidden])'); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  imgs.forEach(function (img, i) {
    img.classList.add('lb-target'); img.tabIndex = 0; img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Enlarge photo' + (img.alt ? ': ' + img.alt : ''));
    img.addEventListener('click', function () { open(i, img); });
    img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i, img); } });
  });
})();
