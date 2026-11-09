#!/usr/bin/env node
// Merges docs/import/official-photos.json into venue front matter (photos_official),
// keeping only images that look like this venue's own photos.
'use strict';
const fs = require('node:fs'), path = require('node:path'), matter = require('gray-matter');
const root = path.resolve(__dirname, '../..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'docs/import/official-photos.json'), 'utf8'));
const NOISE = /haber|news|teklif|firsat|fırsat|tui|kit[s_-]|press|basin|istanbul|bodrum|izmir|cappadocia|kapadokya|cyprus|kibris|dubai|egypt|menu-list|card-promo|jazz|meze-fest|wedding-honeymoon|indirim|campaign|kampanya|early|erken|newsletter|team|staff|ceo|chef-portrait|career|kariyer/i;
const GENERIC = new Set(['hotel', 'hotels', 'resort', 'beach', 'side', 'belek', 'lara', 'kemer', 'antalya', 'alanya', 'club', 'luxury', 'deluxe', 'premium', 'collection', 'golf', 'spa', 'the', 'and', 'restaurant', 'park', 'palace', 'kirman', 'barut', 'trendy', 'paloma', 'delphin', 'gloria', 'sueno', 'sherwood', 'titanic', 'limak', 'rixos', 'nirvana', 'voyage', 'papillon', 'kaya', 'akka', 'akra', 'sunis', 'star', 'grand', 'royal', 'exclusive', 'hotels-resorts']);
const tidy = u => u.replace(/\?jxl.*$/, '').replace(/([^:])\/\/+/g, '$1/');
let updated = 0, skipped = [];
for (const [key, v] of Object.entries(data)) {
  const [kind, slug] = key.split('/');
  const dir = path.join(root, 'content', kind);
  const file = fs.readdirSync(dir).find(f => { const d = matter(fs.readFileSync(path.join(dir, f), 'utf8')).data; return (d.slug || f.replace(/\.md$/, '')) === slug; });
  if (!file) continue;
  const full = path.join(dir, file);
  const doc = matter(fs.readFileSync(full, 'utf8'));
  if (doc.data.photos_official?.length) continue;                    // never overwrite editor choices
  let imgs = [...new Set((v.images || []).map(tidy))].filter(u => !NOISE.test(decodeURIComponent(u)));
  const tokens = slug.split('-').filter(t => t.length >= 4 && !GENERIC.has(t));
  const own = imgs.filter(u => tokens.some(t => decodeURIComponent(u).toLowerCase().includes(t)));
  if (own.length) imgs = own;                                         // chain sites: keep this property's images
  else if (tokens.length && imgs.length > 1 && /paloma|trendy|delphin|gloria|kirman|sueno|sherwood|titanic|limak|nirvana|voyage|papillon|kaya|akka|akra|sidestar|ichotels|alibey|cdn-website/.test(v.page)) imgs = imgs.slice(0, 1);
  imgs = imgs.slice(0, 4);
  if (!imgs.length) { skipped.push(key); continue; }
  doc.data.photos_official = imgs.map(src => ({ src }));
  doc.data.photo_source = v.page;
  fs.writeFileSync(full, matter.stringify(doc.content, doc.data));
  updated++;
}
console.log(`photos_official added: ${updated}; skipped: ${skipped.length}`, skipped.join(', '));
