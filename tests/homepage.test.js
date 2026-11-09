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

test('every homepage section is photographic with responsive, named images', () => {
  const doc = page();
  const sections = [...doc.querySelectorAll('main section')];
  assert.equal(sections.length, 8);
  for (const section of sections) {
    assert.ok(section.querySelector('img'), section.getAttribute('aria-labelledby'));
    assert.ok(doc.getElementById(section.getAttribute('aria-labelledby')));
  }
  const images = [...doc.querySelectorAll('main img')];
  assert.equal(images.length, 16);
  assert.equal(doc.querySelectorAll('main img[fetchpriority="high"]').length, 1);
  for (const img of images) {
    assert.ok(img.alt && img.width > 0 && img.height > 0);
    assert.ok(img.getAttribute('srcset') && img.getAttribute('sizes'));
    assert.ok(img.loading === 'lazy' || img.getAttribute('loading') === 'lazy' || img.getAttribute('fetchpriority') === 'high');
    assert.ok(fs.existsSync('.' + img.getAttribute('src')));
  }
});

test('each homepage photo retains keyboard-accessible author and licence credits', () => {
  const doc = page();
  const credits = [...doc.querySelectorAll('main details.home-credit')];
  assert.equal(credits.length, 16);
  for (const credit of credits) {
    assert.ok(credit.querySelector('summary .sr-only')?.textContent.startsWith('Photo credit:'));
    const caption = credit.querySelector('strong').textContent;
    const photo = photos.find(item => item.caption === caption);
    assert.ok(photo, caption);
    assert.ok(credit.textContent.includes(photo.author));
    assert.equal(credit.querySelector('a').getAttribute('href'), photo.license_url);
    assert.equal(credit.querySelectorAll('a')[1].getAttribute('href'), photo.source_url);
    assert.match(credit.textContent, /Resized to WebP; cropped for display/);
  }
});

test('homepage redesign is isolated and preserves functional search and navigation', () => {
  const doc = page();
  assert.equal(doc.body.className, 'home-page');
  assert.ok(doc.querySelector('link[href="/css/home.css"]'));
  assert.equal(doc.querySelector('form[role="search"]').getAttribute('action'), '/search/');
  assert.equal(doc.querySelector('form[role="search"] input').getAttribute('name'), 'q');
  assert.equal(doc.querySelectorAll('nav.home-explore-nav a').length, 6);
  assert.equal(doc.querySelectorAll('h1').length, 1);
  for (const icon of doc.querySelectorAll('svg.home-icon')) assert.equal(icon.getAttribute('aria-hidden'), 'true');
  const hotels = new JSDOM(fs.readFileSync('_site/hotels/index.html', 'utf8')).window.document;
  assert.equal(hotels.querySelector('link[href="/css/home.css"]'), null);
});
