#!/usr/bin/env node
// Merges docs/import/official-photos.json into venue front matter (photos_official),
// merging only exact assets with recorded reuse and identity approval.
'use strict';
const fs = require('node:fs'), path = require('node:path'), matter = require('gray-matter');
const root = path.resolve(__dirname, '../..');
const { registry, approvedPhoto, isExcluded } = require('../../lib/photo-rights');
const rights = registry();
const data = JSON.parse(fs.readFileSync(path.join(root, 'docs/import/official-photos.json'), 'utf8'));
let updated = 0, skipped = [];
for (const [key, v] of Object.entries(data)) {
  const [kind, slug] = key.split('/');
  if (isExcluded(slug, null, rights)) { skipped.push(key + ' (excluded)'); continue; }
  const dir = path.join(root, 'content', kind);
  const file = fs.readdirSync(dir).find(f => { const d = matter(fs.readFileSync(path.join(dir, f), 'utf8')).data; return (d.slug || f.replace(/\.md$/, '')) === slug; });
  if (!file) continue;
  const full = path.join(dir, file);
  const doc = matter(fs.readFileSync(full, 'utf8'));
  if (doc.data.photos_official?.length) continue;                    // never overwrite editor choices
  let imgs = [...new Set(v.images || [])].filter(u => approvedPhoto(slug, u, rights));
  if (!imgs.length) { skipped.push(key + ' (rights pending)'); continue; }
  imgs = imgs.slice(0, 4);
  if (!imgs.length) { skipped.push(key); continue; }
  doc.data.photos_official = imgs.map(src => ({ src }));
  doc.data.photo_source = v.page;
  fs.writeFileSync(full, matter.stringify(doc.content, doc.data));
  updated++;
}
console.log(`photos_official added: ${updated}; skipped: ${skipped.length}`, skipped.join(', '));
