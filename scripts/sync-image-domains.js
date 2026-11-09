#!/usr/bin/env node
// Keeps netlify.toml's [images] remote_images allowlist in sync with the
// domains used by `photos_official` in content front matter.
// Run after adding official photos:  node scripts/sync-image-domains.js
const fs = require('node:fs'), path = require('node:path'), matter = require('gray-matter');
const root = path.resolve(__dirname, '..');
require('./validate-photo-rights')();
const hosts = new Set();
for (const dir of fs.readdirSync(path.join(root, 'content'))) {
  const full = path.join(root, 'content', dir);
  if (!fs.statSync(full).isDirectory()) continue;
  for (const f of fs.readdirSync(full).filter(n => n.endsWith('.md'))) {
    const data = matter(fs.readFileSync(path.join(full, f), 'utf8')).data;
    for (const p of data.photos_official || []) { try { hosts.add(new URL(p.src).host); } catch {} }
  }
}
const list = [...hosts].sort().map(h => `  'https://${h.replace(/\./g, '\\.')}/.*'`).join(',\n');
const block = `[images]\n  remote_images = [\n${list}\n  ]\n`;
const tomlPath = path.join(root, 'netlify.toml');
let toml = fs.readFileSync(tomlPath, 'utf8').replace(/\n?\[images\][\s\S]*?\n  \]\n/, '\n');
toml = toml.trimEnd() + '\n\n' + block;
fs.writeFileSync(tomlPath, toml);
console.log(`remote_images: ${hosts.size} domains`);
module.exports = { hosts };
