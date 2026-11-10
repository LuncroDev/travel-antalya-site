#!/usr/bin/env node
// Downloads venue photos whose servers refuse Netlify Image CDN fetches, so they
// can be served from the site itself (images/uploads -> images/opt WebP copies).
// Runs on GitHub's runners via .github/workflows/selfhost-photos.yml.
//
// docs/import/selfhost.json: { "<kind>/<slug>": { "page": url, "images": [url, ...] } }
// Writes images/uploads/venue-<slug>-<n>.<ext> and records results in
// docs/import/selfhost-result.json. Existing files are kept.
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const out = p => path.join(root, p);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const EXT = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png', 'image/avif': 'avif' };

async function fetchImage(url, referer) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: {
      'User-Agent': UA, Accept: 'image/avif,image/webp,image/jpeg,image/*;q=0.8', 'Accept-Language': 'en,tr;q=0.8', Referer: referer || url } });
    const type = (r.headers.get('content-type') || '').split(';')[0].trim();
    if (!r.ok || !EXT[type]) return { error: `${r.status} ${type || 'no type'}` };
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 15000 || buf.length > 12e6) return { error: `unexpected size ${buf.length}` };
    return { buf, ext: EXT[type] };
  } catch (e) { return { error: String(e.message || e) }; }
  finally { clearTimeout(t); }
}

async function main() {
  const queue = JSON.parse(fs.readFileSync(out('docs/import/selfhost.json'), 'utf8'));
  const resultFile = out('docs/import/selfhost-result.json');
  const result = fs.existsSync(resultFile) ? JSON.parse(fs.readFileSync(resultFile, 'utf8')) : {};
  fs.mkdirSync(out('images/uploads'), { recursive: true });
  for (const [key, v] of Object.entries(queue)) {
    const slug = key.split('/')[1];
    const saved = [], errors = [];
    for (const [i, url] of (v.images || []).entries()) {
      const existing = fs.readdirSync(out('images/uploads')).find(f => f.startsWith(`venue-${slug}-${i + 1}.`));
      if (existing) { saved.push(`/images/uploads/${existing}`); continue; }
      const got = await fetchImage(url, v.page);
      if (got.error) { errors.push(`${url}: ${got.error}`); continue; }
      const name = `venue-${slug}-${i + 1}.${got.ext}`;
      fs.writeFileSync(out(`images/uploads/${name}`), got.buf);
      saved.push(`/images/uploads/${name}`);
    }
    result[key] = { page: v.page, saved, errors };
    console.log('selfhost', key, saved.length, errors.join(' | '));
  }
  fs.writeFileSync(resultFile, JSON.stringify(result, null, 1));
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { fetchImage };
