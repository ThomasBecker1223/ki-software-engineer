import { Page, Route } from '@playwright/test';
import type { Book } from '../../src/app/books/book';
import { DEFAULT_BOOK_API_URL } from '../../src/app/books/book-api.config';

export const apiUrl = DEFAULT_BOOK_API_URL;
export const book: Book = {
  id: '1',
  title: 'Angular in Practice',
  subtitle: 'Building useful applications',
  author: 'Ada Reader',
  isbn: '9781234567890',
  publisher: 'Workshop Press',
  numPages: 320,
  price: '29,90 EUR',
  cover: '',
  abstract: 'A practical guide.\n<script>window.bookScriptExecuted = true</script><b>literal text</b>',
  userId: 1
};

export async function mockBooks(page: Page, books: Book[] = [book]): Promise<void> {
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route(apiUrl + '?*', route => {
    const query = new URL(route.request().url()).searchParams.get('q') || '';
    return route.fulfill({
      json: books.filter(book => (book.title + book.author).toLowerCase().includes(query.toLowerCase()))
    });
  });
  await page.route(apiUrl + '/*', route => {
    const id = decodeURIComponent(new URL(route.request().url()).pathname.split('/').pop()!);
    const found = books.find(book => book.id === id);
    if (!found) throw new Error('Unexpected book ID in test: ' + id);
    return route.fulfill({ json: found });
  });
}

export async function mockCover(page: Page): Promise<void> {
  await page.route('**/cover.svg', route =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40"><rect width="30" height="40" fill="blue"/></svg>'
    })
  );
  await page.route('**/broken-cover.png', route => route.fulfill({ status: 404, body: '' }));
}

export async function deferBook(page: Page, response: Book) {
  let release!: () => void;
  let started!: () => void;
  const ready = new Promise<void>(resolve => (release = resolve));
  const requested = new Promise<void>(resolve => (started = resolve));
  let complete!: () => void;
  const completed = new Promise<void>(resolve => (complete = resolve));
  await page.route(apiUrl + '/' + response.id, async (route: Route) => {
    started();
    await ready;
    try {
      await route.fulfill({ json: response });
    } catch (error) {
      // A cancelled request can disappear before the delayed response is released.
      if (
        !(error instanceof Error) ||
        !/Invalid InterceptionId|already handled|Target.*closed|has been closed/i.test(error.message)
      )
        throw error;
    } finally {
      complete();
    }
  });
  return { release, requested, completed };
}
