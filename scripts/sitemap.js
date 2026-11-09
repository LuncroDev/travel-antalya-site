const fs = require('node:fs');
const path = require('node:path');
module.exports = function generateSitemap() {
  const root = path.resolve('_site'), urls = new Set();
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'admin') continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.html')) {
        const html = fs.readFileSync(file, 'utf8');
        if (/name="robots"[^>]*content="noindex/.test(html)) continue;
        const canonical = html.match(/rel="canonical" href="([^"]+)"/);
        if (canonical && !canonical[1].includes('{{')) urls.add(canonical[1]);
      }
    }
  }
  walk(root);
  const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].sort().map(url => `  <url><loc>${escape(url)}</loc></url>`).join('\n')}\n</urlset>\n`);
};
