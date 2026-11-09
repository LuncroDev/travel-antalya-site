const { test, expect } = require('@playwright/test');
const fs=require('fs'),matter=require('gray-matter');const records=kind=>fs.readdirSync(`content/${kind}`).filter(f=>f.endsWith('.md')).map(f=>matter(fs.readFileSync(`content/${kind}/${f}`,'utf8')).data);const hotels=records('hotels'),events=records('events');const {eventStatus}=require('../../lib/events');const active=events.filter(e=>['current','upcoming'].includes(eventStatus(e,'2026-11-09'))).length;
test.beforeEach(async ({page})=>{await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());});
test('homepage search, layout and mobile navigation',async({page,isMobile})=>{
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Antalya.');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.screenshot({path:test.info().outputPath('homepage.png'),fullPage:true});
 if(isMobile){const menu=page.getByRole('button',{name:'Menu',exact:true});await menu.click();await expect(menu).toHaveAttribute('aria-expanded','true');await page.keyboard.press('Escape');await expect(menu).toHaveAttribute('aria-expanded','false');await menu.click();await menu.click();await expect(menu).toHaveAttribute('aria-expanded','false');}
 await page.getByRole('searchbox',{name:'Search places, hotels and events'}).fill('kaleici');await page.getByRole('button',{name:'Search',exact:true}).click();await expect(page.locator('#search-count')).not.toContainText('0 results');await expect(page.locator('[data-search-item]:visible').first()).toContainText(/Kaleiçi|Old Town/i);
});
test('hotel filters, empty state, reset and query links',async({page})=>{
 await page.goto('/hotels/?q=Belek');await expect(page.locator('#hotel-search')).toHaveValue('Belek');expect(await page.locator('[data-hotel]:visible').count()).toBeGreaterThan(0);
 await page.locator('#hotel-search').fill('');await page.locator('#hotel-area').selectOption('Belek');await page.locator('#hotel-type').selectOption('Golf resort');await expect(page.locator('[data-hotel]:visible')).toHaveCount(hotels.filter(h=>h.neighborhood==='Belek'&&h.category==='Golf resort').length);
 await page.locator('#hotel-search').fill('does-not-exist-123');await expect(page.locator('#hotel-empty')).toBeVisible();await page.getByRole('button',{name:'Show all hotels',exact:true}).click();await expect(page.locator('[data-hotel]:visible')).toHaveCount(hotels.length);
 await page.locator('#hotel-search').fill('kaleici');await expect(page.locator('[data-hotel]:visible')).toHaveCount(hotels.filter(h=>h.neighborhood==='Kaleiçi').length);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});
test('events honor time, archive, awaiting dates and reset',async({page})=>{
 await page.clock.install({time:new Date('2026-11-09T12:00:00Z')});await page.goto('/events/');await expect(page.locator('[data-event]:visible')).toHaveCount(active);
 await page.locator('select[name=period]').selectOption('archive');await expect(page.locator('[data-event]:visible')).toHaveCount(3);
 await page.locator('select[name=period]').selectOption('awaiting');await expect(page.locator('[data-event]:visible')).toHaveCount(4);
 await page.getByRole('button',{name:'Reset filters',exact:true}).click();await expect(page.locator('[data-event]:visible')).toHaveCount(active);
 await page.locator('input[name=from]').fill('2027-05-01');await expect(page.locator('[data-event-empty]')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});
test('search type, empty state and literal safe input',async({page})=>{
 await page.goto('/search/?q=kas&type=District');await expect(page.locator('[data-search-item]:visible')).toHaveCount(1);await expect(page.locator('[data-search-item]:visible')).toContainText('Kaş');
 await page.locator('#guide-query').fill('<img src=x onerror=alert(1)>');await expect(page.locator('#search-empty')).toBeVisible();await expect(page.locator('#search-count img')).toHaveCount(0);
 await page.getByRole('button',{name:'Clear',exact:true}).click();await expect(page.locator('[data-search-item]:visible')).toHaveCount(await page.locator('[data-search-item]').count());
});
test('no JavaScript still exposes hotel and event content',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());await page.goto(baseURL+'/hotels/');await expect(page.locator('[data-hotel]:visible')).toHaveCount(hotels.length);await page.goto(baseURL+'/events/');await expect(page.locator('[data-event]:visible')).toHaveCount(events.length);await context.close();
});

test('dining and golf filters, clear, and profile links',async({page})=>{
 for(const section of ['restaurants','golf']){await page.goto('/'+section+'/');const total=await page.locator('[data-venue]').count();expect(total).toBeGreaterThan(0);await page.locator('input[name=q]').fill('not-a-real-venue-123');await expect(page.locator('[data-venue-empty]')).toBeVisible();await page.locator('[data-venue-reset]').click();await expect(page.locator('[data-venue]:visible')).toHaveCount(total);await page.locator('[data-venue] h3 a').first().click();await expect(page.locator('h1')).not.toBeEmpty();await expect(page.locator('.related-guide a').first()).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();await page.screenshot({path:test.info().outputPath(section+'-profile.png'),fullPage:true});}
});
test('hotel galleries distinguish archives and destination images',async({page})=>{
 await page.goto('/hotels/rixos-premium-belek/');await expect(page.locator('.editorial-photo')).toHaveCount(8);await expect(page.locator('.editorial-gallery')).toContainText('archival');await expect(page.locator('.editorial-gallery')).toContainText('2015');await expect(page.locator('.editorial-photo .photo-credit a').first()).toHaveAttribute('href',/^https:/);await page.screenshot({path:test.info().outputPath('hotel-gallery.png'),fullPage:true});
});
test('homepage fits tablet widths',async({page})=>{for(const width of [768,1024]){await page.setViewportSize({width,height:900});await page.goto('/');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();}});

test('reviewed property photographs load with intact framing and clear archive labels',async({page})=>{
 test.setTimeout(180000);
 const reviewedSlugs=new Set(require('../../docs/hotel-photo-sources.json').photos.map(p=>p.property_slug));
 for(const slug of [...reviewedSlugs].sort()){
  await page.goto('/hotels/'+slug+'/');
  const propertyImages=page.locator('.editorial-gallery img[data-preserve-framing]');
  const count=await propertyImages.count();expect(count).toBeGreaterThan(0);expect(count).toBeLessThanOrEqual(4);
  for(const image of await propertyImages.all()){
   await image.scrollIntoViewIfNeeded();
   await expect.poll(()=>image.evaluate(el=>el.complete&&el.naturalWidth>0)).toBeTruthy();
   await expect(image).toHaveCSS('object-fit','contain');
  }
  await expect(page.locator('.editorial-gallery')).toContainText('Property archive');
  await expect(page.locator('.editorial-gallery .photo-context-note').first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  if(slug==='lara-barut-collection')await expect(page.locator('h1')).toContainText('BAYOU Lara');
  if(slug==='the-marmara-antalya'){
   await expect(page.locator('.editorial-gallery')).toContainText('watermark retained');
   await page.locator('.editorial-gallery').screenshot({path:test.info().outputPath('marmara-archive-gallery.png')});
  }
 }
});
