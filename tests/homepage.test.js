const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const photos = require('../_data/editorialPhotos.json');
const homepage = require('../_data/homepage.json');
const page = () => new JSDOM(fs.readFileSync('_site/index.html', 'utf8')).window.document;

test('homepage image cards use known licensed places and matching properties', () => {
  for (const [group, cards] of Object.entries(homepage)) {
    for (const card of cards) {
      const photo = photos.find(item => item.id === card.photo);
      assert.ok(photo?.license_url && photo?.source_url && photo?.author && photo?.alt, card.photo);
      for (const width of [480, 960]) assert.ok(fs.existsSync(`images/home/${photo.id}-${width}.webp`));
      if (group === 'stays') {
        assert.equal(photo.kind, 'property');
        assert.equal(photo.historical, true);
        assert.ok(card.href.includes(photo.property_slug), card.title);
        assert.match(card.place, /Property photo, 20\d\d$/);
      }
    }
  }
});

test('homepage is photo-led: every image is responsive, sized, described and lazy below the fold', () => {
  const doc = page();
  const images = [...doc.querySelectorAll('main img')];
  assert.ok(images.length >= 20, `expected a photo-led homepage, got ${images.length} images`);
  assert.equal(doc.querySelectorAll('main img[fetchpriority="high"]').length, 1);
  for (const img of images) {
    assert.ok(img.alt && Number(img.getAttribute('width')) > 0 && Number(img.getAttribute('height')) > 0, img.src);
    assert.ok(img.getAttribute('loading') === 'lazy' || img.getAttribute('fetchpriority') === 'high', img.src);
    if (img.getAttribute('src').startsWith('/.netlify/images')) continue;
    assert.ok(fs.existsSync('.' + img.getAttribute('src')), img.getAttribute('src'));
    for (const part of (img.getAttribute('srcset') || '').split(',').filter(Boolean)) assert.ok(fs.existsSync('.' + part.trim().split(' ')[0]), part);
  }
  for (const section of doc.querySelectorAll('main section[aria-labelledby]')) assert.ok(doc.getElementById(section.getAttribute('aria-labelledby')));
});

const ownerPhotoCredits = (() => {
  const matter = require('gray-matter'); const out = new Set();
  for (const dir of fs.readdirSync('content')) {
    if (!fs.statSync(`content/${dir}`).isDirectory()) continue;
    for (const f of fs.readdirSync(`content/${dir}`).filter(n => n.endsWith('.md'))) {
      for (const p of matter(fs.readFileSync(`content/${dir}/${f}`, 'utf8')).data.photos_official || []) if (p && p.credit) out.add(p.credit);
    }
  }
  return [...out];
})();
test('licensed photos keep keyboard-accessible author and licence credits', () => {
  const doc = page();
  const credits = [...doc.querySelectorAll('main details.credit')];
  assert.ok(credits.length >= 10);
  for (const credit of credits) {
    assert.ok(credit.querySelector('summary .sr-only')?.textContent.startsWith('Photo credit:'));
    if (credit.textContent.includes('official website')) continue; // venue's own photo, credited to its website
    if (ownerPhotoCredits.some(c => credit.textContent.includes(c))) continue; // owner-supplied photo with its own recorded credit
    const caption = credit.querySelector('strong').textContent;
    const photo = photos.find(item => item.caption === caption);
    assert.ok(photo, caption);
    assert.ok(credit.textContent.includes(photo.author));
    assert.equal(credit.querySelector('a').getAttribute('href'), photo.license_url);
    assert.equal(credit.querySelectorAll('a')[1].getAttribute('href'), photo.source_url);
  }
});

test('area photos are labelled so they are never mistaken for the venue', () => {
  const hotels = new JSDOM(fs.readFileSync('_site/hotels/index.html', 'utf8')).window.document;
  for (const card of hotels.querySelectorAll('[data-hotel]')) {
    const slug = card.querySelector('h3 a').getAttribute('href').split('/')[2];
    const img = card.querySelector('img');
    if (img.getAttribute('src').startsWith('/.netlify/images')) continue; // official website photo
    if (img.getAttribute('src').includes(`/venue-${slug}-`)) continue; // self-hosted official website photo
    const own = photos.some(p => p.kind === 'property' && (p.property_slug === slug || (p.property_slugs || []).includes(slug)) && img.getAttribute('src').includes(p.src.split('/').pop().replace(/\.[a-z]+$/, '')));
    if (!own) assert.ok(card.querySelector('.card-area'), `unlabelled area photo on ${slug}`);
  }
});

test('homepage keeps working search, one h1 and the six interest links', () => {
  const doc = page();
  assert.equal(doc.body.className.trim(), 'home-page');
  assert.equal(doc.querySelector('form[role="search"]').getAttribute('action'), '/search/');
  assert.equal(doc.querySelector('form[role="search"] input').getAttribute('name'), 'q');
  assert.equal(doc.querySelectorAll('nav.quick-nav a').length, 6);
  assert.equal(doc.querySelectorAll('h1').length, 1);
  for (const icon of doc.querySelectorAll('svg.i')) assert.equal(icon.getAttribute('aria-hidden'), 'true');
  assert.ok(doc.querySelector('link[href^="/css/site.css"]'));
  assert.ok(doc.querySelector('.site-footer img[src="/images/logo-white-520.webp"]'), 'footer logo is the white version');
});
