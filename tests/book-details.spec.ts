import { expect, test } from '@playwright/test';
import { apiUrl, book, deferBook, mockBooks, mockCover } from './helpers/books';

test.beforeEach(async ({ page }) => {
  await mockBooks(page);
  await mockCover(page);
});

test('opens details using the keyboard and returns to the list', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'View details for ' + book.title }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/books\/1$/);
  await expect(page.getByRole('heading', { name: book.title, exact: true })).toBeVisible();
  await expect(page.getByText(book.subtitle!, { exact: true })).toBeVisible();
  for (const value of [book.author, book.isbn, book.publisher, String(book.numPages), book.price]) {
    await expect(page.getByText(value, { exact: true })).toBeVisible();
  }
  await expect(page.locator('article')).toContainText(book.abstract);
  await expect(page.locator('article script, article b')).toHaveCount(0);
  expect(await page.evaluate(() => 'bookScriptExecuted' in window)).toBe(false);
  await page.getByRole('link', { name: 'Back to books' }).click();
  await expect(page.getByRole('heading', { name: 'Book Collection' })).toBeVisible();
});

test('supports direct links, loading, and missing optional data on a small screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const pending = await deferBook(page, { ...book, subtitle: undefined });
  try {
    await page.goto('/books/1');
    await expect(page.getByRole('status')).toHaveText('Loading book...');
  } finally {
    pending.release();
  }
  await expect(page.getByRole('heading', { name: book.title, exact: true })).toBeVisible();
  await expect(page.getByText(book.subtitle!, { exact: true })).toHaveCount(0);
  await expect(page.getByText('No cover available')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('replaces a broken cover with a fallback on details and list', async ({ page }) => {
  await mockBooks(page, [{ ...book, cover: '/broken-cover.png' }]);
  await page.goto('/books/1');
  await expect(page.getByText('No cover available')).toBeVisible();
  await expect(page.locator('article img')).toHaveCount(0);
  await page.getByRole('link', { name: 'Back to books' }).click();
  await expect(page.getByText('No cover available')).toBeVisible();
});

test('displays a valid cover with alternative text', async ({ page }) => {
  await mockBooks(page, [{ ...book, cover: '/cover.svg' }]);
  await page.goto('/books/1');
  const cover = page.getByRole('img', { name: book.title });
  await expect(cover).toBeVisible();
  await expect.poll(() => cover.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByText('No cover available')).toHaveCount(0);
});

test('shows an expected not-found state without global diagnostics', async ({ page }) => {
  const reports: string[] = [];
  page.on('console', message => {
    if (message.text().includes('Unexpected application error:')) reports.push(message.text());
  });
  await page.route(apiUrl + '/missing', route => route.fulfill({ status: 404, json: {} }));
  await page.goto('/books/missing');
  await expect(page.getByRole('alert')).toContainText('Book not found');
  await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveCount(0);
  expect(reports).toEqual([]);
});

test('reports an API failure once and recovers with retry', async ({ page }) => {
  let attempts = 0;
  const reports: string[] = [];
  page.on('console', message => {
    if (message.text().includes('Unexpected application error:')) reports.push(message.text());
  });
  await page.route(apiUrl + '/1', route =>
    ++attempts === 1 ? route.fulfill({ status: 500, json: {} }) : route.fulfill({ json: book })
  );
  await page.goto('/books/1');
  await expect(page.getByRole('alert')).toContainText('Unable to load book');
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('heading', { name: book.title, exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(attempts).toBe(2);
  expect(reports).toHaveLength(1);
});

test('uses real back/forward navigation and resets cover fallback for another book', async ({ page }) => {
  const second = { ...book, id: '2', title: 'Second book', cover: '/cover.svg' };
  await mockBooks(page, [{ ...book, cover: '/broken-cover.png' }, second]);
  await page.goto('/books/1');
  await expect(page.getByText('No cover available')).toBeVisible();
  await page.getByRole('link', { name: 'Back to books' }).click();
  await page.getByRole('link', { name: 'View details for Second book' }).click();
  await expect(page.getByRole('img', { name: second.title })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Book Collection' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: book.title, exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Book Collection' })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { name: second.title, exact: true })).toBeVisible();
});

test('releasing an outdated request cannot replace the current route', async ({ page }) => {
  const second = { ...book, id: '2', title: 'Newest book' };
  await mockBooks(page, [book, second]);
  await page.goto('/books/2');
  await expect(page.getByRole('heading', { name: second.title, exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to books' }).click();
  const pending = await deferBook(page, book);
  try {
    await page.getByRole('link', { name: 'View details for ' + book.title }).click();
    await pending.requested;
    await expect(page.getByRole('status')).toBeVisible();
    // Browser back skips the list, keeping the details component active across an ID change.
    await page.evaluate(() => window.history.go(-2));
    await expect(page.getByRole('heading', { name: second.title, exact: true })).toBeVisible();
  } finally {
    pending.release();
  }
  await pending.completed;
  await expect(page.getByRole('heading', { name: second.title, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: book.title, exact: true })).toHaveCount(0);
});

test('leaving details prevents a late response from repopulating the page', async ({ page }) => {
  const pending = await deferBook(page, book);
  try {
    await page.goto('/books/1');
    await pending.requested;
    await page.getByRole('link', { name: 'Back to books' }).click();
  } finally {
    pending.release();
  }
  await pending.completed;
  await expect(page.getByRole('heading', { name: 'Book Collection' })).toBeVisible();
  await expect(page.locator('article')).toHaveCount(0);
});
