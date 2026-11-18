'use strict';
// Weekly: pulls recent public posts from Antalya TRAVEL hashtags with Apify's apify/instagram-scraper,
// filters them strictly, and writes thumbnails + links to _data/instagram.json.
//
// Filters, in order:
//   1. text rules: must be about the Antalya region (location / caption / hashtags), no other cities,
//      photos only (no reels), Latin-script captions only, no adult / spam / ad words, not sponsored
//   2. (optional but recommended) a vision check with Claude: only scenic travel photos of the region pass.
//      Needs env ANTHROPIC_API_KEY. Without it the feed is NOT published (safer), unless IG_ALLOW_UNCHECKED=1.
// Needs env APIFY_TOKEN. Optional: IG_HASHTAGS (comma list), IG_LIMIT (posts per hashtag, default 40).
const fs = require('node:fs');
const token = process.env.APIFY_TOKEN;
if (!token) { console.error('APIFY_TOKEN is not set'); process.exit(1); }
const AI_KEY = process.env.ANTHROPIC_API_KEY || '';
const ALLOW_UNCHECKED = process.env.IG_ALLOW_UNCHECKED === '1';
const MODEL = process.env.IG_VISION_MODEL || 'claude-haiku-5-5';
if (!AI_KEY && !ALLOW_UNCHECKED) { console.error('ANTHROPIC_API_KEY is not set: refusing to publish unchecked photos (set IG_ALLOW_UNCHECKED=1 to override). Keeping the previous feed.'); process.exit(0); }

const TAGS = (process.env.IG_HASHTAGS || 'visitantalya,antalyaturkey,antalyaholiday,antalyatravel,kaleici,konyaaltibeach,lararbeach,kalkanturkey,kasturkey,olympos,belekturkey,kemerturkey').split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
const tag = 'visitantalya';   // section label
const limit = Number(process.env.IG_LIMIT || 40);
const SHOW = 12;
const MAX_AI_CHECKS = 60;
const OUT = '_data/instagram.json';
const IMG_DIR = 'images/social';
const sharp = require('sharp');

const REGION = /(antalya|kale\s?i[cç]i|konyaalt|lara\b|belek|\bside\b|kemer|alanya|kalkan|\bka[sş]\b|olympos|phaselis|[cç][ıi]ral[ıi]|manavgat|kekova|demre|aspendos|perge|termessos|d[uü]den|kepez|muratpa[sş]a|adrasan|tekirova|g[oö]yn[uü]k|ulupinar|sar[ıi]su|serik|[oö]ym[ae]pinar|tahtal[ıi]|mediterranean|turquoise coast|aksu|finike|[cç]ıralı)/i;
const OTHER = /(istanbul|[iİ]stanbul|cappadocia|kapadokya|g[oö]reme|izmir|[iİ]zmir|bodrum|marmaris|fethiye|[oö]l[uü]deniz|ankara|pamukkale|trabzon|galata|bosphorus|bosporus|ayasofya|hagia|blue\s?mosque|taksim|bursa|[cç]e[sş]me|dubai|athens|greece|cyprus|egypt|bali|paris|london|sultanahmet|ephesus|efes|kusadasi|ku[sş]adas[ıi]|antakya|mardin|rize)/i;
const NONLATIN = /[\p{Script=Greek}\p{Script=Cyrillic}\p{Script=Arabic}\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hebrew}\p{Script=Thai}\p{Script=Devanagari}]/u;
// Local news / price lists / promo posts (Turkish stop-words & Turkish letters)
const TURKISH = /[çğışöüÇĞİŞÖÜ]|\b(ve|bir|için|ile|bu|da|de|çok|değil|gibi|daha|kadar|oldu|yeni|haber|son\s*dakika|altın|fiyat|fiyatları|belediye|başkan|başkanı|meclis|ilan|kiralık|satılık|emlak|kampanya|indirim|takipçi|çekiliş|keşfet|kesfet|sondakika|fiyatlar|yemek\s*listesi|nöbetçi|hava\s*durumu)\b/i;
// Adult / spam / people-centred posts
const BLOCK = /(\bnsfw\b|\bnude|\bnaked|\bporn|\bxxx\b|\bsex(y|i)?\b|\berotic|\bonlyfans|\bescort|\bfetish|\blingerie|\bbikini|\bswimsuit|\bbody\s*(goals|con)|\bthirst|\bbabe\b|\bhot\s*girl|\bootd\b|\boutfit|\bmodel(ing|ling)?\b|\bphotoshoot|\bselfie|\bfollow\s*(me|for)|\blink\s*in\s*bio|\bcasino|\bbahis|\bbetting|\bviagra|\bdating|\bgiveaway|\bpromo\b|\bdiscount|\bcode\b|\bfor\s*sale|\bhijab|\bpolitic|\bflag\b)/i;

async function aiOk(buf) {
  const small = await sharp(buf).resize({ width: 640, withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer();
  const prompt = 'You vet photos for the photo strip of a family-friendly Antalya (Turkey) travel guide. Answer ONLY with JSON: {"ok":true|false,"why":"short reason"}.\n' +
    'ok=true ONLY if ALL are true: (1) it is a real, scenic travel photograph (sea, beach, old town, harbour, ruins, mountains, waterfalls, nature, a hotel/resort, food, street scenes) that plausibly shows the Antalya province / Turkish Mediterranean coast; (2) no people are the main subject - no selfies, portraits, posed bodies, no revealing clothing, no close-ups of faces, at most small distant people; (3) no overlaid captions, memes, flags used as a prop, screenshots, price lists, posters, ads or news graphics; (4) nothing sexual, violent, political or offensive; (5) it is NOT clearly another city or region (Istanbul, Cappadocia balloons, Greece, etc.).\n' +
    'When in doubt, ok=false.';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': AI_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 120, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: small.toString('base64') } }, { type: 'text', text: prompt }] }] }),
    signal: AbortSignal.timeout(60000)
  });
  if (!res.ok) throw new Error('vision API ' + res.status + ' ' + (await res.text()).slice(0, 160));
  const j = await res.json();
  const txt = (j.content || []).map(c => c.text || '').join('');
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) return { ok: false, why: 'unparsable' };
  try { return JSON.parse(m[0]); } catch (e) { return { ok: false, why: 'unparsable' }; }
}

(async () => {
  const url = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
  const body = { directUrls: TAGS.map(t => `https://www.instagram.com/explore/tags/${t}/`), resultsType: 'posts', resultsLimit: limit, addParentData: false };
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(280000) });
  if (!res.ok) { console.error('Apify error', res.status, (await res.text()).slice(0, 300)); process.exit(1); }
  const items = await res.json();
  if (!Array.isArray(items)) { console.error('Unexpected Apify response'); process.exit(1); }
  const seen = new Set(), posts = [], why = {};
  const no = (r) => { why[r] = (why[r] || 0) + 1; };
  for (const it of items) {
    const code = it.shortCode || (String(it.url || '').match(/\/(?:p|reel)\/([\w-]+)/) || [])[1];
    if (!code || seen.has(code)) continue;
    const cap = it.caption || '';
    const tags = (it.hashtags || []).join(' ');
    const all = `${cap} ${tags}`;
    const place = `${it.locationName || ''} ${all}`;
    if (/video/i.test(it.type || '') || it.videoUrl || /\/reel\//.test(it.url || '')) { no('video'); continue; }
    if (!cap.trim()) { no('no caption'); continue; }
    if (NONLATIN.test(all)) { no('non-latin'); continue; }
    if (TURKISH.test(cap)) { no('turkish'); continue; }
    if (BLOCK.test(all)) { no('blocked word'); continue; }
    if ((it.hashtags || []).length > 25) { no('hashtag spam'); continue; }
    if (it.isSponsored || it.paidPartnership) { no('sponsored'); continue; }
    if (OTHER.test(place)) { no('other city'); continue; }
    if (!REGION.test(place)) { no('not Antalya'); continue; }
    const img = it.displayUrl || (it.images && it.images[0]);
    if (!img) continue;
    seen.add(code);
    posts.push({ code, img, user: it.ownerUsername || '', url: `https://www.instagram.com/p/${code}/`, likes: Number(it.likesCount) || 0 });
  }
  posts.sort((a, b) => b.likes - a.likes);
  console.log(`Scraped ${items.length}; ${posts.length} passed text rules; dropped:`, JSON.stringify(why));

  fs.mkdirSync(IMG_DIR, { recursive: true });
  const keep = []; let checks = 0;
  for (const p of posts) {
    if (keep.length >= SHOW) break;
    try {
      const r = await fetch(p.img, { signal: AbortSignal.timeout(30000) });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (AI_KEY) {
        if (checks++ >= MAX_AI_CHECKS) break;
        const v = await aiOk(buf);
        if (!v.ok) { console.log('rejected', p.code, '-', v.why); continue; }
      }
      const out = await sharp(buf).resize({ width: 900, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
      fs.writeFileSync(`${IMG_DIR}/${p.code}.webp`, out.data);
      keep.push({ code: p.code, url: p.url, user: p.user, img: `/${IMG_DIR}/${p.code}.webp`, w: out.info.width, h: out.info.height });
    } catch (e) { console.error('skip', p.code, e.message); }
  }
  if (keep.length < 4) { console.error(`Only ${keep.length} photos passed the filters; not publishing a thin feed. Previous file kept.`); process.exit(0); }
  const names = new Set(keep.map(k => `${k.code}.webp`));
  for (const f of fs.readdirSync(IMG_DIR)) if (!names.has(f)) fs.unlinkSync(`${IMG_DIR}/${f}`);
  fs.writeFileSync(OUT, JSON.stringify({ tag, updated: new Date().toISOString().slice(0, 10), posts: keep }, null, 2) + '\n');
  console.log(`Wrote ${keep.length} posts to ${OUT}`);
})().catch(e => { console.error(e); process.exit(1); });
