'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs');
const {JSDOM}=require('jsdom');
const matter=require('gray-matter');
const {photoGalleryFor,cardPhoto,opt}=require('../lib/ui');
const pending=require('../docs/import/official-photo-pending.json').venues;
test('all remediated heroes use the documented replacement and clear captions',()=>{
  for(const key of Object.keys(pending)) {
    const data=matter(fs.readFileSync(pending[key].source_file,'utf8')).data;
    const expected=photoGalleryFor(data).slice(0,3);
    const doc=new JSDOM(fs.readFileSync('_site/'+key+'/index.html','utf8')).window.document;
    const figures=[...doc.querySelectorAll('.detail-gallery figure')];
    assert.equal(figures.length,expected.length<3?1:3,key);
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
      const data=fs.readdirSync('content/'+kind).filter(f=>f.endsWith('.md')).map(f=>matter(fs.readFileSync(`content/${kind}/${f}`,'utf8')).data).find(p=>p.slug===slug),p=cardPhoto(data);
      if(p.contextual){assert.ok(card.querySelector('.card-area').textContent.includes(p.caption),slug);assert.match(card.querySelector('.card-area').textContent,/not the venue/);}
      if(p.preserve_framing){assert.equal(card.querySelector('img').style.objectFit,'contain',slug);assert.equal(card.querySelector('img').style.transform,'none',slug);}
    }
    doc.defaultView.close();
  }
});
