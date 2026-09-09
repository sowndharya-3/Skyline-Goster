import { test, expect, open, home } from './helpers';

test('splash dismisses naturally, supports skipping, and preserves keyboard access', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.brand-splash-piece')).toHaveCount(3);
  await expect(page.locator('.site-content')).toHaveAttribute('inert', '');
  await expect(page.locator('.brand-splash')).toHaveCount(0, { timeout: 6000 });
  await expect(page.locator('main')).toBeFocused();
  await page.reload();
  await page.getByRole('button', { name: 'Enter site', exact: true }).click();
  await expect(page.locator('.brand-splash')).toHaveCount(0);
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('all campaign slides and their call-to-action destinations work', async ({ page }) => {
  await open(page);
  for (const [index, label, count] of [[1, 'THE NEW DROP.', 5], [2, 'ARMY EDIT.', 3], [3, 'BIKER EDIT.', 3]] as const) {
    await page.getByRole('button', { name: `Campaign slide ${index}`, exact: true }).click();
    await expect(page.getByRole('button', { name: `Campaign slide ${index}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Explore the drop', exact: true }).click();
    await expect(page.locator('main h1')).toContainText(label);
    await expect(page.locator('.product-card')).toHaveCount(count);
    await home(page);
  }
});

test('world tiles, drop link, packaging and community buttons navigate', async ({ page }) => {
  await open(page);
  for (const world of ['army', 'gamer', 'biker']) {
    await page.locator(`.world-card[href="#/shop?collection=${world}"]`).click();
    await expect(page.locator('main h1')).toContainText(world.toUpperCase() + ' EDIT.');
    await expect(page.locator('.product-card')).toHaveCount(3);
    await home(page);
  }
  if (page.viewportSize()!.width > 760) {
    await page.locator('.hero-scroll').click();
    await expect(page.locator('#mindset')).toBeInViewport();
  }
  await page.locator('.drop-heading').getByRole('button', { name: 'View all', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(5);
  await home(page);
  await page.getByRole('button', { name: 'Our packaging', exact: true }).click();
  await expect(page.locator('.packaging-full')).toBeVisible();
  await page.getByRole('button', { name: 'Build your loadout', exact: true }).click();
  await expect(page.locator('main h1')).toContainText('THE NEW DROP.');
  await home(page);
  await page.locator('main').getByRole('button', { name: 'Join the community', exact: true }).click();
  await expect(page.locator('main h1')).toHaveText('We are the unseen.');
});

test('community carousel arrows and every dot select the intended photo group', async ({ page }) => {
  await open(page);
  for (let i = 1; i <= 5; i++) {
    await page.getByRole('button', { name: `Community photo group ${i}`, exact: true }).click();
    await expect(page.getByRole('button', { name: `Community photo group ${i}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  await page.getByRole('button', { name: 'Next community photos', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Community photo group 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Previous community photos', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Community photo group 5', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.community-images a').first().click();
  await expect(page.locator('main h1')).toHaveText('We are the unseen.');
});

test('header navigation, menu dismissal and browser Back/Forward work', async ({ page }) => {
  await open(page);
  for (const [label, heading] of [['Shop', 'ALL TEES.'], ['Drops', 'THE NEW DROP.'], ['The unseen', 'We are the unseen.'], ['About', 'More than clothing.']]) {
    if (page.viewportSize()!.width <= 760) await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    await page.getByRole('navigation', { name: page.viewportSize()!.width <= 760 ? 'Mobile navigation' : 'Main navigation' }).getByRole('link', { name: label, exact: true }).click();
    await expect(page.locator('main h1')).toContainText(heading);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await page.goBack();
  await expect(page.locator('main h1')).toHaveText('We are the unseen.');
  await page.goForward();
  await expect(page.locator('main h1')).toContainText('More than clothing.');
  await page.getByRole('button', { name: 'Explore the drop', exact: true }).click();
  await expect(page.locator('main h1')).toContainText('ALL TEES.');
  if (page.viewportSize()!.width <= 760) {
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
});

test('every footer link reaches its advertised page', async ({ page }) => {
  test.setTimeout(60000);
  await open(page);
  const links = await page.locator('footer a').evaluateAll(els => els.map(el => ({ href: el.getAttribute('href')!, label: el.textContent! })));
  for (const href of [...new Set(links.map(link => link.href))]) {
    await page.locator(`footer a[href="${href}"]`).first().click();
    const expected = href === '#/account' ? '#/login' : href;
    await expect.poll(() => new URL(page.url()).hash || '#/').toBe(expected);
    await expect(page.locator('main')).not.toContainText("This page doesn't exist.");
    await expect(page.locator('main')).not.toContainText('Page not found.');
  }
});

test('FAQ accordions open and close, unknown routes recover through their buttons', async ({ page }) => {
  await open(page, '/info/help');
  const summaries = page.locator('main summary');
  const count = await summaries.count();
  expect(count).toBe(5);
  for (let i = 0; i < count; i++) {
    await summaries.nth(i).click();
    await expect(page.locator('main details').nth(i)).toHaveAttribute('open', '');
    await summaries.nth(i).click();
    await expect(page.locator('main details').nth(i)).not.toHaveAttribute('open', '');
  }
  for (const route of ['/missing', '/product/missing', '/info/missing', '/orders/missing', '/confirmation/missing']) {
    await open(page, route);
    await expect(page.locator('.empty-state')).toBeVisible();
    await page.locator('.empty-state').getByRole('button').click();
    await expect(page.locator('.empty-state')).toHaveCount(0);
  }
});

test('footer and community signup validate email and display successful local saves', async ({ page }) => {
  await open(page, '/unseen');
  for (const region of [page.locator('main'), page.locator('footer')]) {
    const input = region.getByRole('textbox', { name: 'Email for drop updates', exact: true });
    await input.fill('bad-address');
    await region.getByRole('button', { name: 'Join the community', exact: true }).click();
    expect(await input.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
    await input.fill('updates@example.com');
    await region.getByRole('button', { name: 'Join the community', exact: true }).click();
    await expect(region.getByRole('status')).toContainText('Saved on this device.');
  }
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ghoster-community-preview')!).email)).toBe('updates@example.com');
});

test('all primary routes stay within the viewport and load their visible images', async ({ page }) => {
  test.setTimeout(60000);
  const widths = page.viewportSize()!.width < 760 ? [320, 390] : [768, 1440];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/shop', '/product/shadow-oversized', '/info/about', '/packaging', '/unseen', '/login', '/bag', '/checkout', '/info/size', '/admin']) {
      await open(page, route);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      const broken = await page.locator('main img').evaluateAll(images => images.filter(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth === 0).map(image => image.getAttribute('src')));
      expect(broken, `${route} images`).toEqual([]);
    }
  }
});
