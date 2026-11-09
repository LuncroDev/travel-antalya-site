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
  assert.equal(records.length, 28);
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
test('CMS understands the new provenance and stable URL fields', () => {
 const yaml = require('js-yaml'); const config = yaml.load(fs.readFileSync('admin/config.yml', 'utf8'));
 for (const collectionName of ['hotels','events']) {
   const fields = config.collections.find(c => c.name === collectionName).fields.map(f => f.name);
   for (const field of ['source_url','last_checked']) assert.ok(fields.includes(field), `${collectionName}.${field}`);
 }
});
