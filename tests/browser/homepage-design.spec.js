const { test, expect } = require('@playwright/test');
test.beforeEach(async ({ page }) => { await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort()); });

test('photo-first homepage fits small phones through wide desktops', async ({ page }) => {
  test.setTimeout(120000);
  for (const width of [360, 390, 560, 768, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await expect(page.locator('.home-hero h1')).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`home-${width}.png`), fullPage: true });
  }
});

test('homepage photo credits work without scripts and keep source links separate', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
  await page.goto(baseURL + '/');
  const credit = page.locator('.credit').first();
  await credit.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(credit).toHaveAttribute('open', '');
  await expect(credit.getByRole('link', { name: 'Source', exact: true })).toHaveAttribute('href', /^https:\/\/commons\.wikimedia\.org\//);
  await credit.locator('summary').click();
  await expect(credit).not.toHaveAttribute('open', '');
  await context.close();
});
