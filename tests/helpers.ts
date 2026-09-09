import { test as base, expect, type Page, type Locator } from '@playwright/test';

export const test = base.extend<{ runtimeErrors: string[] }>({
  runtimeErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await use(errors);
    expect(errors, 'The page must not throw uncaught runtime errors').toEqual([]);
  }, { auto: true }],
});
export { expect };

export async function open(page: Page, route = '/') {
  await page.goto('/#' + route);
  await expect(page.locator('.brand-splash')).toHaveCount(0);
  await expect(page.locator('main')).toBeVisible();
}

export async function home(page: Page) {
  await page.locator('header').getByRole('link', { name: 'GHOSTER home', exact: true }).click();
  await expect(page.locator('.campaign-hero')).toBeVisible();
}

export async function choose(page: Page, target: Locator, option: string) {
  await target.click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

export async function filters(page: Page) {
  if (page.viewportSize()!.width <= 760) {
    await page.getByRole('button', { name: /^Filters/ }).click();
    return page.getByRole('dialog', { name: 'Find your fit', exact: true });
  }
  return page.locator('.desktop-filters');
}

export async function closeFilters(page: Page) {
  if (page.viewportSize()!.width <= 760) {
    await page.getByRole('dialog').getByRole('button', { name: /^Show \d+ styles$/ }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
}

export async function addProduct(page: Page, id = 'shadow-oversized', size = 'M') {
  await open(page, '/product/' + id);
  await page.locator('.size-buttons').getByRole('button', { name: size, exact: true }).click();
  await page.getByRole('button', { name: 'Add to loadout', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Unit added', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue shopping', exact: true }).click();
}

export async function bag(page: Page) {
  await page.locator('header').getByRole('link', { name: /^Shopping bag,/ }).click();
  await expect(page.getByRole('heading', { name: /^YOUR LOADOUT\./ })).toBeVisible();
}

export async function fillAddress(scope: Page | Locator, overrides: Record<string, string> = {}) {
  const values = { 'Full name': 'Demo Customer', 'Mobile number': '9876543210', 'Email address': 'demo@example.com', 'PIN code': '600001', 'Flat, street and area': '12 Sample Street', 'City': 'Chennai', 'State': 'Tamil Nadu', ...overrides };
  for (const [name, value] of Object.entries(values)) await scope.getByRole('textbox', { name, exact: true }).fill(value);
}

export async function signIn(page: Page) {
  await open(page, '/login');
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('Demo Customer');
  await page.locator('main').getByRole('textbox', { name: 'Email address', exact: true }).fill('demo@example.com');
  await page.getByRole('button', { name: 'Continue to account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'YOUR ACCOUNT.', exact: true })).toBeVisible();
}

export async function seed(page: Page, data: Record<string, unknown>) {
  await page.addInitScript(data => {
    localStorage.setItem('ghoster-prototype-v1', JSON.stringify({ cart: [], wishlist: [], user: null, orders: [], addresses: [], ...data }));
  }, data);
}
