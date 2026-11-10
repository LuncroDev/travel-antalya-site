const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const { slugify, jsonForHtml } = require('../lib/content');
const { normalize } = require('../js/search');
test('Turkish names have stable URLs and keyboard-friendly search', () => {
  assert.equal(slugify('Kaleiçi Old Town'), 'kaleici-old-town');
  assert.equal(slugify('Kaş / Kalkan'), 'kas-kalkan');
  assert.equal(normalize('İBRADI Kaş Kaleiçi'), 'ibradi kas kaleici');
});
test('JSON-LD cannot close its script element', () => {
  assert.ok(!jsonForHtml({ title: '</script><script>alert(1)</script>' }).includes('<'));
});
test('all 19 district slugs are unique', () => {
  const districts = require('../_data/destinations.json');
  assert.equal(districts.length, 19);
  assert.equal(new Set(districts.map(d => d.slug)).size, 19);
  for (const district of districts) assert.match(district.source_url, /^https:\/\//);
});
test('hotel records have unique stable slugs and explicit source provenance', () => {
  const records = fs.readdirSync('content/hotels').filter(f => f.endsWith('.md')).map(file => matter(fs.readFileSync(path.join('content/hotels', file), 'utf8')).data);
  assert.ok(records.length >= 100);
  assert.equal(new Set(records.map(x => x.slug)).size, records.length);
  for (const item of records) {
    assert.match(item.slug, /^[a-z0-9-]+$/);
    assert.match(item.source_url, /^https:\/\//);
    assert.match(item.official_url, /^https:\/\//);
    assert.match(item.last_checked, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(item.price, undefined);
  }
  assert.equal(records.find(x => x.slug === 'akra-hotel').neighborhood, 'Antalya city');
  assert.equal(records.find(x => x.slug === 'hotel-su-aqualand').neighborhood, 'Konyaaltı');
});
test('admin understands the provenance and stable URL fields', () => {
 const schema = require('../admin/schema.js');
 for (const collectionName of ['hotels','events']) {
   const fields = schema[collectionName].fields.map(f => f.name);
   for (const field of ['source_url','last_checked']) assert.ok(fields.includes(field), `${collectionName}.${field}`);
 }
});

test('admin API only touches content and upload paths', () => {
  const src = fs.readFileSync('netlify/functions/admin.js', 'utf8');
  const allowed = new RegExp(src.match(/const ALLOWED = \/(.+)\/;/)[1]);
  for (const ok of ['content/hotels/akra-hotel.md', 'content/blog/new-post.md', 'images/uploads/photo-1.jpg']) assert.ok(allowed.test(ok), ok);
  for (const bad of ['netlify.toml', '.github/workflows/x.yml', 'content/hotels/../../x.md', '_includes/base.njk', 'admin/app.js', 'content/hotels/x.js']) assert.ok(!allowed.test(bad), bad);
});

// Remove this closure-specific guard only after verifying an official reopening.
test('museum closure guidance replaces obsolete seasonal visit suggestions', () => {
 const slugs = ['is-may-one-of-the-best-months-for-antalya-weather','what-is-antalya-weather-really-like-in-february','is-january-a-bad-time-to-visit-antalya-weather-explained-honestly','is-antalya-good-for-families-things-to-do-in-antalya-with-kids'];
 for (const slug of slugs) {
  const text = fs.readFileSync(`content/blog/${slug}.md`, 'utf8');
  assert.match(text, /temporarily closed/i);
  assert.match(text, /\/things-to-do\/antalya-museum\//);
 }
 const museum = fs.readFileSync('content/things-to-do/antalya-museum.md', 'utf8');
 assert.match(museum, /DistId=ANT&SectionId=ANT01/);
 assert.match(museum, /00:00 time fields are not visitor opening hours/);
});

test('Aspendos separates site hours, ticket office and performance admission', () => {
 const fs = require('node:fs');
 const text = fs.readFileSync('content/things-to-do/aspendos-theatre.md','utf8');
 assert.match(text,/DistId=ASP&SectionId=ASP01/);
 assert.match(text,/08:00–17:00/);
 assert.match(text,/ticket office closing at 16:30/);
 assert.match(text,/does not establish a separate last-admission rule/);
 assert.match(text,/Do not assume that a daytime archaeological-site ticket/);
 assert.match(text,/10 November 2026/);
});

test('airport shuttle advice is attributed and does not invent a timetable or tram link', () => {
 const fs=require('node:fs');
 const text=fs.readFileSync('plan-your-trip.njk','utf8');
 assert.match(text,/transportation\/transport-to-the-airport/);
 assert.match(text,/International Terminal 1 and Terminal 2/);
 assert.match(text,/does not publish shuttle frequency or operating hours/);
 assert.match(text,/not a confirmed tram connection/);
 assert.match(text,/datetime="2026-11-10"/);
});
