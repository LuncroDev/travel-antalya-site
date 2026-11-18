'use strict';
// Weekly: pulls recent public #antalya posts with Apify's apify/instagram-scraper,
// filters them, and writes only post LINKS to _data/instagram.json.
// The site shows them with Instagram's own embed, so images stay on Instagram.
// Needs env APIFY_TOKEN. Optional: IG_HASHTAG (default antalya), IG_LIMIT (default 60).
const fs = require('node:fs');
const token = process.env.APIFY_TOKEN;
if (!token) { console.error('APIFY_TOKEN is not set'); process.exit(1); }
const tag = (process.env.IG_HASHTAG || 'antalya').replace(/^#/, '');
const limit = Number(process.env.IG_LIMIT || 60);
const OUT = '_data/instagram.json';

// Caption words that keep a post out (adult / spam). Images are NOT inspected.
const BLOCK = /(\bnsfw\b|\bnude|\bnaked|\bporn|\bxxx\b|\bsex(y|i)?\b|\berotic|\bonlyfans|\bescort|\bfetish|\blingerie|\bbikini\s*model|\bçıplak|\bporno|\bseks|\berotik|\bescort|\bmasaj\s*salon|\bsüt\s*sağ|\bcasino|\bbahis|\bbet\b|\bbetting|\bviagra|\bdating|\bhot\s*girl)/i;

(async () => {
  const url = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
  const body = { directUrls: [`https://www.instagram.com/explore/tags/${tag}/`], resultsType: 'posts', resultsLimit: limit, addParentData: false };
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
    if ((it.hashtags || []).length > 25) continue;           // hashtag-stuffing spam
    if (it.isSponsored || it.paidPartnership) continue;
    seen.add(code);
    posts.push({ code, url: `https://www.instagram.com/${it.type === 'Video' && /\/reel\//.test(it.url || '') ? 'reel' : 'p'}/${code}/`, likes: Number(it.likesCount) || 0 });
  }
  posts.sort((a, b) => b.likes - a.likes);
  const keep = posts.slice(0, 12).map(({ code, url }) => ({ code, url }));
  if (!keep.length) { console.error('No usable posts; keeping the previous file.'); process.exit(0); }
  fs.writeFileSync(OUT, JSON.stringify({ tag, updated: new Date().toISOString().slice(0, 10), posts: keep }, null, 2) + '\n');
  console.log(`Wrote ${keep.length} posts (from ${items.length}) to ${OUT}`);
})().catch(e => { console.error(e); process.exit(1); });
