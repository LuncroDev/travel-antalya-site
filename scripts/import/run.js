#!/usr/bin/env node
// One-off/occasional content importer, run by .github/workflows/import-content.yml
// on GitHub's runners (which have internet access). It only fetches raw material;
// conversion into site pages happens in a separate, reviewable step.
//
//  1. Google Docs  -> docs/import/raw/<n>.md         (export as Markdown, fallback text)
//  2. Wikimedia Commons photos per blog -> images/editorial/commons-*.jpg
//     + metadata in docs/import/commons.json          (CC BY / BY-SA / CC0 / PD only)
//  3. Official-website photos for venues -> docs/import/official-photos.json
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

const root = path.resolve(__dirname, '../..');
const out = p => path.join(root, p);
const queue = JSON.parse(fs.readFileSync(out('docs/import/queue.json'), 'utf8'));
const UA = 'TravelAntalyaImporter/1.0 (https://travel-antalya.com; site owner import)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url, opts = {}) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 25000);
  try { return await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' }, redirect: 'follow', signal: ctrl.signal, ...opts }); }
  finally { clearTimeout(t); }
}

async function importDocs() {
  fs.mkdirSync(out('docs/import/raw'), { recursive: true });
  const report = [];
  for (const b of queue.blogs) {
    const file = out(`docs/import/raw/${String(b.n).padStart(2, '0')}.md`);
    if (fs.existsSync(file)) { report.push([b.n, 'exists']); continue; }
    let text = '', fmt = '';
    for (const f of ['md', 'txt']) {
      try {
        const r = await get(`https://docs.google.com/document/d/${b.doc}/export?format=${f}`);
        if (r.ok) { text = await r.text(); fmt = f; if (text.trim().length > 200) break; }
      } catch (e) { /* try next */ }
    }
    if (text.trim().length > 200) { fs.writeFileSync(file, text); report.push([b.n, fmt, text.length]); }
    else report.push([b.n, 'FAILED']);
    await sleep(400);
  }
  console.log('docs', JSON.stringify(report));
}

const OK_LICENSE = /^(cc[- ]by(-sa)?[- ]?[0-9.]*|cc0|public domain|pd)/i;
async function commonsSearch(query, limit = 12) {
  const api = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: String(limit),
    gsrsearch: `${query} filetype:bitmap`, prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: '1600'
  });
  const r = await get(api); if (!r.ok) return [];
  const pages = Object.values((await r.json()).query?.pages || {});
  return pages.sort((a, b) => a.index - b.index).map(p => {
    const ii = p.imageinfo?.[0]; if (!ii) return null;
    const m = ii.extmetadata || {};
    const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    return { title: p.title, width: ii.width, height: ii.height, mime: ii.mime, thumb: ii.thumburl, page: ii.descriptionurl,
      license: strip(m.LicenseShortName?.value), licenseUrl: strip(m.LicenseUrl?.value), author: strip(m.Artist?.value).slice(0, 120),
      description: strip(m.ImageDescription?.value).slice(0, 200) };
  }).filter(x => x && x.thumb && /jpeg|png|webp/.test(x.mime) && x.width >= 1200 && x.width >= x.height * 1.15 && OK_LICENSE.test(x.license) && x.author);
}

async function importCommons() {
  const metaFile = out('docs/import/commons.json');
  const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {};
  const used = new Set(Object.values(meta).flat().map(x => x.page));
  for (const b of queue.blogs) {
    if ((meta[b.n] || []).length >= 3) continue;
    const picks = meta[b.n] || [];
    let found = [];
    try { found = await commonsSearch(b.photoQuery); } catch (e) { console.log('commons fail', b.n, e.message); }
    if (found.length < 3) { try { found = found.concat(await commonsSearch(`${b.photoQuery} Turkey`)); } catch (e) {} }
    for (const f of found) {
      if (picks.length >= 3) break;
      if (used.has(f.page)) continue;
      const id = 'commons-' + f.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 70);
      const file = `images/editorial/${id}.jpg`;
      try {
        const r = await get(f.thumb); if (!r.ok) continue;
        fs.writeFileSync(out(file), Buffer.from(await r.arrayBuffer()));
        picks.push({ id, src: '/' + file, ...f }); used.add(f.page);
      } catch (e) { continue; }
      await sleep(300);
    }
    meta[b.n] = picks;
    console.log('commons', b.n, b.photoQuery, picks.length);
  }
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 1));
}

const BAD = /logo|icon|sprite|favicon|flag|award|badge|tripadvisor|holidaycheck|\.svg|\.gif|placeholder|loader|pixel|avatar|qr|visa|mastercard|certif|whatsapp|instagram|facebook|youtube|button|arrow|map[-_]|google|popup|promo|kampanya|campaign|offer|indirim|discount|1x1|blank/i;
function extractImages(html, base) {
  const urls = [];
  const push = (u, weight) => { try { const abs = new URL(u.replace(/&amp;/g, '&'), base).href; if (/^https:/.test(abs) && !BAD.test(abs) && /\.(jpe?g|webp)(\?|$)/i.test(abs)) urls.push([abs, weight]); } catch {} };
  for (const m of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*content=["']([^"']+)/gi)) push(m[1], 100);
  for (const m of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image)["']/gi)) push(m[1], 100);
  for (const m of html.matchAll(/<img[^>]+>/gi)) {
    const tag = m[0];
    const src = (tag.match(/\s(?:data-src|data-lazy-src|src)=["']([^"']+)/i) || [])[1];
    const set = (tag.match(/\s(?:data-srcset|srcset)=["']([^"']+)/i) || [])[1];
    const best = set ? set.split(',').map(s => s.trim().split(/\s+/)[0]).pop() : src;
    const w = +((tag.match(/\swidth=["']?(\d+)/i) || [])[1] || 0);
    if (best) push(best, w >= 800 ? 50 : 10);
  }
  for (const m of html.matchAll(/url\(["']?([^"')]+\.(?:jpe?g|webp)[^"')]*)["']?\)/gi)) push(m[1], 30);
  const seen = new Set();
  return urls.sort((a, b) => b[1] - a[1]).map(x => x[0]).filter(u => { const k = u.split('?')[0]; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 6);
}

async function importOfficial() {
  const file = out('docs/import/official-photos.json');
  const result = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  for (const kind of queue.officialPhotos || []) {
    const dir = out(`content/${kind}`);
    for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.md'))) {
      const data = matter(fs.readFileSync(path.join(dir, f), 'utf8')).data;
      const slug = data.slug || f.replace(/\.md$/, '');
      const key = `${kind}/${slug}`;
      if (result[key]?.images?.length) continue;
      const url = data.official_url || data.source_url; if (!url) continue;
      // Prefer the property's home page over a contact page.
      const candidates = [...new Set([url.replace(/\/(contact|iletisim|bize-ulasin|contact-us|location)[^/]*\/?$/i, '/'), url])];
      let images = [], page = url;
      for (const c of candidates) {
        try { const r = await get(c); if (!r.ok) continue; const html = await r.text(); images = extractImages(html, r.url || c); page = r.url || c; if (images.length >= 2) break; } catch (e) {}
      }
      result[key] = { page, images };
      console.log('official', key, images.length);
      await sleep(250);
    }
  }
  fs.writeFileSync(file, JSON.stringify(result, null, 1));
}

(async () => {
  const steps = process.argv.slice(2);
  const all = !steps.length;
  if (all || steps.includes('docs')) await importDocs();
  if (all || steps.includes('commons')) await importCommons();
  if (all || steps.includes('official')) await importOfficial();
})().catch(e => { console.error(e); process.exit(1); });
