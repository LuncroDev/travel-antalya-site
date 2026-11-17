'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),matter=require('gray-matter');
const {cardPhoto,photoGalleryFor}=require('../lib/ui');
const {JSDOM}=require('jsdom');
const hotel=matter(fs.readFileSync('content/hotels/miracle-resort-hotel.md','utf8')).data;
test('Miracle gallery has three distinct licensed and dated property images first',()=>{
 const photos=photoGalleryFor(hotel).slice(0,3);
 assert.equal(new Set(photos.map(p=>p.src)).size,3);
 for(const p of photos){assert.equal(p.property_slug,hotel.slug);assert.equal(p.contextual,false);assert.equal(p.license,'CC BY-SA 4.0');assert.match(p.date_taken,/^2023-/);assert.match(p.caption,/2023/);assert.match(p.archive_warning,/2026/);assert.ok(p.author&&p.source_url&&p.license_url&&p.changes);assert.ok(fs.existsSync('.'+p.src));}
});
test('June weather hero remains explicitly illustrative, not a June observation',()=>{
 const blog=matter(fs.readFileSync('content/blog/antalya-weather-in-june-perfect-summer-or-too-hot-to-explore.md','utf8')).data;
 const photo=cardPhoto(blog);assert.equal(photo.contextual,true);assert.match(photo.areaLabel,/not a June weather observation/);assert.match(photo.caption,/March 2023/);
});
test('built Miracle profile renders three credited photos and archival caveat',()=>{
 const doc=new JSDOM(fs.readFileSync('_site/hotels/miracle-resort-hotel/index.html','utf8')).window.document;
 const figures=[...doc.querySelectorAll('.detail-gallery > figure')];assert.equal(figures.length,3);
 for(const f of figures){assert.match(f.querySelector('figcaption').textContent,/2023/);assert.ok(f.querySelector('a[href*="creativecommons.org/licenses/by-sa/4.0"]'));assert.ok(f.querySelector('a[href*="commons.wikimedia.org/wiki/File:"]'));assert.match(f.querySelector('img').getAttribute('srcset'),/640w.*1280w/);}
 assert.match(doc.body.textContent,/predate the hotel’s advertised 2026 new building/);
 assert.equal(doc.querySelectorAll('h1').length,1);
});
