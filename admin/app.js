/* Travel Antalya admin — single-page app. Talks to /.netlify/functions/admin. */
(() => {
  'use strict';
  const S = window.ADMIN_SCHEMA;
  const API = '/.netlify/functions/admin';
  const app = document.getElementById('app');
  const state = { data: null, filter: { q: '', issue: '' } };
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const slugify = s => String(s || '').toLowerCase().replace(/[çğıöşü]/g, c => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c])).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
  const imgUrl = (src, w = 640) => !src ? '' : /^https:\/\//.test(src) ? `/.netlify/images?url=${encodeURIComponent(src)}&w=${w}&q=70` : src;
  const today = () => new Date().toISOString().slice(0, 10);

  function toast(msg, kind = '') {
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = msg;
    document.getElementById('toasts').appendChild(t); setTimeout(() => t.remove(), kind === 'err' ? 8000 : 4500);
  }
  async function api(action, body, method = body ? 'POST' : 'GET', query = '') {
    const res = await fetch(`${API}?action=${action}${query}`, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && action !== 'login') { renderLogin(); throw new Error('Please log in'); }
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  }
  async function loadData() {
    if (state.data) return state.data;
    const r = await fetch('/admin/data.json', { cache: 'no-store' });
    state.data = await r.json();
    return state.data;
  }

  /* ---------- Front matter ---------- */
  function parseFile(text) {
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    const fm = m ? (jsyaml.load(m[1], { schema: jsyaml.CORE_SCHEMA }) || {}) : {};
    let body = m ? m[2] : text;
    body = body.replace(/^\s*\{%\s*raw\s*%\}\s*\n?/, '').replace(/\n?\{%\s*endraw\s*%\}\s*$/, '');
    return { fm, body: body.replace(/^\n+/, '') };
  }
  function buildFile(fm, body) {
    const clean = {};
    for (const [k, v] of Object.entries(fm)) {
      if (v === '' || v == null || (Array.isArray(v) && !v.length)) continue;
      clean[k] = v;
    }
    const yaml = jsyaml.dump(clean, { schema: jsyaml.CORE_SCHEMA, lineWidth: -1, noRefs: true, quotingType: '"', forceQuotes: true });
    return `---\n${yaml}---\n{% raw %}\n${body.trim()}\n{% endraw %}\n`;
  }

  /* ---------- Login ---------- */
  function renderLogin() {
    app.innerHTML = `<div class="login"><form id="lf"><img src="/images/logo-520.webp" alt="Travel Antalya"><h1>Admin</h1><p>Enter your admin password.</p>
      <div class="field"><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" required></div>
      <button class="btn" type="submit">Log in</button><p class="hint" id="lerr" style="color:#B42318"></p></form></div>`;
    document.getElementById('lf').addEventListener('submit', async e => {
      e.preventDefault(); const b = e.target.querySelector('button'); b.disabled = true;
      try { await api('login', { password: document.getElementById('pw').value }); route(); }
      catch (err) { document.getElementById('lerr').textContent = err.message; b.disabled = false; }
    });
    document.getElementById('pw').focus();
  }

  /* ---------- Shell ---------- */
  function shell(active, inner) {
    const d = state.data;
    const nav = [['#/', '📊', 'Dashboard', 'dash'], ...Object.entries(S).map(([k, c]) => [`#/c/${k}`, c.icon, c.label, k, d.collections[k] ? d.collections[k].length : 0]), ['#/photos', '🖼️', 'Photo library', 'photos', d.photos.length]];
    app.innerHTML = `<div class="shell"><nav class="side" aria-label="Admin"><div class="brand"><img src="/images/logo-white-520.webp" alt="Travel Antalya"></div>
      ${nav.map(([h, i, l, k, n]) => `<a href="${h}" class="${active === k ? 'active' : ''}"><span>${i}</span>${l}${n != null ? `<span class="count">${n}</span>` : ''}</a>`).join('')}
      <div class="spacer"></div><a href="/" target="_blank" rel="noopener">↗ View site</a><a href="#/logout">⎋ Log out</a></nav><main class="main">${inner}</main></div>`;
  }

  /* ---------- Dashboard ---------- */
  function renderDash() {
    const d = state.data;
    const kpis = Object.entries(S).map(([k, c]) => {
      const rows = d.collections[k] || []; const withPhoto = rows.filter(r => r.photoKind === 'official' || r.photoKind === 'licensed').length;
      const pct = rows.length ? Math.round(withPhoto / rows.length * 100) : 0;
      return `<a class="card kpi" href="#/c/${k}"><span class="em">${c.icon}</span><strong>${rows.length}</strong><span>${c.label}</span><small>${withPhoto} with own photos · ${rows.filter(r => r.issues.length).length} need attention</small><div class="bar"><span style="width:${pct}%"></span></div></a>`;
    }).join('');
    const attention = Object.entries(d.collections).flatMap(([k, rows]) => rows.filter(r => r.issues.length).map(r => ({ ...r, k }))).slice(0, 14);
    shell('dash', `<div class="top"><h1>Dashboard</h1><span class="saveinfo">Site data from ${esc(d.built)}</span></div>
      <div class="kpis">${kpis}</div>
      <div class="grid2"><section class="card panel"><h2>Needs attention</h2><div class="rows">${attention.map(rowHtml).join('') || '<p>All good 🎉</p>'}</div></section>
      <section class="card panel"><h2>Quick actions</h2><div class="quick">${Object.entries(S).map(([k, c]) => `<a class="btn ghost" href="#/new/${k}">+ New ${c.singular.toLowerCase()}</a>`).join('')}<a class="btn orange" href="#/photos">Browse photo library</a></div>
      <p class="saveinfo" style="margin-top:16px">Saving publishes to the live site automatically — changes appear in about 1–2 minutes.</p></section></div>`);
  }
  function rowHtml(r) {
    const k = r.k;
    return `<a class="card row" href="#/e/${k}/${encodeURIComponent(r.file)}">${r.thumb ? `<img src="${esc(r.thumb)}" alt="" loading="lazy">` : '<span class="noimg"></span>'}
      <span><b>${esc(r.title)}</b><small>${esc([r.area, r.category, r.start].filter(Boolean).join(' · '))}</small><br>${r.issues.map(i => `<span class="chip">${esc(i)}</span>`).join('')}${r.photoKind === 'official' ? '<span class="chip ok">own photos</span>' : ''}</span>
      <small>${r.words} words</small></a>`;
  }

  /* ---------- List ---------- */
  function renderList(k) {
    const c = S[k]; const all = (state.data.collections[k] || []).map(r => ({ ...r, k }));
    shell(k, `<div class="top"><h1>${c.label}</h1><a class="btn" href="#/new/${k}">+ New ${c.singular.toLowerCase()}</a></div>
      <div class="filters"><label class="search">🔍<input id="q" type="search" placeholder="Search ${c.label.toLowerCase()}…" value="${esc(state.filter.q)}"></label>
      <select id="iss"><option value="">All</option><option value="needs photo">Needs photo</option><option value="thin text">Thin text</option><option value="recheck source">Recheck source</option></select></div>
      <p class="saveinfo" id="cnt"></p><div class="rows" id="rows"></div>`);
    const q = document.getElementById('q'), iss = document.getElementById('iss'); iss.value = state.filter.issue;
    const draw = () => {
      state.filter = { q: q.value, issue: iss.value };
      const words = slugify(q.value).split('-').filter(Boolean);
      const list = all.filter(r => (!iss.value || r.issues.includes(iss.value)) && words.every(w => slugify(`${r.title} ${r.area} ${r.category}`).includes(w)));
      document.getElementById('cnt').textContent = `${list.length} of ${all.length}`;
      document.getElementById('rows').innerHTML = list.map(rowHtml).join('');
    };
    q.addEventListener('input', draw); iss.addEventListener('change', draw); draw();
  }

  /* ---------- Editor ---------- */
  async function renderEditor(k, file) {
    const c = S[k]; const isNew = !file;
    shell(k, `<div class="boot">Loading…</div>`);
    let fm = {}, body = '', sha = null, path = '';
    if (!isNew) {
      const row = (state.data.collections[k] || []).find(r => r.file === file);
      path = row ? row.path : `${c.folder}/${file}.md`;
      try { const f = await api('file', null, 'GET', `&path=${encodeURIComponent(path)}`); ({ fm, body } = parseFile(f.content)); sha = f.sha; }
      catch (e) { toast(e.message, 'err'); return; }
    } else {
      fm = { last_checked: today() };
      if (k === 'blog') fm.date = today();
    }
    const fields = c.fields;
    const fieldHtml = f => {
      const v = f.type === 'markdown' ? body : fm[f.name];
      const id = 'f_' + f.name; const hint = f.hint ? `<span class="hint">${esc(f.hint)}</span>` : '';
      switch (f.type) {
        case 'textarea': return `<div class="field"><label for="${id}">${esc(f.label)}</label><textarea id="${id}" data-f="${f.name}" ${f.max ? `data-max="${f.max}"` : ''}>${esc(v)}</textarea>${f.max ? `<span class="counter" data-for="${id}"></span>` : ''}${hint}</div>`;
        case 'select': return `<div class="field"><label for="${id}">${esc(f.label)}</label>${f.allowCustom ? `<input type="text" id="${id}" data-f="${f.name}" list="${id}_l" value="${esc(v)}"><datalist id="${id}_l">${f.options.map(o => `<option value="${esc(o)}">`).join('')}</datalist>` : `<select id="${id}" data-f="${f.name}"><option value="">—</option>${f.options.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`}${hint}</div>`;
        case 'tags': return `<div class="field"><label>${esc(f.label)}</label><div class="addrow">${f.options.map(o => `<label class="check"><input type="checkbox" data-tag="${f.name}" value="${o}" ${(v || []).includes(o) ? 'checked' : ''}>${{ 'editors-choice': 'Editor’s choice', sponsored: 'Sponsored' }[o] || o}</label>`).join('')}</div>${hint}</div>`;
        case 'bool': return `<div class="field"><label class="check"><input type="checkbox" id="${id}" data-f="${f.name}" data-bool ${v === true || v === 'true' ? 'checked' : ''}>${esc(f.label)}</label>${hint}</div>`;
        case 'list': return `<div class="field"><label for="${id}">${esc(f.label)}</label><textarea id="${id}" data-f="${f.name}" data-list>${esc((v || []).join('\n'))}</textarea>${hint}</div>`;
        case 'photos': return `<div class="field"><label>${esc(f.label)}</label><div class="photos" id="photos"></div><div class="addrow"><input type="url" id="addurl" placeholder="Paste image link (https://…)"><button type="button" class="btn small ghost" id="addbtn">Add link</button><label class="btn small orange" style="cursor:pointer">Upload photo<input type="file" id="upl" accept="image/*" multiple hidden></label></div>${hint}</div>`;
        case 'photoId': return `<div class="field"><label for="${id}">${esc(f.label)}</label><div class="addrow"><input type="text" id="${id}" data-f="${f.name}" value="${esc(v)}"><button type="button" class="btn small ghost" data-pick="${id}">Choose…</button></div>${hint}</div>`;
        case 'photoIds': return `<div class="field"><label for="${id}">${esc(f.label)}</label><div class="addrow"><input type="text" id="${id}" data-f="${f.name}" data-csv value="${esc((v || []).join(', '))}"><button type="button" class="btn small ghost" data-pick="${id}" data-multi>Add…</button></div><span class="hint">Comma-separated library IDs.</span></div>`;
        case 'markdown': return `<div class="field"><label for="${id}">${esc(f.label)}</label><div class="md-tools"><button type="button" data-md="## ">H2</button><button type="button" data-md="### ">H3</button><button type="button" data-wrap="**">B</button><button type="button" data-wrap="_">I</button><button type="button" data-md="- ">• List</button><button type="button" data-link>Link</button><button type="button" data-md="> ">Quote</button><button type="button" class="tab" id="mdtab">Preview</button></div><textarea id="${id}" class="md" data-f="body">${esc(v)}</textarea><div class="md-preview" id="mdprev" hidden></div><span class="hint" id="wc"></span></div>`;
        case 'date': return `<div class="field"><label for="${id}">${esc(f.label)}</label><input type="date" id="${id}" data-f="${f.name}" value="${esc(String(v || '').slice(0, 10))}">${hint}</div>`;
        case 'number': return `<div class="field"><label for="${id}">${esc(f.label)}</label><input type="number" step="any" id="${id}" data-f="${f.name}" data-num value="${esc(v)}">${hint}</div>`;
        default: return `<div class="field"><label for="${id}">${esc(f.label)}${f.required ? ' *' : ''}</label><input type="${f.type === 'url' ? 'url' : 'text'}" id="${id}" data-f="${f.name}" value="${esc(v)}" ${f.required ? 'required' : ''}>${hint}</div>`;
      }
    };
    shell(k, `<div class="top"><a class="btn ghost small" href="#/c/${k}">← ${esc(c.label)}</a><h1>${isNew ? 'New ' + esc(c.singular.toLowerCase()) : esc(fm.title || file)}</h1>
        ${!isNew ? `<a class="btn ghost" id="live" target="_blank" rel="noopener">View live ↗</a><button class="btn danger" id="del">Delete</button>` : ''}<button class="btn orange" id="save">Save &amp; publish</button></div>
      <div class="editor"><form class="card form" id="ef" onsubmit="return false">${fields.map(fieldHtml).join('')}</form>
      <aside class="preview"><div class="card pcard"><img id="pimg" alt=""><div class="body"><div class="eyebrow" id="peye"></div><h3 id="ptitle"></h3><p id="pexc"></p></div></div>
      <div class="card serp"><div class="u">travel-antalya.com${esc(c.path)}<span id="pslug"></span>/</div><div class="t" id="stitle"></div><div class="d" id="sdesc"></div></div>
      <p class="saveinfo">Changes go live about 1–2 minutes after saving.</p></aside></div>`);
    const form = document.getElementById('ef');
    let photos = (fm.photos_official || []).map(p => ({ ...p, alt: p.alt || '' }));
    const row = (state.data.collections[k] || []).find(r => r.file === file);
    if (row) document.getElementById('live').href = row.url;

    const drawPhotos = () => {
      const box = document.getElementById('photos'); if (!box) return;
      box.innerHTML = photos.map((p, i) => `<div class="photo-row"><img src="${esc(p.preview || imgUrl(p.src, 320))}" alt=""><div>${i === 0 ? '<span class="cover">COVER</span>' : ''}<input type="text" value="${esc(p.alt)}" placeholder="What does the photo show?" data-alt="${i}" style="width:100%;border:2px solid var(--line);border-radius:10px;padding:7px 10px"><small style="display:block;color:var(--muted);word-break:break-all">${esc(p.src.slice(0, 90))}</small></div><div class="ops"><button type="button" class="iconbtn" data-up="${i}" title="Move up">↑</button><button type="button" class="iconbtn" data-rm="${i}" title="Remove">✕</button></div></div>`).join('') || '<p class="hint">No photos yet — the site shows a labelled area photo until you add one.</p>';
    };
    drawPhotos();

    const collect = () => {
      const out = { ...fm };
      form.querySelectorAll('[data-f]').forEach(el => {
        const n = el.dataset.f; if (n === 'body') return;
        let v = el.value.trim();
        if (el.dataset.bool !== undefined) v = el.checked;
        else if (el.dataset.list !== undefined) v = v.split('\n').map(s => s.trim()).filter(Boolean);
        else if (el.dataset.csv !== undefined) v = v.split(',').map(s => s.trim()).filter(Boolean);
        else if (el.dataset.num !== undefined) v = v === '' ? '' : Number(v);
        out[n] = v;
      });
      const tags = {}; form.querySelectorAll('[data-tag]').forEach(el => { (tags[el.dataset.tag] = tags[el.dataset.tag] || []); if (el.checked) tags[el.dataset.tag].push(el.value); });
      Object.assign(out, tags);
      if (document.getElementById('photos')) { out.photos_official = photos.map(({ preview, ...p }) => { if (!p.alt) delete p.alt; return p; }); }
      if (k === 'blog' && out.date && !out.date_display) out.date_display = new Date(out.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return out;
    };
    const preview = () => {
      const o = collect(); const t = o.title || 'Untitled';
      const cover = photos[0] ? (photos[0].preview || imgUrl(photos[0].src)) : (o.photo_id ? (state.data.photos.find(p => p.id === o.photo_id) || {}).thumb : (row && row.thumb) || '');
      const pimg = document.getElementById('pimg'); pimg.src = cover || ''; pimg.style.display = cover ? '' : 'none';
      document.getElementById('peye').textContent = [o.neighborhood, o.category].filter(Boolean).join(' · ');
      document.getElementById('ptitle').textContent = t;
      document.getElementById('pexc').textContent = o.excerpt || o.tagline || '';
      document.getElementById('stitle').textContent = `${t} | Travel Antalya`;
      document.getElementById('sdesc').textContent = o.excerpt || '';
      document.getElementById('pslug').textContent = (k === 'things-to-do' ? slugify(t) : (o.slug || slugify(t)));
      form.querySelectorAll('[data-max]').forEach(el => { const cn = form.querySelector(`[data-for="${el.id}"]`); const n = el.value.length; cn.textContent = `${n}/${el.dataset.max}`; cn.classList.toggle('over', n > +el.dataset.max); });
      const md = document.getElementById('f_body'); if (md) document.getElementById('wc').textContent = `${md.value.split(/\s+/).filter(Boolean).length} words`;
    };
    form.addEventListener('input', e => {
      if (e.target.dataset.alt !== undefined) photos[+e.target.dataset.alt].alt = e.target.value;
      if (isNew && e.target.id === 'f_title') { const s = document.getElementById('f_slug'); if (s && !s.dataset.touched) s.value = slugify(e.target.value); }
      if (e.target.id === 'f_slug') e.target.dataset.touched = '1';
      preview();
    });
    form.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.rm) { photos.splice(+t.dataset.rm, 1); drawPhotos(); preview(); }
      if (t.dataset.up && +t.dataset.up > 0) { const i = +t.dataset.up; [photos[i - 1], photos[i]] = [photos[i], photos[i - 1]]; drawPhotos(); preview(); }
      if (t.id === 'addbtn') { const u = document.getElementById('addurl'); if (/^https:\/\//.test(u.value.trim())) { photos.push({ src: u.value.trim(), alt: '' }); u.value = ''; drawPhotos(); preview(); } else toast('Paste a full https:// image link.', 'err'); }
      if (t.dataset.pick) pickPhoto(document.getElementById(t.dataset.pick), t.dataset.multi !== undefined, preview);
      const md = document.getElementById('f_body');
      if (t.dataset.md !== undefined) { insertLine(md, t.dataset.md); preview(); }
      if (t.dataset.wrap) { wrap(md, t.dataset.wrap); preview(); }
      if (t.dataset.link !== undefined) { const u = prompt('Link address (e.g. /hotels/ or https://…)'); if (u) wrap(md, '[', `](${u})`); }
      if (t.id === 'mdtab') { const p = document.getElementById('mdprev'); const on = p.hidden; p.hidden = !on; md.hidden = on; t.classList.toggle('on', on); if (on) p.innerHTML = window.marked ? marked.parse(md.value) : esc(md.value); }
    });
    const upl = document.getElementById('upl');
    if (upl) upl.addEventListener('change', async () => {
      for (const file of upl.files) {
        try {
          const { base64, dataUrl } = await shrink(file, 1920);
          const name = `${slugify((collect().slug || collect().title || 'photo'))}-${Date.now().toString(36)}.jpg`;
          await api('upload', { path: `images/uploads/${name}`, base64, message: `admin: upload ${name}` });
          photos.push({ src: `/images/uploads/${name}`, alt: '', preview: dataUrl }); drawPhotos(); preview();
          toast('Photo uploaded.', 'ok');
        } catch (e) { toast(e.message, 'err'); }
      }
      upl.value = '';
    });
    document.getElementById('save').addEventListener('click', async e => {
      const o = collect();
      if (!o.title) { toast('Please add a title.', 'err'); return; }
      const slug = k === 'things-to-do' ? slugify(o.title) : (o.slug || slugify(o.title));
      if (S[k].fields.some(f => f.name === 'slug')) o.slug = slug;
      const filePath = path || `${c.folder}/${slug}.md`;
      const b = e.target; b.disabled = true; b.textContent = 'Saving…';
      try {
        const r = await api('save', { path: filePath, sha, content: buildFile(o, document.getElementById('f_body').value), message: `admin: ${isNew ? 'add' : 'update'} ${o.title}` });
        sha = r.sha; path = filePath; fm = o;
        toast('Saved! The live site updates in about 1–2 minutes.', 'ok');
        const rows = state.data.collections[k]; const existing = rows.find(x => x.path === filePath);
        const summary = { title: o.title, area: o.neighborhood || '', category: o.category || '', words: document.getElementById('f_body').value.split(/\s+/).filter(Boolean).length, issues: [], photoKind: photos.length ? 'official' : (existing ? existing.photoKind : 'none'), thumb: photos[0] ? (photos[0].preview || imgUrl(photos[0].src)) : (existing ? existing.thumb : ''), file: filePath.split('/').pop().replace(/\.md$/, ''), path: filePath, url: S[k].path + slug + '/' };
        if (existing) Object.assign(existing, summary); else rows.unshift(summary);
        if (isNew) location.hash = `#/e/${k}/${encodeURIComponent(summary.file)}`;
      } catch (err) { toast(err.message, 'err'); }
      b.disabled = false; b.textContent = 'Save & publish';
    });
    const del = document.getElementById('del');
    if (del) del.addEventListener('click', async () => {
      if (!confirm(`Delete “${fm.title}” from the site? This cannot be undone from here.`)) return;
      try { await api('delete', { path, sha }); toast('Deleted. The page disappears after the next deploy.', 'ok'); state.data.collections[k] = state.data.collections[k].filter(x => x.path !== path); location.hash = `#/c/${k}`; }
      catch (e) { toast(e.message, 'err'); }
    });
    preview();
  }
  function insertLine(ta, prefix) { const s = ta.selectionStart; const start = ta.value.lastIndexOf('\n', s - 1) + 1; ta.value = ta.value.slice(0, start) + prefix + ta.value.slice(start); ta.focus(); }
  function wrap(ta, a, b = a) { const s = ta.selectionStart, e = ta.selectionEnd; ta.value = ta.value.slice(0, s) + a + ta.value.slice(s, e) + b + ta.value.slice(e); ta.focus(); ta.selectionStart = s + a.length; ta.selectionEnd = e + a.length; }
  function shrink(file, max) {
    return new Promise((ok, fail) => {
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => { const r = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); const dataUrl = c.toDataURL('image/jpeg', 0.84); URL.revokeObjectURL(url); ok({ dataUrl, base64: dataUrl.split(',')[1] }); };
      img.onerror = () => fail(new Error('Could not read this image.')); img.src = url;
    });
  }

  /* ---------- Photo library ---------- */
  function libraryHtml(list) { return `<div class="lib">${list.map(p => `<button type="button" data-id="${esc(p.id)}"><img src="${esc(p.thumb)}" alt="" loading="lazy"><code>${esc(p.id)}</code><span>${esc(p.caption)}</span></button>`).join('')}</div>`; }
  function filterLib(q) { const w = slugify(q).split('-').filter(Boolean); return state.data.photos.filter(p => w.every(x => slugify(`${p.id} ${p.caption} ${p.area}`).includes(x))); }
  function renderPhotos() {
    shell('photos', `<div class="top"><h1>Photo library</h1><span class="saveinfo">Click a photo to copy its ID</span></div><div class="filters"><label class="search">🔍<input id="pq" type="search" placeholder="Search: kaleici, beach, belek…"></label></div><div id="libwrap">${libraryHtml(state.data.photos)}</div>`);
    const q = document.getElementById('pq'); q.addEventListener('input', () => { document.getElementById('libwrap').innerHTML = libraryHtml(filterLib(q.value)); });
    document.getElementById('libwrap').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) { navigator.clipboard && navigator.clipboard.writeText(b.dataset.id); toast(`Copied “${b.dataset.id}”`, 'ok'); } });
  }
  function pickPhoto(input, multi, done) {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="card"><div class="top"><h1>Choose a photo</h1><button class="btn ghost small" data-close>Close</button></div><div class="filters"><label class="search">🔍<input type="search" placeholder="Search photos…"></label></div><div class="libw">${libraryHtml(state.data.photos)}</div></div>`;
    document.body.appendChild(m);
    const q = m.querySelector('input'); q.focus(); q.addEventListener('input', () => { m.querySelector('.libw').innerHTML = libraryHtml(filterLib(q.value)); });
    m.addEventListener('click', e => {
      if (e.target === m || e.target.closest('[data-close]')) { m.remove(); return; }
      const b = e.target.closest('[data-id]'); if (!b) return;
      input.value = multi ? [input.value, b.dataset.id].filter(Boolean).join(', ') : b.dataset.id;
      input.dispatchEvent(new Event('input', { bubbles: true })); m.remove(); done && done();
    });
  }

  /* ---------- Router ---------- */
  async function route() {
    const h = location.hash.replace(/^#/, '') || '/';
    if (h === '/logout') { await api('logout', {}).catch(() => {}); state.data = null; renderLogin(); return; }
    try { await api('me'); } catch (e) { if (!document.getElementById('lf')) renderLogin(); const er = document.getElementById('lerr'); if (er && e.message !== 'Please log in') er.textContent = e.message; return; }
    await loadData();
    const [, a, b, c] = h.split('/');
    if (a === 'c' && S[b]) return renderList(b);
    if (a === 'e' && S[b]) return renderEditor(b, decodeURIComponent(c || ''));
    if (a === 'new' && S[b]) return renderEditor(b, '');
    if (a === 'photos') return renderPhotos();
    renderDash();
  }
  window.addEventListener('hashchange', route);
  route();
})();
