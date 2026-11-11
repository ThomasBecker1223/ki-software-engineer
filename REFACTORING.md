# BookMonkey maintainability review

## Review context

Static review of the generated book details feature, its Playwright tests, and its integration with the existing
list, API client, and project guidance. Findings distinguish newly introduced issues from pre-existing limitations.
The findings below record the pre-refactoring review. The implementation status section describes the changes now applied.

[ARCHITECTURE.md](ARCHITECTURE.md) now describes the refactored implementation and retains its original assessment as
explicitly historical context.

The feature has useful foundations worth preserving: a typed API client, semantic navigation links, text interpolation,
explicit detail states, and request cancellation through `switchMap` and one `AsyncPipe` subscription.
No constructor side effects were found: the inspected constructors only inject dependencies. The detail observable
is declared during component initialization, but HTTP execution starts on subscription, not construction.

## Implementation status

- Replaced list timers/manual subscriptions with one cancellation-aware state stream, explicit errors, immediate clear/retry,
  and reactive page-size changes. The external template uses control-flow blocks and labeled, keyboard-accessible controls.
- Added central HTTP diagnostics, unchanged error propagation, expected-404 context, and a global Angular error handler.
  Diagnostics use the console and suppress repeated reports of the same error object; remote telemetry remains outside scope.
- Extracted feature-local cover and request-error components. Cover failure resets on source changes and is no longer part
  of the detail request stream. Both list and detail templates use the same presentation behavior.
- Injected the books endpoint through application configuration. The localhost development default is unchanged; runtime
  configuration loading is not introduced.
- Reworked browser fixtures to match IDs, share cover/deferred responses, and use configured relative navigation. Browser tests
  use real history and visible late-response behavior; transport monkey-patching was removed. Literal-text checks also reject
  injected DOM elements. External Playwright examples were moved outside the application test directory.
- Repaired the existing Karma/Jasmine setup and added focused tests for exact HTTP cancellation, configured endpoints,
  expected errors, deduplicated diagnostics, list request ownership, and shared-cover recovery.
- Updated architecture and agent guidance to reflect these changes. No constructor side effects needed removal.

Validation: production build succeeded; 18 Playwright cases passed across Chromium/WebKit and 13 Karma/Jasmine tests passed
in Chromium. In this restricted environment, Karma was started with `--no-browsers` and captured using Playwright-launched
Chromium because its default Chrome launcher could not start browser subprocesses. Firefox was not revalidated; the earlier
browser initialization restriction remains a known environment limitation.

## Original prioritized findings

### 1. High: list request ownership is unsafe and differs from details

**Evidence:** [BookListComponent](src/app/books/book-list.component.ts), `loadBooks`, `onSearchChange`, and `clearSearch`;
compare with `state$` in [BookDetailsComponent](src/app/books/book-details.component.ts).
This is a pre-existing list limitation exposed by reviewing the integrated feature.

Every list query creates an independent subscription. Older responses can overwrite newer searches and clear their
loading indicator. Clearing search leaves the pending timer active, allowing a duplicate request; navigation does not
clear it. `searchTimeout: any` hides its type, and changes to the public `pageSize` input do not trigger a reload.
Maintainers now have two different request-management patterns in the same feature.

**Better approach:** give list queries one feature-local observable owner, matching the details pattern. Feed search,
clear, retry, and page-size changes into it. A new query must cancel both pending debounce work and the previous HTTP
request immediately; delay nonempty search queries by 300 ms and load cleared queries immediately. Use `switchMap`
and lifecycle-bound subscription ownership. Model loading, success/empty, and error explicitly rather than mutating
independent flags. Avoid introducing a global store for these view-local states.

### 2. High: errors have no consistent handling or reporting policy

**Evidence:** the list logs errors and clears `loading`; the details `catchError` converts errors into a status and
discards their diagnostic context. [ToastService](src/app/shared/toast.service.ts) exists but is unused.
[Application configuration](src/app/app.config.ts) registers browser error listeners, without a project-specific
HTTP reporting policy. The inconsistency combines existing list behavior with the new detail behavior.

An initial list failure appears as an empty collection; a failed search can retain results for an older query.
The details screen gives useful feedback but loses the underlying cause for diagnosis. Adding a toast in every
component would duplicate reporting logic and potentially duplicate inline messages.

**Better approach:** define global diagnostics and local recovery as separate responsibilities:

- Add one error-reporting service. An HTTP interceptor reports unexpected server/network failures and rethrows them
  unchanged; it must not turn errors into successful empty responses.
- A custom Angular `ErrorHandler` delegates uncaught application exceptions to the same reporter. Errors already
  caught by HTTP flows do not automatically reach that handler. Give each reporting path one owner to avoid duplicates.
- Keep expected detail 404 handling, loading/error state, and retry in the feature. An expected missing book should
  not trigger a global toast or unexpected-error report. Keep recoverable request failures visible inline.
- Use the toast wrapper only for a concrete transient notification requirement. Do not globally toast every HTTP
  failure or automatically retry every request.

### 3. Medium: duplicated cover presentation has already diverged

**Evidence:** [BookItemComponent](src/app/books/book-item.component.ts) and the
[detail template](src/app/books/book-details.component.html) repeat image, alternative text, sizing, and fallback markup.
The list handles an absent URL; only details handle an image load failure.

The generated detail implementation therefore adds a second behavior to maintain. Its `coverFailed` state also lives
beside request state and is reset through `tap`, coupling image presentation to HTTP orchestration.

**Better approach:** extract a feature-local `BookCoverComponent` with `src` and `alt` inputs. It owns missing/broken
image fallback and resets its failure flag when `src` changes. Let its parent supply the layout dimensions so list and
details keep their existing sizing. Remove `coverFailed` and its reset side effect from the details request flow.

### 4. Medium: template responsibilities and conventions are inconsistent

**Evidence:** the list embeds roughly 65 lines of search, spinner, empty state, and grid markup directly in its
TypeScript decorator. Details use an external template with state branches, cover presentation, and metadata.
The two detail failure branches repeat container and heading styles. List/item use structural directives while
details use Angular control-flow blocks.

The detail template is still manageable; its length alone does not justify splitting every section into a component.
The larger issue is that new changes have no consistent place or pattern, and duplicated state markup can drift.
The existing list also removes the search focus outline and gives its icon-only clear button no accessible name.

**Better approach:** move the list markup to an external template and use control-flow blocks for touched templates.
Keep route/query orchestration in container components and render states from a typed view model, preferably with
`@switch` for mutually exclusive states. Extract the cover because it has repeated behavior; keep simple book metadata
local. Reuse an error/empty-state component only when another view needs the same presentation and actions. Restore
visible keyboard focus and label the search input and clear button while revising that template.

### 5. Medium: cancellation tests are coupled to the HTTP implementation

**Evidence:** `observeRequestCancellation` in [book-details.spec.ts](tests/book-details.spec.ts) patches
`XMLHttpRequest.prototype.send` and marks the document when any request aborts. The delayed routes swallow every
`fulfill` rejection with an empty catch. `changeBookRoute` synthesizes a history event.
These are limitations in the generated tests.

An unrelated request can satisfy the abort assertion; switching Angular HTTP to Fetch would break the instrumentation
without breaking user behavior. Broad catches can hide fixture errors. The synthetic route change exercises component
reuse but does not establish that real browser back/forward navigation works.

**Better approach:** prioritize browser assertions that the newest book stays visible after releasing an older response
and navigation away cannot repopulate the detail view. Add a real browser history flow for component reuse. Verify exact
HTTP cancellation in a focused Angular HTTP test when the unit runner is repaired. Until then, isolate the XHR observer
in a test helper and identify the exact detail request; document its transport dependency. Delayed-response helpers
should release pending work in `finally` and suppress only recognized cancellation/closed-page failures.

### 6. Medium: repeated test setup and a permissive mock weaken verification

**Evidence:** the same test file repeats deferred promises, cover SVG routes, missing-cover responses, and book overrides.
Its default `/books/*` handler returns book 1 for every ID. Port and application URL construction are duplicated between
the tests and [Playwright configuration](playwright.config.ts). The text-rendering fixture uses an injected script marker.

A wrong detail URL can still receive a successful fixture. Repeated setup makes cases harder to compare and update.
The script-execution assertion alone is insufficient: scripts inserted through `innerHTML` need not execute.

**Better approach:** add small helpers for book fixtures, cover responses, and controlled deferred responses. Match mocks
by ID and reject unexpected IDs. Define the application URL once in Playwright configuration through `baseURL` and use
relative page navigation in tests. Keep the literal-text assertion and also assert that the description creates no
`script` or injected HTML elements. Avoid a generic test framework for this small suite.

### 7. Medium: endpoint configuration is tied to the developer machine

**Evidence:** [BookApiClient](src/app/books/book-api-client.service.ts) hard-codes `http://localhost:4730/books`;
tests repeat the same endpoint. This predates details and is inherited by the new `getBook` method.

A deployed browser targets its own localhost, and changing the endpoint requires a source edit.

**Better approach:** inject the API base URL through application configuration, retaining localhost as the development
default. Keep path encoding and query construction inside the API client. Tests should provide or derive the configured
endpoint so a deliberate configuration change does not require editing many unrelated fixtures.

### 8. Low: architecture documentation and the default test suite give conflicting signals

**Evidence:** [ARCHITECTURE.md](ARCHITECTURE.md), under Build and validation, still says detail routes and application
browser coverage do not exist. The new AGENTS files compensate with a warning.
[the external Playwright example](tests-examples/playwright-website.spec.ts) originally lived in the application test directory.

Future contributors must reconcile multiple descriptions, and a default test run includes unrelated network checks.

**Better approach:** update the architecture document for the detail route, cancellation flow, and application tests;
then remove temporary staleness warnings from guidance. Remove or move the external examples outside `testDir`.
Repair the existing unit-test target before adding HTTP cancellation/interceptor unit tests, rather than assuming
`npm test` already supports them.

## Refactoring order and acceptance checks

1. Correct list request ownership and explicit error states. Verify older responses cannot replace the current query,
   clear during debounce sends one immediate request, navigation cancels work, and page-size changes reload.
2. Introduce the shared diagnostics policy. Verify a recoverable failure still reaches the view, an expected 404 stays
   local, unexpected failures are reported once, and retry can recover without a stale error.
3. Extract the cover and align template conventions. Preserve responsive layouts, literal text rendering, keyboard
   navigation, and all bibliographic fields including the API's original price string. Verify cover changes reset failure.
4. Simplify fixtures, strengthen cancellation/history checks, repair focused unit coverage, and reconcile documentation.
   Preserve tests for direct links, loading, 404, retry, valid/missing/broken covers, and narrow viewports.

Run the production build and relevant application browser tests after code changes. Run the repaired unit suite for
HTTP cancellation and reporting behavior. No new state-management framework, generic repository, or broad UI redesign
is needed for these changes.
