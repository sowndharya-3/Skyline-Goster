import { test, expect, open, choose, filters, closeFilters, addProduct, bag, seed } from './helpers';

test('search suggestions, submission, empty results and dialog alignment work', async ({ page }) => {
  await open(page);
  const trigger = page.getByRole('button', { name: 'Search tees', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  const input = dialog.getByRole('textbox', { name: 'Search products' });
  await expect(input).toBeFocused();
  await expect(dialog.locator('.search-results a')).toHaveCount(4);
  const field = await input.boundingBox();
  const submit = await dialog.getByRole('button', { name: 'Submit search' }).boundingBox();
  const modal = await dialog.boundingBox();
  expect(field!.x + field!.width).toBeLessThanOrEqual(submit!.x + 1);
  expect(submit!.x + submit!.width).toBeLessThanOrEqual(modal!.x + modal!.width);
  await input.fill('Shadow');
  await dialog.getByRole('link', { name: /Shadow/ }).click();
  await expect(page.locator('main h1')).toHaveText('Shadow');
  await trigger.click();
  await input.fill('zznonexistent');
  await expect(dialog).toContainText('No matches.');
  await input.press('Enter');
  await expect(page.locator('.empty-state')).toContainText('No tees match');
  await page.getByRole('button', { name: 'Show all tees' }).click();
  await expect(page.locator('.product-card')).toHaveCount(12);
  for (const term of ['  white  ', 'white', '']) {
    await trigger.click();
    await input.fill(term);
    await dialog.getByRole('button', { name: 'Submit search' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('.product-card')).toHaveCount(term ? 5 : 12);
  }
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('collection links, combined filters, reset and no-result recovery work', async ({ page }) => {
  await open(page, '/shop');
  for (const [id, count] of [['half-sleeve', 10], ['full-sleeve', 2], ['oversized', 8], ['graphic', 5], ['all', 12]] as const) {
    await page.locator(`.shop-collections a[href="#/shop?collection=${id}"]`).click();
    await expect(page.locator('.product-card')).toHaveCount(count);
  }
  let panel = await filters(page);
  await panel.getByRole('checkbox', { name: 'White', exact: true }).check();
  await panel.getByRole('button', { name: 'XXL', exact: true }).click();
  await choose(page, panel.getByRole('combobox', { name: 'Price range' }), 'Under ₹1,001');
  await closeFilters(page);
  await expect(page.locator('.product-card')).toHaveCount(3);
  await expect(page.locator('.active-filters')).toContainText('White');
  panel = await filters(page);
  await choose(page, panel.getByRole('combobox', { name: 'Price range' }), 'Under ₹801');
  await closeFilters(page);
  await expect(page.locator('.product-card h3')).toHaveText(['Essential White Tee']);
  await page.locator('.active-filters').getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('.product-card')).toHaveCount(12);
  await page.locator('.shop-collections a[href="#/shop?collection=graphic"]').click();
  panel = await filters(page);
  await choose(page, panel.getByRole('combobox', { name: 'Price range' }), 'Under ₹801');
  await closeFilters(page);
  await expect(page.locator('.empty-state')).toContainText('No tees match');
  await page.getByRole('button', { name: 'Show all tees' }).click();
  await expect(page.locator('.product-card')).toHaveCount(12);
  panel = await filters(page);
  await panel.getByRole('checkbox', { name: 'Black', exact: true }).check();
  await panel.getByRole('button', { name: 'Clear all' }).click();
  await expect(panel.getByRole('checkbox', { name: 'Black', exact: true })).not.toBeChecked();
  await choose(page, panel.getByRole('combobox', { name: 'Price range' }), 'Up to INR 1,500');
  await closeFilters(page);
  await expect(page.locator('.product-card')).toHaveCount(12);
});

test('every sort option produces the expected catalogue order', async ({ page }) => {
  await open(page, '/shop');
  const sort = page.getByRole('combobox', { name: 'Sort products' });
  for (const [option, ascending] of [['Price: Low to high', true], ['Price: High to low', false]] as const) {
    await choose(page, sort, option);
    const prices = await page.locator('.product-card .price-row strong').allTextContents();
    const numbers = prices.map(price => Number(price.replace(/\D/g, '')));
    expect(numbers).toEqual([...numbers].sort((a, b) => ascending ? a - b : b - a));
  }
  for (const option of ['Newest first', 'Sort: Featured']) {
    await choose(page, sort, option);
    await expect(page.locator('.product-card h3').first()).toHaveText('Shadow');
  }
});

test('all product destinations, gallery buttons and product navigation work', async ({ page }) => {
  test.setTimeout(60000);
  await open(page, '/shop');
  const links = await page.locator('.product-card > a').evaluateAll(els => els.map(el => ({ href: el.getAttribute('href')!, name: el.textContent! })));
  expect(links).toHaveLength(12);
  for (const link of links) {
    await page.locator(`.product-card > a[href="${link.href}"]`).click();
    await expect(page.locator('main h1')).toHaveText(link.name);
    await expect(page.locator('.main-photo img')).toBeVisible();
    await expect.poll(() => page.locator('.main-photo img').evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    const thumbs = page.locator('.gallery-thumbnails button[aria-pressed]');
    for (let i = 0; i < 3; i++) {
      await thumbs.nth(i).click();
      await expect(thumbs.nth(i)).toHaveAttribute('aria-pressed', 'true');
      const src = await thumbs.nth(i).locator('img').getAttribute('src');
      await expect(page.locator('.main-photo img')).toHaveAttribute('src', src!);
    }
    await page.locator('.breadcrumb').getByRole('link', { name: 'T-shirts', exact: true }).click();
  }
  await open(page, '/product/shadow-oversized');
  await page.getByRole('link', { name: 'Next product', exact: true }).click();
  await expect(page.locator('main h1')).toHaveText('Eclipse');
  await page.getByRole('link', { name: 'Previous product', exact: true }).click();
  await expect(page.locator('main h1')).toHaveText('Shadow');
  await page.locator('.related-section').getByRole('link', { name: 'View all', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(12);
});

test('product sizing, zoom, keyboard tabs, delivery check and wishlist controls work', async ({ page }) => {
  await open(page, '/product/apex');
  await expect(page.locator('.size-buttons').getByRole('button', { name: 'XXL', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Add to loadout', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Select your size to add this unit.');
  await expect(page.locator('.size-buttons button').first()).toBeFocused();
  await page.getByRole('button', { name: 'Size guide', exact: true }).click();
  await expect(page.getByRole('dialog').locator('tbody tr')).toHaveCount(5);
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  for (const name of ['Enlarge product image', 'Enlarge Apex']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('dialog').getByRole('img')).toBeVisible();
    await page.keyboard.press('Escape');
  }
  for (const name of ['Details', 'Size guide', 'Shipping', 'Description']) {
    await page.getByRole('tab', { name, exact: true }).click();
    await expect(page.getByRole('tab', { name, exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toBeVisible();
  }
  await page.getByRole('tab', { name: 'Description', exact: true }).press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Details', exact: true })).toBeFocused();
  await page.keyboard.press('End');
  const pin = page.getByRole('textbox', { name: 'Check your delivery PIN' });
  await pin.fill('000000');
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.getByRole('tabpanel').getByRole('status')).toContainText('Enter a valid');
  await pin.fill('600001');
  await pin.press('Enter');
  await expect(page.getByRole('tabpanel').getByRole('status')).toContainText('Demo estimate');
  await page.getByRole('button', { name: 'Add to wishlist', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove from wishlist', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await open(page, '/wishlist');
  await expect(page.locator('.product-card h3')).toHaveText(['Apex']);
  await page.getByRole('button', { name: 'Remove Apex from wishlist', exact: true }).click();
  await expect(page.locator('.empty-state')).toContainText('Make room');
});

test('quick add requires a size and its details, close, continue and bag buttons work', async ({ page }) => {
  await open(page, '/shop');
  const card = page.locator('.product-card').first();
  await card.hover();
  await card.getByRole('button', { name: 'Choose size' }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Add to loadout', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await card.hover();
  await card.getByRole('button', { name: 'Choose size' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Full details' }).click();
  await expect(page.locator('main h1')).toHaveText('Shadow');
  await open(page, '/shop');
  await card.hover();
  await card.getByRole('button', { name: 'Choose size' }).click();
  await choose(page, page.getByRole('combobox', { name: 'Select size' }), 'M');
  await page.getByRole('dialog').getByRole('button', { name: 'Add to loadout', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Unit added' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue shopping', exact: true }).click();
  await card.getByRole('button', { name: 'Save Shadow', exact: true }).click();
  await card.hover();
  await card.getByRole('button', { name: 'Choose size' }).click();
  await choose(page, page.getByRole('combobox', { name: 'Select size' }), 'L');
  await page.getByRole('dialog').getByRole('button', { name: 'Add to loadout', exact: true }).click();
  await page.getByRole('button', { name: 'View loadout', exact: true }).click();
  await expect(page.locator('.bag-line')).toHaveCount(2);
  await expect(page.locator('.bag-line').first()).toContainText('Size M');
  await expect(page.locator('.bag-line').last()).toContainText('Size L');
});

test('bag quantities, discounts, shipping, persistence, removal and save for later work', async ({ page }) => {
  await addProduct(page, 'essential-white');
  await bag(page);
  const summary = page.locator('.order-summary');
  await expect(summary.locator('.summary-total')).toContainText('₹778');
  await expect(page.getByRole('button', { name: 'Decrease Essential White' })).toBeDisabled();
  await page.getByRole('button', { name: 'Increase Essential White' }).click();
  await expect(summary.locator('.summary-total')).toContainText('₹1,477');
  await page.getByRole('button', { name: 'Increase Essential White' }).click();
  await expect(summary.locator('.summary-total')).toContainText('₹2,097');
  await page.getByRole('textbox', { name: 'Have an offer code?' }).fill('BAD');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('not valid');
  await page.getByRole('textbox', { name: 'Have an offer code?' }).fill('ghost10');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(summary.locator('.summary-total')).toContainText('₹1,887');
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(summary.locator('.summary-total')).toContainText('₹2,097');
  await page.reload();
  await expect(page.locator('.brand-splash')).toHaveCount(0);
  await expect(page.locator('.bag-line .quantity span')).toHaveText('3');
  await page.getByRole('button', { name: 'Save Essential White Tee for later' }).click();
  await expect(page.locator('.empty-state')).toContainText('Your bag is waiting.');
  await open(page, '/wishlist');
  await expect(page.locator('.product-card h3')).toHaveText(['Essential White Tee']);
  await addProduct(page);
  await bag(page);
  await page.getByRole('button', { name: 'Remove Shadow', exact: true }).click();
  await expect(page.locator('.empty-state')).toBeVisible();
});

test('adding beyond the per-size limit reports the limit without a false confirmation', async ({ page }) => {
  await seed(page, { cart: [{ id: 'shadow-oversized', size: 'M', qty: 10 }] });
  await open(page, '/product/shadow-oversized');
  await page.locator('.size-buttons').getByRole('button', { name: 'M', exact: true }).click();
  await page.getByRole('button', { name: 'Add to loadout', exact: true }).click();
  await expect(page.getByText('You can add up to 10 of this size.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Unit added' })).toHaveCount(0);
  await bag(page);
  await expect(page.getByRole('button', { name: 'Increase Shadow' })).toBeDisabled();
  await expect(page.locator('.bag-line .quantity span')).toHaveText('10');
  await page.locator('.bag-line-details').getByRole('link', { name: 'Shadow', exact: true }).click();
  await page.locator('.breadcrumb').getByRole('link', { name: 'T-shirts', exact: true }).click();
  const card = page.locator('.product-card').first();
  await card.hover();
  await card.getByRole('button', { name: 'Choose size' }).click();
  await choose(page, page.getByRole('combobox', { name: 'Select size' }), 'M');
  await page.getByRole('dialog').getByRole('button', { name: 'Add to loadout', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Shadow', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Unit added' })).toHaveCount(0);
  await choose(page, page.getByRole('combobox', { name: 'Select size' }), 'L');
  await page.getByRole('dialog').getByRole('button', { name: 'Add to loadout', exact: true }).click();
  await page.getByRole('button', { name: 'View loadout', exact: true }).click();
  await expect(page.locator('.bag-line')).toHaveCount(2);
  await expect(page.locator('.bag-line .quantity span')).toHaveText(['10', '1']);
});
