const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve('_site');
const files = fs.readdirSync(root, { recursive: true }).filter(f => f.endsWith('.html') && !f.startsWith('admin/'));
const seen = new Set(); let links = 0, schemaCount = 0;
const decode = value => value.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
for (const file of files) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(!html.includes('{{'), `Unrendered template: ${file}`);
  const canonical = html.match(/rel="canonical" href="([^"]+)"/);
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  assert.ok(title && title.trim() && !title.trim().startsWith('|'), `Empty title: ${file}`);
  assert.ok(canonical, `No canonical: ${file}`);
  assert.ok(!seen.has(canonical[1]), `Duplicate canonical: ${canonical[1]}`); seen.add(canonical[1]);
  assert.ok(html.includes('<main id="main-content">'), `No main landmark: ${file}`);
  assert.ok(html.includes('<h1'), `No heading: ${file}`);
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { JSON.parse(match[1]); schemaCount++; }
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
    const url = decodeURIComponent(decode(match[1]));
    const target = path.join(root, url.endsWith('/') ? url + 'index.html' : url);
    assert.ok(fs.existsSync(target), `Broken local link ${url} from ${file}`); links++;
  }
}
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const file of files) {
 const html = fs.readFileSync(path.join(root,file),'utf8');
 const canonical = html.match(/rel="canonical" href="([^"]+)"/)[1];
 assert.equal(sitemap.includes(`<loc>${canonical}</loc>`), !html.includes('content="noindex,follow"'), `Sitemap mismatch: ${file}`);
}
const redirects = fs.readFileSync('_redirects','utf8').split('\n').filter(line => line && !line.startsWith('#')).map(line => line.trim().split(/\s+/));
const map = new Map(redirects.map(([from,to]) => [from,to]));
for (const [from] of map) { let current=from; const visited=new Set(); while(map.has(current)){ assert.ok(!visited.has(current), `Redirect cycle from ${from}`);visited.add(current);current=map.get(current); } }
console.log(`Validated ${files.length} HTML pages, ${links} local links/assets, ${schemaCount} JSON-LD blocks, sitemap coverage and redirect cycles.`);
