'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs');
const {JSDOM}=require('jsdom');
const matter=require('gray-matter');
const {photoGalleryFor,cardPhoto,matchedVenuePhotos,matchedVenuePhoto,opt}=require('../lib/ui');
const pending=require('../docs/import/official-photo-pending.json').venues;
test('all remediated heroes use the documented replacement and clear captions',()=>{
  for(const key of Object.keys(pending)) {
    const data=matter(fs.readFileSync(pending[key].source_file,'utf8')).data;
    const expected=(key.startsWith('restaurants/') ? matchedVenuePhotos(data) : photoGalleryFor(data)).slice(0,3);
    const doc=new JSDOM(fs.readFileSync('_site/'+key+'/index.html','utf8')).window.document;
    const figures=[...doc.querySelectorAll('.detail-gallery figure')];
    assert.equal(figures.length,expected.length<3?Math.min(expected.length,1):3,key);
    for(let i=0;i<figures.length;i++) {
      const f=figures[i], p=expected[i], img=f.querySelector('img');
      assert.equal(img.getAttribute('src'),opt(p.src,i===0?1280:640),key);
      assert.ok(f.textContent.includes(p.author)&&f.textContent.includes(p.license)&&f.textContent.includes(p.changes),key);
      if(p.contextual)assert.ok(f.querySelector('figcaption').textContent.startsWith('Area photo · '),key);
      if(p.preserve_framing){assert.equal(img.style.objectFit,'contain',key);assert.equal(img.style.transform,'none',key);}
      if(p.archive_warning||p.usage_note)assert.ok(f.textContent.includes(p.archive_warning||p.usage_note),key);
      assert.equal(f.querySelectorAll('a[href=""]').length,0,key);
    }
    doc.defaultView.close();
  }
});
test('no pending official photo is embedded anywhere in the generated site',()=>{
  const approved=new Set(require('../lib/photo-rights').registry().approved.filter(p=>!require('../lib/photo-rights').approvalErrors(p).length).map(p=>p.src));
  const rights=require('../lib/photo-rights').registry();
  if(rights.owner_acceptance&&rights.owner_acceptance.status==='accepted')for(const p of rights.owner_accepted||[])approved.add(p.src);
  const sources=new Set(Object.values(pending).flatMap(p=>p.images).filter(src=>!approved.has(src)));
  for(const file of fs.readdirSync('_site',{recursive:true}).filter(f=>f.endsWith('.html'))) {
    const html=fs.readFileSync('_site/'+file,'utf8');
    for(const src of sources)assert.ok(!html.includes(src)&&!html.includes(encodeURIComponent(src)),`${file}: ${src}`);
    assert.ok(!html.includes('Official website</a>'),file);
  }
});
test('venue cards keep explicit area labels and property framing',()=>{
  for(const kind of ['hotels','restaurants','golf']) {
    const doc=new JSDOM(fs.readFileSync('_site/'+kind+'/index.html','utf8')).window.document;
    for(const card of doc.querySelectorAll('[data-hotel], [data-venue]')) {
      const slug=card.querySelector('h3 a').getAttribute('href').split('/')[2];
      const data=fs.readdirSync('content/'+kind).filter(f=>f.endsWith('.md')).map(f=>matter(fs.readFileSync(`content/${kind}/${f}`,'utf8')).data).find(p=>p.slug===slug),p=kind==='restaurants' ? matchedVenuePhoto(data) : cardPhoto(data);
      if(kind==='restaurants') {
        assert.equal(card.querySelector('.row-card-media a').getAttribute('href'),card.querySelector('h3 a').getAttribute('href'),slug);
        assert.equal(card.querySelector('img')?.getAttribute('src') || null,p ? opt(p.src) : null,slug);
        if (!p) continue;
        assert.equal(!!p.contextual,false,slug);
      }
      if(p.contextual){assert.ok(card.querySelector('.card-area').textContent.includes(p.caption),slug);assert.match(card.querySelector('.card-area').textContent,/not the venue/);}
      if(p.preserve_framing){assert.equal(card.querySelector('img').style.objectFit,'contain',slug);assert.equal(card.querySelector('img').style.transform,'none',slug);}
    }
    doc.defaultView.close();
  }
});

test('event cards show a documented topic match or no image, never a generic fallback', () => {
  const { eventPhoto } = require('../lib/ui');
  const files = fs.readdirSync('content/events').filter(f => f.endsWith('.md'));
  const events = files.map(f => matter(fs.readFileSync('content/events/' + f, 'utf8')).data);
  const directory = new JSDOM(fs.readFileSync('_site/events/index.html', 'utf8')).window.document;
  assert.equal(eventPhoto({ slug: 'generic', photo_id: 'kaleici-marina' }), null);
  const cards = [...directory.querySelectorAll('article[data-event]')];
  assert.equal(cards.length, events.length);
  for (const card of cards) {
    const href = card.querySelector('h3 a').getAttribute('href');
    const d = events.find(e => e.slug === href.split('/')[2] || e.title === card.dataset.title);
    assert.ok(d, href);
    const exact = eventPhoto(d);
    assert.equal(card.querySelector('.card-media a').getAttribute('href'), href);
    assert.equal(card.querySelector('.card-media img')?.getAttribute('src') || null, exact ? opt(exact.src) : null, href);
    if (exact) assert.ok(card.querySelector('.card-area')?.textContent.includes(exact.label), href);
  }
  for (const [slug, hasPhoto] of [['cop31-city-events-2026', true], ['altin-gun-konseri-2026-11-18-muratpasa', true], ['efkan-sesen-2026-12-08-muratpasa', false]]) {
    const doc = new JSDOM(fs.readFileSync('_site/events/' + slug + '/index.html', 'utf8')).window.document;
    assert.equal(!!doc.querySelector('.page-hero-media img'), hasPhoto, slug);
    assert.ok(doc.querySelector('h1')?.textContent, slug);
    doc.defaultView.close();
  }
  directory.defaultView.close();
});
