'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { approvalErrors, approvedPhoto, selectedOfficialPhotos, registry } = require('../lib/photo-rights');
const { officialPhotos, cardPhoto, photoGalleryFor } = require('../lib/ui');
const validate = require('../scripts/validate-photo-rights');
const valid = () => ({ id:'fixture',venue_slug:'fixture-hotel',status:'approved',src:'https://example.com/photo.jpg',source_url:'https://example.com/source',license_url:'https://creativecommons.org/licenses/by/4.0/',evidence_url:'https://example.com/grant',author:'Test photographer',alt:'Hotel facade',caption:'Hotel facade',license:'CC BY 4.0',changes:'Resized and responsively cropped.',reviewed_by:'Test editor',reviewed_on:'2026-11-09',expires_on:null,width:1600,height:1000,permitted_use:{commercial_editorial:true,web_display:true,resize_convert:true,responsive_crop:true,cdn_cache:true} });
test('official origin alone never constitutes approval', () => {
  // Without a licence record or an owner decision, an official URL is never enough.
  assert.deepEqual(selectedOfficialPhotos({slug:'fixture-hotel',photos_official:[{src:'https://example.com/photo.jpg'}]},{approved:[],excluded:[]}),[]);
  assert.ok(approvalErrors({ ...valid(), license:'Official website' }).length);
  for (const field of ['evidence_url','license_url','author','reviewed_by','expires_on']) { const p=valid(); delete p[field]; assert.ok(approvalErrors(p).length,field); }
});
test('approvals are exact-asset, exact-property and current', () => {
  const p=valid(), rights={approved:[p],excluded:[]};
  assert.deepEqual(approvalErrors(p,'2026-11-10'),[]);
  assert.equal(approvedPhoto(p.venue_slug,p.src,rights,'2026-11-10'),p);
  assert.equal(approvedPhoto('sister-hotel',p.src,rights,'2026-11-10'),null);
  assert.equal(approvedPhoto(p.venue_slug,p.src+'?different=1',rights,'2026-11-10'),null);
  p.expires_on='2026-11-09';assert.equal(approvedPhoto(p.venue_slug,p.src,rights,'2026-11-10'),null);
  p.expires_on=null;p.permitted_use.cdn_cache=false;assert.equal(approvedPhoto(p.venue_slug,p.src,rights,'2026-11-10'),null);
});
test('exclusions beat approvals and cannot be reused at a different venue', () => {
  const p=valid(),rights={approved:[p],excluded:[{venue_slug:'other-hotel',status:'excluded',images:[p.src]}]};
  assert.equal(approvedPhoto(p.venue_slug,p.src,rights),null);
  rights.excluded=[{venue_slug:p.venue_slug,status:'excluded',images:[]}];
  assert.deepEqual(selectedOfficialPhotos({slug:p.venue_slug,photos_official:[{src:p.src}]},rights),[]);
});
test('build rejects undocumented official selections', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'photo-rights-'));
  try { fs.mkdirSync(path.join(root,'content'));fs.writeFileSync(path.join(root,'content/hotel.md'),'---\nslug: fixture-hotel\nphotos_official:\n- src: https://example.com/photo.jpg\n---\n');
    assert.throws(()=>validate(root,{approved:[],excluded:[]}),/undocumented/);
    assert.equal(validate(root,{approved:[valid()],excluded:[]}),1);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
test('every quarantined venue has documented replacements and correct area labels', () => {
  const matter=require('gray-matter');const pending=require('../docs/import/official-photo-pending.json').venues;
  assert.equal(Object.keys(pending).length,117);assert.equal(registry().excluded.length,6);
  for (const key of Object.keys(pending)) {
    const data=matter(fs.readFileSync(pending[key].source_file,'utf8')).data;
    if (data.photos_official?.length) { assert.equal(officialPhotos(data).length,data.photos_official.length,key); continue; }
    const card=cardPhoto(data),gallery=photoGalleryFor(data);
    assert.ok(card&&gallery.length>=1,key);
    for (const p of [card,...gallery]) { assert.ok(p.author&&p.license&&p.source_url&&p.changes,p.id);assert.ok(fs.existsSync('.'+p.src),p.src);if(!p.contextual)assert.ok(p.property_slug===data.slug||(p.property_slugs||[]).includes(data.slug),p.id); }
    if(card.contextual)assert.equal(card.areaLabel,card.caption,key);
  }
});
test('candidate importer cannot restore pending or excluded photos', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'photo-import-'));
  const merge=require('../scripts/import/official');
  try {
    fs.mkdirSync(path.join(root,'content/hotels'),{recursive:true});fs.mkdirSync(path.join(root,'docs/import'),{recursive:true});
    const file=path.join(root,'content/hotels/fixture-hotel.md');
    fs.writeFileSync(file,'---\nslug: fixture-hotel\n---\n');
    fs.writeFileSync(path.join(root,'docs/import/official-photos.json'),JSON.stringify({'hotels/fixture-hotel':{page:'https://example.com',images:[valid().src]}}));
    assert.equal(merge(root,{approved:[],excluded:[]}).updated,0);
    assert.equal(merge(root,{approved:[valid()],excluded:[{venue_slug:'fixture-hotel',status:'excluded',images:[]}]}).updated,0);
    assert.equal(merge(root,{approved:[valid()],excluded:[]}).updated,1);
    assert.equal(merge(root,{approved:[valid()],excluded:[]}).updated,0);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('responsive photo candidates do not overstate native resolution', () => {
  const {srcset}=require('../lib/ui');
  const photos=require('../_data/editorialPhotos.json').filter(p=>p.width<1280);
  assert.ok(photos.length>0);
  for(const p of photos)for(const candidate of srcset(p.src).split(',').filter(Boolean))assert.ok(Number(candidate.trim().split(' ').pop().replace('w',''))<=p.width,p.id);
});

test('generated images cannot bypass rights checks through raw HTML or CDN URLs',()=>{
  const check=require('../scripts/validate-built-photo-rights');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'photo-build-'));
  try {
    fs.writeFileSync(path.join(root,'index.html'),'<img src="/.netlify/images?url=https%3A%2F%2Fexample.com%2Fphoto.jpg&amp;w=1280">');
    assert.throws(()=>check(root,{approved:[],excluded:[]}),/without current rights approval/);
    check(root,{approved:[valid()],excluded:[]});
    fs.writeFileSync(path.join(root,'index.html'),'<img src="/images/blocked.jpg">');
    assert.throws(()=>check(root,{approved:[],excluded:[{status:'excluded',images:['/images/blocked.jpg']}]}),/without current rights approval/);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('owner-accepted venue photos render with credit, but exclusions still win', () => {
  const { ownerAccepted } = require('../lib/photo-rights');
  const rights = { approved: [], excluded: [{ venue_slug: 'blocked-hotel', status: 'excluded', images: [] }],
    owner_acceptance: { status: 'accepted', auto_accept_listed: true },
    owner_accepted: [{ venue_slug: 'fixture-hotel', venue_title: 'Fixture Hotel', src: 'https://example.com/a.jpg', source_page: 'https://example.com/' }] };
  const p = approvedPhoto('fixture-hotel', 'https://example.com/a.jpg', rights);
  assert.ok(p && /not a licence/.test(p.license) && p.source_url === 'https://example.com/');
  assert.equal(approvedPhoto('sister-hotel', 'https://example.com/a.jpg', rights), null);
  const data = { slug: 'fixture-hotel', title: 'Fixture Hotel', official_url: 'https://example.com/', photos_official: [{ src: 'https://cdn.example.com/b.jpg' }] };
  assert.equal(selectedOfficialPhotos(data, rights).length, 1);
  assert.equal(selectedOfficialPhotos({ ...data, slug: 'blocked-hotel' }, rights).length, 0);
  assert.equal(ownerAccepted('fixture-hotel', 'https://example.com/a.jpg', { ...rights, owner_acceptance: { status: 'revoked' } }), null);
});
