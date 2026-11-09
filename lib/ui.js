'use strict';
// Presentation helpers for the 2026 redesign: optimized images, card photos
// and small text utilities. Keep this file free of content decisions.
const fs = require('node:fs');
const path = require('node:path');
const { photoGallery, districtFor } = require('./discovery');

const ROOT = path.resolve(__dirname, '..');
const OPT_WIDTHS = [640, 1280];

function optName(src) {
  if (!src || typeof src !== 'string' || !src.startsWith('/images/')) return null;
  return path.basename(src).replace(/\.[a-z0-9]+$/i, '');
}

// Return the optimized WebP for a site image, or the original when none exists.
// Remote photos (official hotel/restaurant sites) go through Netlify Image CDN,
// which resizes, converts to WebP/AVIF and caches them at the edge.
const isRemote = src => typeof src === 'string' && /^https:\/\//.test(src);
const cdn = (src, w) => `/.netlify/images?url=${encodeURIComponent(src)}&w=${w}&q=72`;

function opt(src, width = 640) {
  if (isRemote(src)) return cdn(src, width);
  const name = optName(src);
  if (!name) return src;
  const candidate = `/images/opt/${name}-${width}.webp`;
  return fs.existsSync(path.join(ROOT, candidate)) ? candidate : src;
}

function srcset(src) {
  if (isRemote(src)) return OPT_WIDTHS.map(w => `${cdn(src, w)} ${w}w`).join(', ');
  const name = optName(src);
  if (!name) return '';
  const parts = OPT_WIDTHS
    .map(w => [w, `/images/opt/${name}-${w}.webp`])
    .filter(([, file]) => fs.existsSync(path.join(ROOT, file)))
    .map(([w, file]) => `${file} ${w}w`);
  return parts.length > 1 ? parts.join(', ') : '';
}

const library = () => require('../_data/editorialPhotos.json');
const FALLBACK_ID = 'kaleici-marina';
const hash = str => { let h = 0; for (const c of String(str)) h = (h * 31 + c.codePointAt(0)) >>> 0; return h; };

// One photo for a card. Property photos first, then a clearly labelled
// photo of the surrounding area, then a regional fallback.
// Photos taken from the venue's own website (front matter: photos_official).
function officialPhotos(data = {}) {
  return (data.photos_official || []).filter(p => p && (isRemote(p.src) || /^\/images\//.test(p.src || ''))).map((p, i) => ({
    id: `${data.slug || 'item'}-official-${i}`,
    src: p.src,
    alt: p.alt || `${data.title} — photo from the official website`,
    caption: p.caption || `${data.title}`,
    author: `${data.title} (official website)`,
    license: 'Official website',
    source_url: data.photo_source || data.official_url || data.source_url,
    width: 1280, height: 853, contextual: false, official: true
  }));
}

function cardPhoto(data = {}, photos) {
  const all = Array.isArray(photos) ? photos : library();
  const official = officialPhotos(data);
  if (official.length) return official[0];
  if (data.photo_id) {
    const own = all.find(p => p.id === data.photo_id);
    if (own) return { ...own, contextual: data.photo_exact === false, areaLabel: data.photo_label || own.caption };
  }
  if (data.cover && !data.photo_id && !data.start_date) {
    return { src: data.cover, alt: data.cover_alt || data.title || '', contextual: false, width: 1280, height: 853 };
  }
  const gallery = photoGallery(data, all);
  if (gallery.length) {
    // Rotate area photos so neighbouring listings don't all share one image.
    const own = gallery.filter(p => !p.contextual);
    const pool = own.length ? own : gallery;
    const p = own.length ? own[0] : pool[hash(data.slug || data.title || '') % pool.length];
    return { ...p, areaLabel: p.contextual ? (data.neighborhood || p.caption) : '' };
  }
  const district = districtFor(data);
  const near = all.find(p => p.kind === 'destination' && p.district_slug === district);
  const p = near || all.find(p => p.id === FALLBACK_ID);
  return p ? { ...p, contextual: true, areaLabel: data.neighborhood || p.caption } : null;
}

function photoGalleryFor(data = {}, photos) {
  const all = Array.isArray(photos) ? photos : library();
  const official = officialPhotos(data);
  const list = [...official, ...photoGallery(data, all).filter(p => !(official.length && p.contextual))];
  if (data.photo_id && !list.some(p => p.id === data.photo_id)) {
    const own = all.find(p => p.id === data.photo_id);
    if (own) list.unshift({ ...own, contextual: data.photo_exact === false });
  }
  return list;
}

function districtPhoto(slug, photos) {
  const all = Array.isArray(photos) ? photos : library();
  return all.find(p => p.kind === 'destination' && p.district_slug === slug && p.recommended_hero)
    || all.find(p => p.kind === 'destination' && p.district_slug === slug)
    || null;
}

function stripTags(html = '') {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function readingTime(html = '') {
  const words = stripTags(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function shorten(text = '', max = 140) {
  const clean = stripTags(text);
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

function monthDay(value) {
  if (!value) return { month: '', day: '' };
  const d = new Date(String(value).slice(0, 10) + 'T12:00:00Z');
  if (Number.isNaN(d.getTime())) return { month: '', day: '' };
  return { month: d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' }).toUpperCase(), day: String(d.getUTCDate()) };
}

// Items that have their own (non-contextual) photograph, for showcase rows.
function withOwnPhotos(items = [], photos, count = 99) {
  return (items || []).filter(i => { const p = cardPhoto(i.data, photos); return p && !p.contextual; }).slice(0, count);
}

function pickByArea(items = [], count = 4) {
  const seen = new Set(), out = [];
  for (const i of items || []) {
    const key = districtFor(i.data) || i.data.neighborhood;
    if (seen.has(key)) continue;
    seen.add(key); out.push(i);
    if (out.length === count) break;
  }
  return out;
}

function activeEvents(items = [], count = 4) {
  const { eventStatus } = require('./events');
  return (items || []).filter(e => ['current', 'upcoming'].includes(eventStatus(e.data))).slice(0, count);
}

function except(items = [], value = '', count = 3) {
  return (items || []).filter(i => i.data.title !== value && i.data.slug !== value).slice(0, count);
}

// Article helpers: add ids to H2s, build a table of contents, and slot
// photo figures between sections so long posts stay visual.
function slugText(t) { return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60); }
function withHeadingIds(html = '') {
  const used = new Set();
  return String(html).replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (m, attrs, inner) => {
    if (/\sid=/.test(attrs)) return m;
    let id = slugText(inner) || 'section'; while (used.has(id)) id += '-2'; used.add(id);
    return `<h2${attrs} id="${id}">${inner}</h2>`;
  });
}
function toc(html = '') {
  return [...String(withHeadingIds(html)).matchAll(/<h2[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => ({ id: m[1], text: stripTags(m[2]) })).filter(x => x.text);
}
function injectFigures(html = '', figures = []) {
  const parts = String(html).split(/(?=<h2[\s>])/i);
  if (parts.length < 3 || !figures.length) return html;
  const slots = [Math.round(parts.length * 0.35), Math.round(parts.length * 0.7)].filter((v, i, a) => v > 0 && a.indexOf(v) === i);
  slots.forEach((slot, i) => { if (figures[i] && parts[slot]) parts[slot] = figures[i] + parts[slot]; });
  return parts.join('');
}

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function articleFigures(ids = [], photos) {
  const all = Array.isArray(photos) ? photos : library();
  return (ids || []).map(id => all.find(p => p.id === id)).filter(Boolean).map(p => {
    const set = srcset(p.src);
    return `<figure class="article-figure"><img src="${opt(p.src, 1280)}"${set ? ` srcset="${set}" sizes="(max-width: 860px) 100vw, 760px"` : ''} alt="${esc(p.alt)}" width="${p.width || 1280}" height="${p.height || 853}" loading="lazy" decoding="async"><figcaption>${esc(p.caption)} · Photo: ${esc(p.author)}, <a href="${esc(p.license_url || p.licenseUrl || p.source_url)}" rel="noopener">${esc(p.license)}</a></figcaption></figure>`;
  });
}

// Editor dashboard: per-entry health report.
function contentHealth(items = [], photos) {
  const today = new Date();
  const rows = (items || []).map(i => {
    const d = i.data, p = cardPhoto(d, photos);
    const words = stripTags(i.templateContent || '').split(' ').filter(Boolean).length;
    const checked = d.last_checked ? String(d.last_checked).slice(0, 10) : '';
    const age = checked ? Math.round((today - new Date(checked)) / 864e5) : null;
    const kind = !p ? 'none' : p.official ? 'official' : p.contextual ? 'area only' : 'licensed';
    const issues = [];
    if (kind === 'none' || kind === 'area only') issues.push('needs photo');
    if (words < 250 && !d.start_date) issues.push('thin text');
    if (age !== null && age > 90) issues.push('recheck source');
    if (!d.excerpt) issues.push('no excerpt');
    const base = { hotels: '/hotels/', restaurants: '/restaurants/', golf: '/golf/', events: '/events/', blog: '/blog/' };
    return { title: d.title, area: d.neighborhood || d.category || '', words, checked, issues, photoKind: kind,
      thumb: p ? opt(p.src, 640) : '', file: i.page.fileSlug, url: i.url || '', path: String(i.inputPath || '').replace(/^\.\//, ''), category: d.category || '', start: d.start_date ? String(d.start_date).slice(0, 10) : '' };
  }).sort((a, b) => b.issues.length - a.issues.length || a.title.localeCompare(b.title));
  return { rows, withPhoto: rows.filter(r => r.photoKind === 'official' || r.photoKind === 'licensed').length, thin: rows.filter(r => r.issues.includes('thin text')) };
}

function adminData(groups = {}, photos, built = '') {
  const collections = {};
  for (const [k, items] of Object.entries(groups)) {
    const rows = contentHealth(items, photos).rows;
    // Event and blog URLs come from templates, not the files themselves.
    for (const r of rows) { const it = (items || []).find(i => i.page.fileSlug === r.file); const d = it ? it.data : {};
      r.url = { hotels: '/hotels/', restaurants: '/restaurants/', golf: '/golf/', events: '/events/', 'things-to-do': '/things-to-do/', blog: '/blog/' }[k] + (k === 'things-to-do' ? require('./content').slugify(d.title) : (d.slug || require('./content').slugify(d.title))) + '/'; }
    collections[k] = rows;
  }
  const lib = (Array.isArray(photos) ? photos : library()).map(p => ({ id: p.id, thumb: opt(p.src, 640), caption: p.caption, kind: p.kind, area: p.district_slug || p.area || '' }));
  return { built, collections, photos: lib };
}

module.exports = { adminData, contentHealth, articleFigures, withHeadingIds, toc, injectFigures, officialPhotos, isRemote, except, activeEvents, withOwnPhotos, pickByArea, opt, srcset, cardPhoto, photoGalleryFor, districtPhoto, stripTags, readingTime, shorten, monthDay };
