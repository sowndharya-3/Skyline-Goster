import { test, expect, open, addProduct, bag, fillAddress, signIn, seedAdmin } from './helpers';

test('demo login validates details, persists the profile and signs out', async ({ page }) => {
  await open(page, '/login');
  await page.getByRole('button', { name: 'Continue to account', exact: true }).click();
  await expect(page.locator('.sign-in-form').getByRole('alert')).toHaveCount(2);
  await expect(page.getByRole('textbox', { name: 'Your name', exact: true })).toBeFocused();
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('  Demo Customer  ');
  await page.locator('main').getByRole('textbox', { name: 'Email address', exact: true }).fill('bad-email');
  await page.getByRole('button', { name: 'Continue to account', exact: true }).click();
  await expect(page.locator('.sign-in-form').getByRole('alert')).toHaveCount(1);
  await page.locator('main').getByRole('textbox', { name: 'Email address', exact: true }).fill('demo@example.com');
  await page.getByRole('button', { name: 'Continue to account', exact: true }).click();
  await expect(page.locator('.account-layout aside h2')).toHaveText('Hello, Demo Customer.');
  await page.reload();
  await expect(page.locator('.brand-splash')).toHaveCount(0);
  await expect(page.locator('main h1')).toHaveText('YOUR ACCOUNT.');
  await page.locator('main').getByRole('link', { name: /My orders/ }).click();
  await expect(page.locator('main h1')).toContainText('YOUR ORDERS.');
  await open(page, '/account');
  await page.locator('main').getByRole('link', { name: /Wishlist/ }).click();
  await expect(page.locator('main h1')).toContainText('YOUR WISHLIST.');
  await open(page, '/account');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('main h1')).toHaveText('WELCOME BACK.');
  await expect(page.locator('header').getByRole('link', { name: 'Log in', exact: true })).toBeVisible();
  await open(page, '/account');
  await expect(page).toHaveURL(/#\/login$/);
});

test('login guest, back and help links work', async ({ page }) => {
  for (const [label, heading] of [['Continue as a guest', 'ALL TEES.'], ['Back to the tees', 'ALL TEES.'], ['Visit our help centre', 'A LITTLE HELP.']]) {
    await open(page, '/login');
    await page.locator('main').getByRole('link', { name: label, exact: true }).click();
    await expect(page.locator('main h1')).toContainText(heading);
  }
});

test('profile saving rejects blank names and accepts valid edits', async ({ page }) => {
  await signIn(page);
  const name = page.getByRole('textbox', { name: 'Name', exact: true });
  await name.fill('   ');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  expect(await name.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
  await expect(page.locator('.account-layout aside h2')).toHaveText('Hello, Demo Customer.');
  await name.fill('Updated Customer');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('updated@example.com');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.locator('.account-layout aside h2')).toHaveText('Hello, Updated Customer.');
  await expect(page.locator('.account-layout aside')).toContainText('updated@example.com');
});

test('saved addresses validate, save, populate checkout and can be removed', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Add address', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: 'Add delivery address' });
  await fillAddress(dialog, { 'Mobile number': '1234567890' });
  await dialog.getByRole('button', { name: 'Save address', exact: true }).click();
  expect(await dialog.getByRole('textbox', { name: 'Mobile number' }).evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
  await fillAddress(dialog, { City: '   ' });
  await dialog.getByRole('button', { name: 'Save address', exact: true }).click();
  await expect(dialog).toBeVisible();
  expect(await dialog.getByRole('textbox', { name: 'City', exact: true }).evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
  await fillAddress(dialog);
  await dialog.getByRole('button', { name: 'Save address', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.saved-address-card')).toContainText('12 Sample Street');
  await addProduct(page);
  await bag(page);
  await page.getByRole('button', { name: 'Continue to checkout' }).click();
  await page.getByRole('textbox', { name: 'City', exact: true }).fill('Changed');
  await page.getByRole('button', { name: /Use saved address/ }).click();
  await expect(page.getByRole('textbox', { name: 'City', exact: true })).toHaveValue('Chennai');
  await open(page, '/account');
  await page.getByRole('button', { name: 'Remove address 1', exact: true }).click();
  await expect(page.locator('main')).toContainText('No saved addresses yet.');
  await page.getByRole('button', { name: 'Add address', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).toHaveCount(0);
});

test('checkout validates addresses, review edits and changed payment clears a failure', async ({ page }) => {
  await addProduct(page);
  await bag(page);
  await page.getByRole('textbox', { name: 'Have an offer code?' }).fill('GHOST10');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to checkout' }).click();
  await expect(page.locator('.summary-total')).toContainText('₹1,349');
  await expect(page.locator('.checkout-steps').getByRole('button', { name: /Payment/ })).toBeDisabled();
  await fillAddress(page.locator('.checkout-form'), { 'PIN code': '000000' });
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await expect(page.getByRole('heading', { name: 'Where should it go?' })).toBeVisible();
  await fillAddress(page.locator('.checkout-form'), { 'Flat, street and area': '     ' });
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await expect(page.getByRole('heading', { name: 'Where should it go?' })).toBeVisible();
  await fillAddress(page.locator('.checkout-form'));
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await page.getByRole('button', { name: 'Review your order' }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByRole('textbox', { name: 'Flat, street and area' }).fill('24 Updated Street');
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await page.getByRole('button', { name: 'Review your order' }).click();
  await expect(page.locator('.review-address').first()).toContainText('24 Updated Street');
  await page.getByRole('button', { name: 'Preview a payment failure', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Your bag is safe.');
  await expect(page.locator('header').getByRole('link', { name: 'Shopping bag, 1 items' })).toBeVisible();
  await page.getByRole('button', { name: 'Change', exact: true }).click();
  await page.getByRole('radio', { name: /^Cash on delivery/ }).click();
  await page.getByRole('button', { name: 'Review your order' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Preview a payment failure', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /^Place demo order/ }).click();
  await expect(page.locator('.confirmation')).toContainText('Your demo order is confirmed.');
  await expect(page.locator('.confirmation-box')).toHaveCSS('color', 'rgb(16, 16, 16)');
  await expect(page.locator('.confirmation-box')).toHaveCSS('background-color', 'rgb(243, 243, 243)');
  await expect(page.locator('.confirmation-box')).toContainText('₹1,349');
});

for (const payment of ['UPI', 'Cards', 'Net banking', 'Cash on delivery']) {
  test(`${payment} demo checkout creates one persisted order and updates the dashboard`, async ({ page }) => {
    await seedAdmin(page);
    await addProduct(page);
    await bag(page);
    await page.getByRole('button', { name: 'Continue to checkout' }).click();
    await fillAddress(page.locator('.checkout-form'));
    await page.getByRole('button', { name: 'Continue to payment' }).click();
    await page.getByRole('radio', { name: new RegExp('^' + payment) }).click();
    await page.getByRole('button', { name: 'Review your order' }).click();
    if (payment === 'UPI') {
      await page.getByRole('button', { name: 'Preview a payment failure', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText('Demo payment failed.');
    }
    await page.getByRole('button', { name: /^Place demo order/ }).click();
    await expect(page.locator('.confirmation')).toBeVisible();
    await expect(page.locator('header').getByRole('link', { name: 'Shopping bag, 0 items' })).toBeVisible();
    const orderId = await page.locator('.confirmation-box > strong').textContent();
    await page.getByRole('button', { name: 'View order', exact: true }).click();
    await expect(page.locator('main h1')).toHaveText('ORDER DETAILS.');
    await expect(page.locator('.review-address')).toContainText('Payment: ' + payment);
    await page.reload();
    await expect(page.locator('.brand-splash')).toHaveCount(0);
    await expect(page.locator('.order-card')).toContainText(orderId!);
    await page.getByRole('button', { name: 'All orders', exact: true }).click();
    await expect(page.locator('.order-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'View details', exact: true }).click();
    await expect(page.locator('main h1')).toHaveText('ORDER DETAILS.');
    // The admin dashboard now aggregates a shared backend database (not per-test local state), so
    // verify this specific order reached it by id rather than asserting an exact revenue total.
    await open(page, '/admin/orders');
    await page.getByRole('searchbox', { name: 'Search orders or customers' }).fill(orderId!);
    await page.getByRole('button', { name: 'Manage order ' + orderId }).click();
    await expect(page.getByRole('dialog')).toContainText(orderId!);
    await expect(page.getByRole('dialog')).toContainText(payment);
    await page.getByRole('button', { name: 'Close details', exact: true }).click();
    await open(page, '/admin');
    await page.getByRole('link', { name: 'Manage products', exact: true }).click();
    await expect(page.locator('.ops-count-strip')).toContainText('12 Total products');
    await open(page, '/admin');
    await page.getByRole('link', { name: /^View storefront/ }).click();
    await expect(page.locator('.product-card')).toHaveCount(12);
  });
}

test('privacy reset clears local shopping and account data', async ({ page }) => {
  await signIn(page);
  await addProduct(page);
  await page.getByRole('button', { name: 'Add to wishlist', exact: true }).click();
  await open(page, '/info/privacy');
  await page.getByRole('button', { name: 'Clear prototype data', exact: true }).click();
  await expect(page.locator('header').getByRole('link', { name: 'Shopping bag, 0 items' })).toBeVisible();
  await expect(page.locator('header').getByRole('link', { name: 'Log in', exact: true })).toBeVisible();
  await open(page, '/wishlist');
  await expect(page.locator('.product-card')).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ghoster-prototype-v1')!));
  expect(saved).toEqual({ cart: [], wishlist: [], user: null, orders: [], addresses: [] });
});
