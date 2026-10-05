import { readFile } from 'node:fs/promises';
import { test, expect, open, addProduct, bag, fillAddress, seedAdmin, adminSignIn, ADMIN_EMAIL, uniqueEmail } from './helpers';

test.beforeEach(async ({ page }) => { await seedAdmin(page); });

test('admin workspace is gated behind sign-in and rejects the wrong password', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.removeItem('ghoster-admin-token-v1'));
  await open(page, '/admin');
  await expect(page.locator('main h1')).toHaveText('Workspace sign-in.');
  await page.getByLabel('Email', { exact: true }).fill(ADMIN_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Incorrect email or password.');
  await expect(page.locator('main h1')).toHaveText('Workspace sign-in.');
  await adminSignIn(page);
  if (page.viewportSize()!.width < 981) await page.getByRole('button', { name: 'Open admin menu' }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('main h1')).toHaveText('Workspace sign-in.');
});

test('storefront has no outside frame and admin navigation works at phone and desktop sizes', async ({ page }) => {
  await open(page);
  const frame = await page.locator('.site-content').evaluate(el => ({ left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right, width: document.documentElement.clientWidth, border: getComputedStyle(el).borderLeftWidth, margin: getComputedStyle(el).marginTop }));
  expect(frame.left).toBe(0);
  expect(frame.right).toBe(frame.width);
  expect(frame.border).toBe('0px');
  expect(frame.margin).toBe('0px');
  await page.locator('footer').getByRole('link', { name: /Store dashboard/ }).click();
  await expect(page.locator('main h1')).toHaveText('Store overview.');
  await page.getByRole('combobox', { name: 'Activity period' }).selectOption('30');
  await expect(page.getByRole('img', { name: /Order value over the last 30 days/ })).toBeVisible();
  await page.getByRole('combobox', { name: 'Activity period' }).selectOption('7');
  for (const [name, heading] of [['Products', 'Products.'], ['Orders', 'Orders.'], ['Customers', 'Customers.'], ['Overview', 'Store overview.']]) {
    if (page.viewportSize()!.width < 981) await page.getByRole('button', { name: 'Open admin menu' }).click();
    // 'Orders' carries a live confirmed-order count badge (e.g. "Orders 20") now that the backend
    // has real accumulated data, so match on the link's start rather than its exact full name.
    await page.getByRole('navigation', { name: 'Admin navigation' }).getByRole('link', { name: new RegExp('^' + name) }).click();
    await expect(page.locator('main h1')).toHaveText(heading);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  }
  await page.getByRole('button', { name: 'Add product', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Add product' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('link', { name: 'View store', exact: true }).click();
  await expect(page.locator('.campaign-hero')).toBeVisible();
});

test('reports summarise orders in the selected period and export a CSV', async ({ page }) => {
  await addProduct(page);
  await bag(page);
  await page.getByRole('button', { name: 'Continue to checkout' }).click();
  await fillAddress(page.locator('.checkout-form'));
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await page.getByRole('button', { name: 'Review your order' }).click();
  await page.getByRole('button', { name: /^Place demo order/ }).click();
  await expect(page.locator('.confirmation')).toBeVisible();
  await open(page, '/admin/reports');
  await expect(page.locator('main h1')).toHaveText('Reports.');
  // Reports are now live totals from a shared backend database (not per-test isolated local state),
  // so assert the numbers are real/well-formed rather than an exact value another test could also affect.
  await expect(page.locator('.ops-metrics article').first().locator('strong')).toHaveText(/^₹[\d,]+$/);
  await expect(page.locator('.ops-metrics article').nth(1).locator('strong')).toHaveText(/^\d+$/);
  await expect(page.locator('.ops-table tbody tr').first()).toContainText(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
  await page.getByRole('button', { name: 'Custom range' }).click();
  await expect(page.getByLabel('From date')).toBeVisible();
  await expect(page.getByLabel('To date')).toBeVisible();
  await page.getByRole('button', { name: 'Last 30 days' }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Excel', exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^ghoster-report-.*\.xlsx$/);
  const bytes = await readFile((await download.path())!);
  expect(bytes.subarray(0, 2).toString('latin1')).toBe('PK'); // .xlsx is a real zip archive, not CSV text
});

test('product search, pagination, status filter and CSV export work', async ({ page }) => {
  await open(page, '/admin/products');
  await expect(page.locator('.ops-table tbody tr')).toHaveCount(8);
  await page.getByRole('button', { name: 'Next product page' }).click();
  await expect(page.locator('.ops-table tbody tr')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Next product page' })).toBeDisabled();
  await page.getByRole('button', { name: 'Previous product page' }).click();
  await page.getByRole('searchbox', { name: 'Search products' }).fill('no-such-tee');
  await expect(page.locator('.ops-empty')).toContainText('No matching products.');
  await page.getByRole('searchbox', { name: 'Search products' }).fill('Shadow');
  await expect(page.locator('.ops-table tbody tr')).toHaveCount(1);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe('ghoster-products.csv');
  const csv = await readFile((await download.path())!, 'utf8');
  expect(csv).toContain('"Shadow","1499"');
  expect(csv).not.toContain('Eclipse');
  await page.getByRole('combobox', { name: 'Product status' }).selectOption('archived');
  await expect(page.locator('.ops-empty')).toBeVisible();
  await page.getByRole('combobox', { name: 'Product status' }).selectOption('active');
  await page.getByRole('link', { name: 'View Shadow in store' }).click();
  await expect(page.locator('main h1')).toHaveText('Shadow');
});

test('product edits persist in the store and removed sizes leave the current bag', async ({ page }) => {
  await addProduct(page);
  await open(page, '/admin/products');
  await page.getByRole('button', { name: 'Edit Shadow', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit product' });
  await dialog.getByRole('textbox', { name: 'Product name' }).fill('Shadow Revised');
  await dialog.getByRole('spinbutton', { name: 'Price (INR)', exact: true }).fill('1299');
  await dialog.getByRole('button', { name: 'M', exact: true }).click();
  await dialog.getByRole('button', { name: 'Save product', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('link', { name: 'View Shadow Revised in store' }).click();
  await expect(page.locator('main h1')).toHaveText('Shadow Revised');
  await expect(page.locator('.detail-price strong')).toHaveText('₹1,299');
  await expect(page.locator('.size-buttons').getByRole('button', { name: 'M', exact: true })).toBeDisabled();
  await expect(page.locator('header').getByRole('link', { name: 'Shopping bag, 0 items' })).toBeVisible();
  await page.reload();
  await expect(page.locator('.brand-splash')).toHaveCount(0);
  await expect(page.locator('main h1')).toHaveText('Shadow Revised');
  await page.locator('.size-buttons').getByRole('button', { name: 'L', exact: true }).click();
  await page.getByRole('button', { name: 'Add to loadout', exact: true }).click();
  await page.getByRole('button', { name: 'View loadout', exact: true }).click();
  await expect(page.locator('.summary-total')).toContainText('₹1,378');
});

test('create, validate, archive, restore and reset a product through the admin UI', async ({ page }) => {
  await open(page, '/admin/products');
  await page.getByRole('button', { name: 'Add product', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add product' });
  await dialog.getByRole('textbox', { name: 'Product name' }).fill('Phantom');
  await dialog.getByRole('textbox', { name: 'Description', exact: true }).fill('A new statement tee for the unseen.');
  await dialog.getByRole('spinbutton', { name: 'Price (INR)', exact: true }).fill('899');
  await dialog.getByRole('spinbutton', { name: 'MRP (INR)', exact: true }).fill('999');
  await dialog.getByRole('combobox', { name: 'Product artwork' }).selectOption('product-eclipse');
  await dialog.getByRole('combobox', { name: 'Fit', exact: true }).selectOption('Regular');
  await dialog.getByRole('checkbox', { name: 'Army', exact: true }).check();
  for (const size of ['S', 'M', 'L', 'XL', 'XXL']) await dialog.getByRole('button', { name: size, exact: true }).click();
  await dialog.getByRole('button', { name: 'Create product', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Select at least one available size.');
  await dialog.getByRole('button', { name: 'M', exact: true }).click();
  await dialog.getByRole('button', { name: 'Create product', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Search products' }).fill('Phantom');
  await page.getByRole('link', { name: 'View Phantom in store' }).click();
  await expect(page.locator('main h1')).toHaveText('Phantom');
  await expect(page.locator('.detail-price strong')).toHaveText('₹899');
  await page.reload();
  await expect(page.locator('.brand-splash')).toHaveCount(0);
  await expect(page.locator('main h1')).toHaveText('Phantom');
  await open(page, '/admin/products');
  await page.getByRole('searchbox', { name: 'Search products' }).fill('Phantom');
  await page.getByRole('button', { name: 'Archive Phantom', exact: true }).click();
  await page.getByRole('button', { name: 'Keep product', exact: true }).click();
  await page.getByRole('button', { name: 'Archive Phantom', exact: true }).click();
  await page.getByRole('button', { name: 'Archive product', exact: true }).click();
  await expect(page.locator('.ops-table tbody tr')).toContainText('Archived');
  await open(page, '/shop?q=Phantom');
  await expect(page.locator('.empty-state')).toContainText('No tees match');
  await open(page, '/admin/products');
  await page.getByRole('combobox', { name: 'Product status' }).selectOption('archived');
  await page.getByRole('button', { name: 'Restore Phantom', exact: true }).click();
  await expect(page.locator('.ops-empty')).toBeVisible();
  await open(page, '/shop?q=Phantom');
  await expect(page.locator('.product-card h3')).toHaveText(['Phantom']);
  await open(page, '/info/privacy');
  await page.getByRole('button', { name: 'Clear prototype data', exact: true }).click();
  await open(page, '/shop');
  await expect(page.locator('.product-card')).toHaveCount(12);
});

test('admin manages orders and customer history while preserving purchased prices', async ({ page }) => {
  test.setTimeout(60000);
  const email = uniqueEmail('admin-orders');
  await addProduct(page);
  await bag(page);
  await page.getByRole('button', { name: 'Continue to checkout' }).click();
  await fillAddress(page.locator('.checkout-form'), { 'Email address': email });
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await page.getByRole('button', { name: 'Review your order' }).click();
  await page.getByRole('button', { name: /^Place demo order/ }).click();
  const id = await page.locator('.confirmation-box > strong').textContent();
  await open(page, '/admin/products');
  await page.getByRole('button', { name: 'Edit Shadow', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Price (INR)', exact: true }).fill('1999');
  await page.getByRole('spinbutton', { name: 'MRP (INR)', exact: true }).fill('2099');
  await page.getByRole('button', { name: 'Save product', exact: true }).click();
  await open(page, '/admin/orders');
  await page.getByRole('searchbox', { name: 'Search orders or customers' }).fill('missing');
  await expect(page.locator('.ops-empty')).toContainText('No matching orders');
  await page.getByRole('searchbox', { name: 'Search orders or customers' }).fill(id!);
  for (const status of ['Processing', 'Shipped', 'Delivered', 'Cancelled']) {
    await page.getByRole('button', { name: 'Manage order ' + id }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('.ops-order-items')).toContainText('₹1,499');
    await dialog.getByRole('combobox', { name: 'Fulfilment status' }).selectOption(status);
    await dialog.getByRole('button', { name: 'Save status' }).click();
    await expect(page.locator('.ops-table tbody .ops-status')).toHaveText(status);
  }
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export orders' }).click();
  const file = await downloading;
  expect(await readFile((await file.path())!, 'utf8')).toContain('"1499","UPI","Cancelled"');
  await page.getByRole('combobox', { name: 'Order status', exact: true }).selectOption('Confirmed');
  await expect(page.locator('.ops-empty')).toBeVisible();
  await open(page, '/orders/' + id);
  await expect(page.locator('.bag-line')).toContainText('₹1,499');
  await expect(page.locator('main')).toContainText('This demo order was cancelled.');
  await page.reload();
  await expect(page.locator('.brand-splash')).toHaveCount(0);
  await expect(page.locator('main')).toContainText('This demo order was cancelled.');
  await open(page, '/admin/customers');
  await page.getByRole('searchbox', { name: 'Search customers' }).fill(email);
  await expect(page.locator('.ops-table tbody tr')).toHaveCount(1);
  await page.getByRole('link', { name: 'View orders for ' + email }).click();
  await expect(page.locator('.ops-table tbody tr')).toContainText(id!);
});
