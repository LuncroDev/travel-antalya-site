const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),matter=require('gray-matter');
const {photoGallery,districtFor,relatedItems}=require('../lib/discovery');
const photos=require('../_data/editorialPhotos.json');
const records=kind=>fs.readdirSync(`content/${kind}`).filter(f=>f.endsWith('.md')).map(f=>matter(fs.readFileSync(`content/${kind}/${f}`,'utf8')).data);
test('all published editorial images have traceable reuse rights and local files',()=>{assert.ok(photos.length>=30);for(const p of photos){assert.ok(fs.existsSync('.'+p.src),p.src);assert.match(p.source_url,/^https:\/\/(commons.wikimedia.org|www.pexels.com|www.flickr.com)\//);assert.ok(p.license&&p.author&&p.alt&&p.caption);assert.ok(p.width>0&&p.height>0);if(p.kind==='property')assert.ok(p.property_slug&&p.historical);}});
test('property pictures never leak into another property destination gallery',()=>{const actual=photoGallery({slug:'rixos-premium-belek',district_slug:'serik'},photos);assert.equal(actual.filter(p=>!p.contextual).length,4);assert.equal(actual.filter(p=>p.contextual).length,4);const other=photoGallery({slug:'paloma-grida',district_slug:'serik'},photos);assert.equal(other.length,4);assert.ok(other.every(p=>p.contextual&&p.kind==='destination'));});
test('25 restaurants and golf profiles have source and official links',()=>{for(const kind of ['restaurants','golf']){const rows=records(kind);assert.ok(rows.length>=(kind==='restaurants'?25:8));assert.equal(new Set(rows.map(x=>x.slug)).size,rows.length);for(const r of rows){if(r.identity_unverified){assert.ok(r.status_note);}else{assert.match(r.official_url,/^https:\/\//);}assert.match(r.source_url,/^https:\/\//);assert.match(r.last_checked,/^\d{4}-\d{2}-\d{2}$/);assert.ok(r.excerpt&&r.district_slug);}}});
test('regional discovery retains actual district relationships',()=>{assert.equal(districtFor({neighborhood:'Kaş'}),'kas');assert.equal(districtFor({neighborhood:'Antalya city',district_slug:'konyaalti'}),'konyaalti');assert.deepEqual(relatedItems([{data:{title:'A',district_slug:'kas'}},{data:{title:'B',district_slug:'alanya'}}],{title:'C',district_slug:'kas'},1).map(i=>i.data.title),['A']);});
test('CMS can maintain imported categories without forcing invented fields',()=>{const cfg=require('js-yaml').load(fs.readFileSync('admin/config.yml','utf8'));for(const kind of ['restaurants','events']){const c=cfg.collections.find(c=>c.name===kind),category=c.fields.find(f=>f.name==='category');assert.equal(category.widget,'string');assert.ok(c.fields.some(f=>f.name==='slug'));}const restaurant=cfg.collections.find(c=>c.name==='restaurants');assert.equal(restaurant.fields.find(f=>f.name==='signature_dishes').required,false);assert.equal(restaurant.fields.find(f=>f.name==='official_url').required,false);});

test('restaurant hotel links resolve to supported traveler areas',()=>{const {hotelAreaFor}=require('../lib/discovery');const areas=new Set(records('hotels').map(h=>h.neighborhood));for(const kind of ['restaurants','events','golf'])for(const row of records(kind)){const area=hotelAreaFor(row);assert.ok(!area||areas.has(area),`${row.title}: ${area}`);}assert.equal(hotelAreaFor({neighborhood:'Kaleiçi / Mescit Sokak',district_slug:'muratpasa'}),'Kaleiçi');});


test('selected hotel galleries retain verified source dates, rights and four-photo limits',()=>{
 const report=require('../docs/hotel-photo-sources.json');
 assert.equal(report.expected_selected_photos,61);
 assert.equal(report.selected_photos,61);
 assert.equal(report.hotel_count,20);
 const reviewed=photos.filter(p=>p.review_batch==='hotel-photo-review-2026-11-09');
 assert.equal(reviewed.length,61);
 const normalized=p=>decodeURIComponent(p.source_url).replaceAll('_',' ').replace(/\/$/,'');
 assert.equal(new Set(reviewed.map(normalized)).size,reviewed.length);
 for(const p of reviewed){assert.ok(p.archive_warning&&p.date_basis&&p.changes&&p.preserve_framing);assert.equal(p.historical,true);assert.match(p.license_url,/^https:\/\/(?:creativecommons.org\/licenses\/|www.pexels.com\/license\/)/);}
 for(const slug of new Set(reviewed.map(p=>p.property_slug))){const gallery=photoGallery({slug},photos);assert.ok(gallery.length<=4);assert.ok(gallery.every(p=>p.property_slug===slug&&!p.contextual));}
 const watermark=reviewed.find(p=>p.source_url.includes('22876203861'));
 if(watermark)assert.ok(watermark.preserve_framing&&watermark.changes.includes('watermark retained'));
 const uncertain=reviewed.find(p=>p.id==='alp-pasa-night-facade-archive');if(uncertain)assert.match(uncertain.archive_warning,/2005 and 2006/);
 const lara=records('hotels').find(p=>p.slug==='lara-barut-collection');assert.match(lara.title,/BAYOU Lara/);assert.equal(lara.official_url,'https://bayoulara.com/en');
});

test('photo captions and warnings contain visitor copy, not editorial instructions',()=>{
 const instruction=/show the capture year|preserve source date notes|do not present|must not be used as the photo date|use only with|do not use it to promise|show as '/i;
 for(const photo of photos)for(const key of ['caption','archive_warning','changes','usage_note'])assert.doesNotMatch(photo[key]||'',instruction,photo.id+' '+key);
});
