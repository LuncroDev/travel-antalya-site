#!/usr/bin/env node
// Converts imported Google Docs (docs/import/raw/NN.md) into blog posts and
// registers their Wikimedia Commons photos in _data/editorialPhotos.json.
// Existing posts with the same title keep their URL; only body/photos update.
'use strict';
const fs = require('node:fs'), path = require('node:path'), matter = require('gray-matter');
const root = path.resolve(__dirname, '../..');
const rel = p => path.join(root, p);
const { slugify } = require('../../lib/content');
const queue = JSON.parse(fs.readFileSync(rel('docs/import/queue.json'), 'utf8'));
const commons = fs.existsSync(rel('docs/import/commons.json')) ? JSON.parse(fs.readFileSync(rel('docs/import/commons.json'), 'utf8')) : {};
const photosFile = rel('_data/editorialPhotos.json');
const photos = JSON.parse(fs.readFileSync(photosFile, 'utf8'));
const today = new Date().toISOString().slice(0, 10);

function clean(md) {
  return md
    .replace(/\r/g, '')
    .replace(/^\[image\d+\]:\s*<data:[^>]+>\s*$/gim, '')        // embedded image data
    .replace(/!\[[^\]]*\]\[image\d+\]/g, '')
    .replace(/!\[[^\]]*\]\(data:[^)]+\)/g, '')
    .replace(/\\([-.!#*_()[\]+>`~|=])/g, '$1')                    // Docs escapes
    .replace(/ /g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parse(md) {
  let lines = clean(md).split('\n');
  let title = '', meta = {};
  const metaRe = /^\**\s*(meta\s*title|seo\s*title|meta\s*description|focus\s*key\s*(word|phrase)|keyword|slug|url)\s*[:：]\**\s*(.*)$/i;
  lines = lines.filter(l => { const m = l.replace(/^#+\s*/, '').match(metaRe); if (m) { meta[m[1].toLowerCase().replace(/\s+/g, '')] = m[3].replace(/\*+/g, '').trim(); return false; } return true; });
  const h1 = lines.findIndex(l => /^#\s+/.test(l));
  if (h1 >= 0) { title = lines[h1].replace(/^#\s+/, '').replace(/\*+/g, '').trim(); lines.splice(h1, 1); }
  else { const first = lines.findIndex(l => l.trim()); title = lines[first].replace(/^#+\s*/, '').replace(/\*+/g, '').trim(); lines.splice(first, 1); }
  // Body headings: H1 -> H2; strip bold wrappers from headings.
  let body = lines.map(l => l.replace(/^#\s+/, '## ').replace(/^(#{2,4}\s+)\*\*(.*)\*\*\s*$/, '$1$2')).join('\n').trim();
  const firstPara = body.split('\n\n').find(p => p.trim() && !p.startsWith('#')) || '';
  const excerpt = (meta.metadescription || firstPara.replace(/[*_`#>[\]]/g, '').replace(/\(http[^)]+\)/g, '')).replace(/\s+/g, ' ').trim();
  return { title, body, excerpt: excerpt.length > 158 ? excerpt.slice(0, 155).replace(/\s+\S*$/, '') + '…' : excerpt, meta };
}

function registerPhoto(c) {
  if (photos.some(p => p.id === c.id)) return;
  const caption = (c.description || c.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '').replace(/[_-]+/g, ' ')).slice(0, 140);
  const height = c.width && c.height ? Math.round(1600 * c.height / c.width) : 1067;
  photos.push({ id: c.id, src: c.src, alt: caption, caption, region: null, kind: 'destination', author: c.author,
    license: c.license, licenseUrl: c.licenseUrl, sourceUrl: c.page, license_url: c.licenseUrl || c.page, source_url: c.page,
    width: 1600, height, changes: 'Resized to 1600 px wide; displayed with responsive cropping.', verifiedOn: today, notPropertyPhotography: true });
}

const existing = new Map(fs.readdirSync(rel('content/blog')).filter(f => f.endsWith('.md')).map(f => {
  const d = matter(fs.readFileSync(rel('content/blog/' + f), 'utf8')).data; return [slugify(d.title || ''), f];
}));
const report = [];
queue.blogs.forEach((b, idx) => {
  const rawFile = rel(`docs/import/raw/${String(b.n).padStart(2, '0')}.md`);
  if (!fs.existsSync(rawFile)) { report.push([b.n, 'missing raw']); return; }
  const { title, body, excerpt, meta } = parse(fs.readFileSync(rawFile, 'utf8'));
  const pics = (commons[b.n] || []); pics.forEach(registerPhoto);
  const key = slugify(title);
  const match = existing.get(key) || [...existing.entries()].find(([k]) => k.startsWith(key.slice(0, 40)) || key.startsWith(k.slice(0, 40)))?.[1];
  const date = new Date(Date.now() - (queue.blogs.length - idx) * 86400000);
  let file, data;
  if (match) {
    file = rel('content/blog/' + match);
    data = matter(fs.readFileSync(file, 'utf8')).data;
  } else {
    const slug = (meta.slug || meta.url || key).replace(/^.*\//, '').replace(/[^a-z0-9-]/g, '').slice(0, 70) || key.slice(0, 70);
    file = rel(`content/blog/${slug}.md`);
    data = { title, slug, date: date.toISOString().slice(0, 10) + 'T09:00:00+03:00', date_display: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), category: b.category, featured: false };
  }
  data.title = title || data.title;
  data.excerpt = excerpt || data.excerpt;
  data.focus_keyword = meta.focuskeyword || meta.focuskeyphrase || meta.keyword || b.keyword;
  if (meta.metatitle || meta.seotitle) data.seo_title = meta.metatitle || meta.seotitle;
  if (pics[0]) { data.photo_id = pics[0].id; delete data.cover; }
  if (pics.length > 1) data.inline_photos = pics.slice(1).map(p => p.id);
  data.source_doc = `https://docs.google.com/document/d/${b.doc}/edit`;
  fs.writeFileSync(file, matter.stringify('{% raw %}\n' + body + '\n{% endraw %}\n', data));
  report.push([b.n, match ? 'updated' : 'new', path.basename(file), body.split(/\s+/).length + ' words', pics.length + ' photos']);
});
fs.writeFileSync(photosFile, JSON.stringify(photos, null, 1) + '\n');
console.log(report.map(r => r.join(' | ')).join('\n'));
