import { expect, Page, test } from '@playwright/test';
import { apiUrl, book, mockBooks } from './helpers/books';

function themeButton(page: Page, mode: string) {
  return page
    .getByRole('group', { name: 'Appearance' })
    .getByRole('button', { name: mode[0].toUpperCase() + mode.slice(1), exact: true });
}

test.beforeEach(async ({ page }) => {
  await mockBooks(page);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test('THEME-01: defaults to the ' + colorScheme + ' system preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    await expect(themeButton(page, colorScheme)).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.getItem('bookmonkey.theme'))).toBe(colorScheme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      colorScheme === 'dark' ? 'rgb(17, 24, 39)' : 'rgb(249, 250, 251)'
    );
  });

  test('THEME-02: persists a manual ' + colorScheme + ' selection and gives it priority', async ({ page }) => {
    const opposite = colorScheme === 'dark' ? 'light' : 'dark';
    await page.emulateMedia({ colorScheme: opposite });
    await page.goto('/');
    await themeButton(page, colorScheme).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
    expect(await page.evaluate(() => localStorage.getItem('bookmonkey.theme'))).toBe(colorScheme);
    await page.emulateMedia({ colorScheme });
    await page.emulateMedia({ colorScheme: opposite });
    await page.reload();
    await expect(themeButton(page, colorScheme)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
  });
}

test('THEME-01: uses the system only on first start and restores that initial choice on reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(themeButton(page, 'light')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('bookmonkey.theme'))).toBe('light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(themeButton(page, 'light')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('THEME-04: keeps the selector and dark surfaces across list, details, and errors', async ({ page }) => {
  await page.goto('/');
  await themeButton(page, 'dark').click();
  await expect(page.locator('header')).toHaveCSS('background-color', 'rgb(31, 41, 55)');
  await expect(page.getByRole('searchbox')).toHaveCSS('background-color', 'rgb(31, 41, 55)');
  const card = page.getByRole('link', { name: 'View details for ' + book.title });
  await expect(card).toHaveCSS('background-color', 'rgb(31, 41, 55)');
  await card.click();
  await expect(themeButton(page, 'dark')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('article')).toHaveCSS('background-color', 'rgb(31, 41, 55)');
  await page.getByRole('link', { name: 'Back to books' }).click();
  await expect(themeButton(page, 'dark')).toHaveAttribute('aria-pressed', 'true');
  await page.route(apiUrl + '/1', route => route.fulfill({ status: 500, json: {} }));
  await card.click();
  await expect(page.getByRole('alert')).toHaveCSS('background-color', 'rgb(39, 52, 73)');
  await themeButton(page, 'light').click();
  await expect(page.getByRole('alert')).toHaveCSS('background-color', 'rgb(243, 244, 246)');
});

for (const stored of ['invalid', 'system']) {
  test('replaces the stored ' + stored + ' value with the initial system default', async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('bookmonkey.theme', value), stored);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(themeButton(page, 'dark')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => localStorage.getItem('bookmonkey.theme'))).toBe('dark');
  });
}

test('still switches when browser storage is unavailable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      }
    });
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(themeButton(page, 'light')).toHaveAttribute('aria-pressed', 'true');
  await themeButton(page, 'dark').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
});

test('THEME-03: renders only the light and dark icons with accessible names', async ({ page }) => {
  // Given the app is open, when the header renders, then only two icon buttons are offered.
  await page.goto('/');
  const group = page.getByRole('group', { name: 'Appearance' });
  await expect(group.getByRole('button')).toHaveCount(2);
  await expect(themeButton(page, 'light')).toBeVisible();
  await expect(themeButton(page, 'dark')).toBeVisible();
  await expect(group).toHaveText('');
  await expect(themeButton(page, 'light').locator('svg')).toHaveCount(1);
  await expect(themeButton(page, 'dark').locator('svg')).toHaveCount(1);
});

test('THEME-03: offers keyboard access without overflowing a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await themeButton(page, 'light').focus();
  await expect(themeButton(page, 'light')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(themeButton(page, 'light')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab');
  await expect(themeButton(page, 'dark')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(themeButton(page, 'dark')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
