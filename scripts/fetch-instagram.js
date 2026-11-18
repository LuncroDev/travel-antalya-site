'use strict';
// Weekly: pulls recent public posts from several Antalya TRAVEL hashtags (English / tourist-oriented)
// with Apify's apify/instagram-scraper, filters them, and writes thumbnails + links to _data/instagram.json.
// Each post is saved as a small thumbnail (images/social) that links back to the original post, with the author's handle.
// Needs env APIFY_TOKEN. Optional: IG_HASHTAGS (comma list), IG_LIMIT (posts per hashtag, default 40).
const fs = require('node:fs');
const token = process.env.APIFY_TOKEN;
if (!token) { console.error('APIFY_TOKEN is not set'); process.exit(1); }
// Tourist-oriented tags: mostly English captions, holiday photos, sights and beaches (not local news / price lists).
const TAGS = (process.env.IG_HASHTAGS || 'visitantalya,antalyaturkey,antalyaholiday,antalyatravel,kaleici,konyaaltibeach,lararbeach,turkeytravel,kalkanturkey,kasturkey,olympos,beleksturkey').split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
const tag = 'visitantalya';   // shown as the section label
const limit = Number(process.env.IG_LIMIT || 40);
const SHOW = 12;
const OUT = '_data/instagram.json';
const IMG_DIR = 'images/social';
const sharp = require('sharp');

// Caption words that keep a post out (adult / spam). Images are NOT inspected.
// Local news / price lists / promo posts: Turkish stop-words, Turkish letters in the caption, or typical news words.
const TURKISH = /[çğışöüÇĞİŞÖÜ]|\b(ve|bir|için|ile|bu|da|de|çok|değil|gibi|daha|kadar|oldu|yeni|haber|son\s*dakika|altın|fiyat|fiyatları|belediye|başkan|başkanı|meclis|ilan|kiralık|satılık|emlak|kampanya|indirim|takipçi|çekiliş|keşfet|kesfet|sondakika|fiyatlar|yemek\s*listesi|nöbetçi|hava\s*durumu)\b/i;
const BLOCK = /(\bnsfw\b|\bnude|\bnaked|\bporn|\bxxx\b|\bsex(y|i)?\b|\berotic|\bonlyfans|\bescort|\bfetish|\blingerie|\bbikini\s*model|\bçıplak|\bporno|\bseks|\berotik|\bescort|\bmasaj\s*salon|\bsüt\s*sağ|\bcasino|\bbahis|\bbet\b|\bbetting|\bviagra|\bdating|\bhot\s*girl)/i;

(async () => {
  const url = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
  const body = { directUrls: TAGS.map(t => `https://www.instagram.com/explore/tags/${t}/`), resultsType: 'posts', resultsLimit: limit, addParentData: false };
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(280000) });
  if (!res.ok) { console.error('Apify error', res.status, (await res.text()).slice(0, 300)); process.exit(1); }
  const items = await res.json();
  if (!Array.isArray(items)) { console.error('Unexpected Apify response'); process.exit(1); }
  const seen = new Set(), posts = [];
  for (const it of items) {
    const code = it.shortCode || (String(it.url || '').match(/\/(?:p|reel)\/([\w-]+)/) || [])[1];
    if (!code || seen.has(code)) continue;
    const caption = `${it.caption || ''} ${(it.hashtags || []).join(' ')}`;
    if (BLOCK.test(caption)) continue;
    if (TURKISH.test(it.caption || '')) continue;           // keep English / international captions
    if (!(it.caption || '').trim()) continue;               // no caption = usually a repost / ad / screenshot
    if ((it.hashtags || []).length > 25) continue;           // hashtag-stuffing spam
    if (it.isSponsored || it.paidPartnership) continue;
    const img = it.displayUrl || (it.images && it.images[0]);
    if (!img) continue;
    seen.add(code);
    posts.push({ code, img, user: it.ownerUsername || '', url: `https://www.instagram.com/${/\/reel\//.test(it.url || '') ? 'reel' : 'p'}/${code}/`, likes: Number(it.likesCount) || 0 });
  }
  posts.sort((a, b) => b.likes - a.likes);
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const keep = [];
  for (const p of posts) {
    if (keep.length >= SHOW) break;
    try {
      const r = await fetch(p.img, { signal: AbortSignal.timeout(30000) });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      const out = await sharp(buf).resize({ width: 900, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
      fs.writeFileSync(`${IMG_DIR}/${p.code}.webp`, out.data);
      keep.push({ code: p.code, url: p.url, user: p.user, img: `/${IMG_DIR}/${p.code}.webp`, w: out.info.width, h: out.info.height });
    } catch (e) { console.error('skip', p.code, e.message); }
  }
  if (!keep.length) { console.error('No usable posts; keeping the previous file.'); process.exit(0); }
  const names = new Set(keep.map(k => `${k.code}.webp`));
  for (const f of fs.readdirSync(IMG_DIR)) if (!names.has(f)) fs.unlinkSync(`${IMG_DIR}/${f}`);
  fs.writeFileSync(OUT, JSON.stringify({ tag, updated: new Date().toISOString().slice(0, 10), posts: keep }, null, 2) + '\n');
  console.log(`Wrote ${keep.length} posts (from ${items.length}) to ${OUT}`);
})().catch(e => { console.error(e); process.exit(1); });
