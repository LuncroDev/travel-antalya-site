/* Travel Antalya map. Leaflet + OpenStreetMap, loaded only when the map nears the viewport. */
(function () {
  var el = document.getElementById('ta-map');
  var dataEl = document.getElementById('ta-map-data');
  if (!el || !dataEl) return;
  var data; try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
  el.style.height = (el.getAttribute('data-height') || 640) + 'px';

  function load() {
    var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/js/vendor/leaflet/leaflet.css'; document.head.appendChild(css);
    var s = document.createElement('script'); s.src = '/js/vendor/leaflet/leaflet.js'; s.onload = init; document.head.appendChild(s);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); load(); } }, { rootMargin: '400px' });
    io.observe(el);
  } else load();


  var SVG = {
    bed: '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.7"/>',
    food: '<path d="M6 3v6a2 2 0 0 0 4 0V3M8 11v10M17 21V3c-2.2 1.2-3 4-3 8h3"/>',
    beach: '<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v7a2 2 0 0 1-4 0"/>',
    ruins: '<path d="M4 21h16M6 18h12M8 18V9M12 18V9M16 18V9M4 9h16L12 4z"/>',
    nature: '<path d="M12 21v-5M12 3l5 7h-3l4 6H6l4-6H7z"/>',
    adventure: '<path d="M2 20l6-11 4 7 3-4 7 8z"/>',
    golf: '<path d="M8 21V3l9 4-9 4M5 21h6"/>',
    place: '<path d="M12 21s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10z"/><circle cx="12" cy="11" r="2"/>'
  };
  function kindOf(p) {
    if (p.type === 'beach') return ['beach', 'beach'];
    if (p.type === 'hotel') return ['bed', 'hotel'];
    if (p.type === 'restaurant') return ['food', 'food'];
    if (p.type === 'golf') return ['golf', 'golf'];
    var c = (p.cat || '').toLowerCase();
    if (/ruin|histor|museum|old town|castle/.test(c)) return ['ruins', 'history'];
    if (/nature|park|garden|waterfall|canyon/.test(c)) return ['nature', 'nature'];
    if (/advent|tour|cable/.test(c)) return ['adventure', 'adventure'];
    return ['place', 'thing'];
  }
  function icon(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + SVG[k] + '</svg>'; }

  function esc(t) { var d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

  function init() {
    var L = window.L;
    var map = L.map(el, { scrollWheelZoom: false, zoomControl: true }).setView([36.78, 30.95], 9);
    map.once('focus', function () { map.scrollWheelZoom.enable(); });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);

    var layers = { areas: L.layerGroup(), beach: L.layerGroup(), thing: L.layerGroup(), featured: L.layerGroup() };
    var markers = [];

    function pin(cls, html, ll, label) {
      return L.marker(ll, { title: label, keyboard: true, icon: L.divIcon({ className: 'ta-pin-wrap', html: '<span class="ta-pin ' + cls + '"><i>' + html + '</i></span>', iconSize: [34, 40], iconAnchor: [17, 38], popupAnchor: [0, -34] }) });
    }

    data.areas.forEach(function (a) {
      var total = a.counts.hotel + a.counts.restaurant + a.counts.golf;
      var h = '<div class="ta-pop"><p class="ta-pop-kicker">Area ' + a.n + '</p><h3>' + esc(a.label) + '</h3><p>' +
        [a.counts.hotel ? plural(a.counts.hotel, 'hotel') : '', a.counts.restaurant ? plural(a.counts.restaurant, 'restaurant') : '', a.counts.golf ? plural(a.counts.golf, 'golf club') : ''].filter(Boolean).join(' · ') + '</p>';
      if (a.featured.length) {
        h += '<ul class="ta-pop-feat">' + a.featured.map(function (f) { return '<li><span class="feat-tag">' + esc(f.label) + '</span> <a href="' + esc(f.url) + '">' + esc(f.title) + '</a></li>'; }).join('') + '</ul>';
      }
      h += '<p class="ta-pop-links">';
      if (a.counts.hotel) h += '<a href="/hotels/' + (a.hotelArea ? '?area=' + encodeURIComponent(a.hotelArea) : '') + '">Hotels</a>';
      if (a.counts.restaurant) h += '<a href="/restaurants/?q=' + encodeURIComponent(a.label.split(' ')[0]) + '">Restaurants</a>';
      if (a.counts.golf) h += '<a href="/golf/">Golf</a>';
      h += '</p></div>';
      var m = pin('ta-pin-area', String(a.n), [a.lat, a.lng], a.label).bindPopup(h);
      layers.areas.addLayer(m); markers.push({ g: 'areas', id: 'a' + a.id, m: m, ll: [a.lat, a.lng], title: a.n + '. ' + a.label });
    });

    data.places.forEach(function (p, i) {
      var k = kindOf(p);
      var g = p.sponsored ? 'featured' : (p.type === 'beach' ? 'beach' : 'thing');
      var cls = p.sponsored ? 'ta-pin-star' : 'ta-k-' + k[1];
      var h = '<div class="ta-pop">' + (p.sponsored ? '<p class="ta-pop-kicker"><span class="feat-tag">' + esc(p.label) + '</span></p>' : '<p class="ta-pop-kicker">' + esc(p.cat || 'Place') + '</p>') +
        '<h3>' + esc(p.title) + '</h3><p class="ta-pop-links"><a href="' + esc(p.url) + '">Read the guide</a></p></div>';
      var m = pin(cls, icon(k[0]), [p.lat, p.lng], p.title).bindPopup(h);
      layers[g].addLayer(m); markers.push({ g: g, id: 'p' + i, m: m, ll: [p.lat, p.lng], title: p.title });
    });

    layers.areas.addTo(map); layers.beach.addTo(map); layers.thing.addTo(map); layers.featured.addTo(map);

    var all = markers.map(function (x) { return x.ll; });
    if (all.length) map.fitBounds(L.latLngBounds(all).pad(0.08));

    // Miami-style layer menu
    var defs = [
      { g: 'areas', label: 'Areas & neighborhoods', cls: 'ta-dot-area' },
      { g: 'beach', label: 'Beaches', cls: 'ta-dot-beach' },
      { g: 'thing', label: 'Things to do', cls: 'ta-dot-thing' },
      { g: 'featured', label: 'Featured places', cls: 'ta-dot-star' }
    ];
    var menu = document.createElement('div'); menu.className = 'ta-menu leaflet-control';
    L.DomEvent.disableClickPropagation(menu); L.DomEvent.disableScrollPropagation(menu);
    defs.forEach(function (d) {
      var items = markers.filter(function (x) { return x.g === d.g; });
      if (!items.length && d.g !== 'featured') return;
      var box = document.createElement('div'); box.className = 'ta-menu-group';
      var head = document.createElement('div'); head.className = 'ta-menu-head';
      var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = true; cb.id = 'tam-' + d.g; cb.setAttribute('aria-label', 'Show ' + d.label);
      var btn = document.createElement('button'); btn.type = 'button'; btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<span class="ta-dot ' + d.cls + '"></span>' + esc(d.label) + ' (' + items.length + ')<span class="ta-caret" aria-hidden="true"></span>';
      var list = document.createElement('ul'); list.hidden = true;
      if (!items.length) { var li0 = document.createElement('li'); li0.className = 'ta-empty'; li0.textContent = 'Opening soon'; list.appendChild(li0); }
      items.forEach(function (it) {
        var li = document.createElement('li'); var b = document.createElement('button'); b.type = 'button';
        b.textContent = it.title;
        b.addEventListener('click', function () { map.flyTo(it.ll, Math.max(map.getZoom(), 11), { duration: .6 }); it.m.openPopup(); });
        li.appendChild(b); list.appendChild(li);
      });
      btn.addEventListener('click', function () { var o = list.hidden; list.hidden = !o; btn.setAttribute('aria-expanded', String(o)); box.classList.toggle('open', o); });
      cb.addEventListener('change', function () { if (cb.checked) layers[d.g].addTo(map); else map.removeLayer(layers[d.g]); });
      head.appendChild(cb); head.appendChild(btn); box.appendChild(head); box.appendChild(list); menu.appendChild(box);
    });
    var Ctl = L.Control.extend({ options: { position: 'topleft' }, onAdd: function () { return menu; } });
    new Ctl().addTo(map);
  }
})();
