# Books feature guidance

These instructions supplement the [source guidance](../../AGENTS.md) within this folder.

## Responsibilities and API contract

- `BookListComponent` owns list loading and search; `BookItemComponent` presents an input book and links
  to its details. `BookDetailsComponent` owns route-driven detail loading and retry.
- Keep transport logic in `BookApiClient` and reuse the `Book` interface in `book.ts`.
  IDs and prices are strings; the subtitle is optional. The interface supplies compile-time typing,
  not runtime response validation.
- The `BOOK_API_URL` token is supplied by application configuration; its development default is `http://localhost:4730/books`.
  `getBooks(pageSize = 10, searchTerm?)` sends `_limit` and, when present, `q` for server-side search.
  `getBook(id)` fetches `/books/:id` with the ID encoded as a URL path segment.
- Preserve these contracts unless the task explicitly requires changing them. Do not infer a currency
  or convert the API price string into a number for display.

## Behavior to preserve

- The list is at `/`; details are at `/books/:id`. Book links must work with the keyboard, and details
  must support direct URLs and provide a "Back to books" link to `/`.
- Details display cover, title, optional subtitle, author, ISBN, publisher, page count, price, and abstract.
  Keep a fallback for missing or broken detail covers and reset cover failure state when loading another book.
- Distinguish detail loading, success, HTTP 404, and other failures. Offer retry for other failures.
  React to route ID changes in a reused component, cancel obsolete requests, and unsubscribe on destruction.
  The current details flow uses `switchMap` and a single template `AsyncPipe` subscription.
- The list debounces nonempty searches for 300 ms and loads immediately when cleared or retried. Query changes
  cancel previous HTTP/debounce work immediately. Preserve reloads on page-size changes and explicit list errors.
- Reuse `BookCoverComponent` for cover fallback and `RequestErrorComponent` for recoverable request errors.
  Keep image failure state inside the cover component, separate from request orchestration.
- Keep global diagnostics in the shared interceptor/reporter. Expected detail 404s remain local; preserve the HTTP
  context marking them as expected. Do not add duplicate component logging or global toasts for inline failures.

## Verification

- Maintain application browser coverage in `tests/book-details.spec.ts` at the repository root using mocked
  API responses. Follow the root instructions for running it on a free port.
- For affected behavior, cover list-to-detail navigation, direct links, route ID changes, request cancellation,
  missing subtitle, valid/missing/broken covers, 404, retry, literal text rendering, and a narrow viewport.
- When changing search orchestration, verify latest-query-wins behavior, clearing during debounce, and cleanup
  on navigation. Keep backend persistence and editing out of read-only detail changes unless requested.
- Use `books.spec.ts` for exact HTTP cancellation, injected API configuration, and shared cover/error behavior.
  Browser tests assert user-visible behavior and real history navigation without patching the HTTP transport.
