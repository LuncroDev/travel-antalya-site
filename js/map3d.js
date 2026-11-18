/* Travel Antalya 3D map. MapLibre GL + OpenFreeMap vector tiles (OpenStreetMap data), restyled in soft pastel "isometric" colours. */
(function () {
  var T = window.TAMap, ml = window.maplibregl, el = document.getElementById('ta-map3d');
  if (!T || !ml || !el) return;
  var data = T.data;

  var map;
  try {
    map = new ml.Map({
      container: el,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [30.7056, 36.8841], zoom: 14.4, pitch: 58, bearing: -28,
      maxPitch: 72, minZoom: 7.5, maxZoom: 18.5,
      maxBounds: [[28.6, 35.6], [33.2, 37.8]],
      attributionControl: { compact: true }, cooperativeGestures: false
    });
  } catch (e) { T.fail3d && T.fail3d(); return; }
  T.m3 = map;
  var failed = false;
  map.on('error', function (ev) {
    if (failed || map.loaded()) return;
    var msg = ev && ev.error && String(ev.error.message || '');
    if (/style|webgl|context/i.test(msg || '')) { failed = true; T.fail3d && T.fail3d(); }
  });

  map.addControl(new ml.NavigationControl({ visualizePitch: true }), 'top-right');

  // Pastel "isometric toy city" palette
  var C = { land: '#F4ECDD', water: '#8ED1E6', park: '#CFE6BC', wood: '#B9DBA4', sand: '#F3E2B3', road: '#FFFFFF', roadCase: '#E4D6BC' };
  function restyle() {
    var layers = map.getStyle().layers || [];
    layers.forEach(function (l) {
      var id = l.id, t = l.type, set = function (k, v) { try { map.setPaintProperty(id, k, v); } catch (e) {} };
      if (t === 'background') set('background-color', C.land);
      else if (t === 'fill-extrusion') {
        set('fill-extrusion-color', ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 6], 0, '#F8E3C4', 12, '#F2C79A', 30, '#E9A57E', 80, '#D98C6C']);
        set('fill-extrusion-opacity', 1);
        set('fill-extrusion-vertical-gradient', true);
        try { map.setLayerZoomRange(id, 12.5, 24); } catch (e) {}
      }
      else if (t === 'fill') {
        if (/water|ocean|sea/.test(id)) set('fill-color', C.water);
        else if (/wood|forest/.test(id)) set('fill-color', C.wood);
        else if (/park|grass|landcover|garden|pitch|golf/.test(id)) set('fill-color', C.park);
        else if (/sand|beach/.test(id)) set('fill-color', C.sand);
        else if (/^building/.test(id)) { set('fill-color', '#EBDCC3'); set('fill-outline-color', '#DCC9A8'); }
      }
      else if (t === 'line') {
        if (/water|river|stream|canal/.test(id)) set('line-color', '#7FC7DF');
        else if (/casing|bridge_.*casing/.test(id)) set('line-color', C.roadCase);
        else if (/road|motorway|trunk|primary|secondary|tertiary|street|path|bridge|tunnel/.test(id)) set('line-color', C.road);
      }
      else if (t === 'symbol') {
        // keep place / water names, drop shop & transport clutter so our pins stand out
        if (/poi|airport|shield|rail|transit|aeroway|housenumber/.test(id)) { try { map.setLayoutProperty(id, 'visibility', 'none'); } catch (e) {} }
        else { set('text-color', '#33556B'); set('text-halo-color', 'rgba(255,255,255,.9)'); }
      }
    });
    try { map.setLight({ anchor: 'viewport', color: '#FFF6E5', intensity: 0.38, position: [1.4, 210, 38] }); } catch (e) {}
    try { map.setSky && map.setSky({ 'sky-color': '#BFE6F5', 'horizon-color': '#F4ECDD', 'fog-color': '#F4ECDD', 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.4, 'fog-ground-blend': 0.2 }); } catch (e) {}
  }

  // ---- markers ----
  var all = [];
  function pinEl(cls, html, label) {
    var w = document.createElement('div'); w.className = 'ta-pin-wrap';
    w.innerHTML = '<span class="ta-pin ' + cls + '"><i>' + html + '</i></span>';
    w.setAttribute('role', 'button'); w.setAttribute('tabindex', '0'); w.setAttribute('aria-label', label);
    return w;
  }
  function add(g, e, lng, lat, popupHtml, title) {
    var pop = new ml.Popup({ offset: [0, -38], maxWidth: '280px', closeButton: true }).setHTML(popupHtml);
    var m = new ml.Marker({ element: e, anchor: 'bottom' }).setLngLat([lng, lat]).setPopup(pop).addTo(map);
    e.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); m.togglePopup(); } });
    all.push({ g: g, m: m, e: e, lng: lng, lat: lat, title: title });
  }
  data.areas.forEach(function (a) { add('areas', pinEl('ta-pin-area', String(a.n), a.label), a.lng, a.lat, T.areaPopup(a), a.n + '. ' + a.label); });
  data.places.forEach(function (p) {
    var k = T.kindOf(p), g = p.sponsored ? 'featured' : (p.type === 'beach' ? 'beach' : 'thing');
    add(g, pinEl(p.sponsored ? 'ta-pin-star' : 'ta-k-' + k[1], T.icon(k[0]), p.title), p.lng, p.lat, T.placePopup(p), p.title);
  });

  // ---- controls: area chips, rotate, filters ----
  var bar = document.createElement('div'); bar.className = 'ta-3d-bar';
  function btn(label, fn, cls) { var b = document.createElement('button'); b.type = 'button'; b.textContent = label; if (cls) b.className = cls; b.addEventListener('click', fn); return b; }
  bar.appendChild(btn('Whole region', function () { map.easeTo({ center: [30.75, 36.75], zoom: 8.6, pitch: 35, bearing: 0, duration: 1200 }); }, 'wide'));
  data.areas.forEach(function (a) { bar.appendChild(btn(a.n + ' ' + a.label.split(' ')[0], function () { map.flyTo({ center: [a.lng, a.lat], zoom: 14.2, pitch: 60, bearing: -28 + (a.n * 13) % 50, duration: 1600 }); })); });
  el.appendChild(bar);

  var rot = document.createElement('div'); rot.className = 'ta-3d-rot';
  rot.appendChild(btn('⟲', function () { map.easeTo({ bearing: map.getBearing() - 45, duration: 700 }); }));
  rot.appendChild(btn('⟳', function () { map.easeTo({ bearing: map.getBearing() + 45, duration: 700 }); }));
  rot.appendChild(btn('Flat', function () { map.easeTo({ pitch: map.getPitch() > 20 ? 0 : 58, bearing: 0, duration: 700 }); }, 'txt'));
  rot.children[0].setAttribute('aria-label', 'Rotate left 45 degrees'); rot.children[1].setAttribute('aria-label', 'Rotate right 45 degrees');
  el.appendChild(rot);

  var hint = document.createElement('p'); hint.className = 'ta-3d-hint'; hint.textContent = 'Drag to move · right-drag or two fingers to tilt & rotate · zoom in for 3D buildings';
  el.appendChild(hint);
  map.once('movestart', function () { setTimeout(function () { hint.classList.add('off'); }, 4000); });

  map.on('style.load', restyle);
  if (map.isStyleLoaded()) restyle();
  // pins hidden when very far out would overlap: only area pins below zoom 10
  function lod() { var z = map.getZoom(); all.forEach(function (x) { x.e.style.display = (x.g === 'areas' || x.g === 'featured' || z >= 10.5) ? '' : 'none'; }); }
  map.on('zoom', lod); lod();
})();
