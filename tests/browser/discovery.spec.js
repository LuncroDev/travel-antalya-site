const { test, expect } = require('@playwright/test');
test.beforeEach(async ({page})=>{await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());});
test('homepage search, layout and mobile navigation',async({page,isMobile})=>{
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('One Antalya');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.screenshot({path:test.info().outputPath('homepage.png'),fullPage:true});
 if(isMobile){const menu=page.getByRole('button',{name:'Menu',exact:true});await menu.click();await expect(menu).toHaveAttribute('aria-expanded','true');await page.keyboard.press('Escape');await expect(menu).toHaveAttribute('aria-expanded','false');await menu.click();await menu.click();await expect(menu).toHaveAttribute('aria-expanded','false');}
 await page.getByRole('searchbox',{name:'Search places, hotels and events'}).fill('kaleici');await page.getByRole('button',{name:'Explore →',exact:true}).click();await expect(page.locator('#search-count')).not.toContainText('0 results');await expect(page.locator('[data-search-item]:visible').first()).toContainText(/Kaleiçi|Old Town/i);
});
test('hotel filters, empty state, reset and query links',async({page})=>{
 await page.goto('/hotels/?q=Belek');await expect(page.locator('#hotel-search')).toHaveValue('Belek');expect(await page.locator('[data-hotel]:visible').count()).toBeGreaterThan(0);
 await page.locator('#hotel-search').fill('');await page.locator('#hotel-area').selectOption('Belek');await page.locator('#hotel-type').selectOption('Golf resort');await expect(page.locator('[data-hotel]:visible')).toHaveCount(4);
 await page.locator('#hotel-search').fill('does-not-exist-123');await expect(page.locator('#hotel-empty')).toBeVisible();await page.getByRole('button',{name:'Show all hotels',exact:true}).click();await expect(page.locator('[data-hotel]:visible')).toHaveCount(28);
 await page.locator('#hotel-search').fill('kaleici');await expect(page.locator('[data-hotel]:visible')).toHaveCount(3);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});
test('events honor time, archive, awaiting dates and reset',async({page})=>{
 await page.clock.install({time:new Date('2026-11-09T12:00:00Z')});await page.goto('/events/');await expect(page.locator('[data-event]:visible')).toHaveCount(5);
 await page.locator('select[name=period]').selectOption('archive');await expect(page.locator('[data-event]:visible')).toHaveCount(3);
 await page.locator('select[name=period]').selectOption('awaiting');await expect(page.locator('[data-event]:visible')).toHaveCount(4);
 await page.getByRole('button',{name:'Reset filters',exact:true}).click();await expect(page.locator('[data-event]:visible')).toHaveCount(5);
 await page.locator('input[name=from]').fill('2027-05-01');await expect(page.locator('[data-event-empty]')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});
test('search type, empty state and literal safe input',async({page})=>{
 await page.goto('/search/?q=kas&type=District');await expect(page.locator('[data-search-item]:visible')).toHaveCount(1);await expect(page.locator('[data-search-item]:visible')).toContainText('Kaş');
 await page.locator('#guide-query').fill('<img src=x onerror=alert(1)>');await expect(page.locator('#search-empty')).toBeVisible();await expect(page.locator('#search-count img')).toHaveCount(0);
 await page.getByRole('button',{name:'Clear',exact:true}).click();await expect(page.locator('[data-search-item]:visible')).toHaveCount(await page.locator('[data-search-item]').count());
});
test('no JavaScript still exposes hotel and event content',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());await page.goto(baseURL+'/hotels/');await expect(page.locator('[data-hotel]:visible')).toHaveCount(28);await page.goto(baseURL+'/events/');await expect(page.locator('[data-event]:visible')).toHaveCount(12);await context.close();
});
