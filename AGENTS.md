# Repository guidance

## Project context

BookMonkey is a browser-rendered Angular workshop app for browsing, searching, and viewing books.
Read [ARCHITECTURE.md](ARCHITECTURE.md) for the architecture, data flow, known risks, and evolution priorities,
and [README.md](README.md) for local setup. The architecture document distinguishes current behavior from
the historical assessment that motivated the refactoring.

Instructions in this file apply throughout the repository. Additional guidance applies within
[src/](src/AGENTS.md) and the [books feature](src/app/books/AGENTS.md).

## Recovering task context

When an agent or another skill lacks the current requirement, issue identifier, or implementation objective,
use [recover-context](.agents/skills/recover-context/SKILL.md). Reuse its source-backed task brief to keep
implementation, tests, and refactoring aligned with the original requirement and later user clarifications.

## Working rules

- Do not check local files into TFS.
- If changes in a `Description` folder are necessary, the code generator must run afterward.
  Never run it yourself; ask the user to run it and report that generation is pending.
- Preserve existing user changes and keep edits focused on the requested task.
- Prefer the existing feature structure and dependencies. Avoid introducing stores, generic CRUD layers,
  or server infrastructure without a concrete requirement.

## Development and validation

- Install locked dependencies with `npm ci`.
- Start the app with `npm start` (normally port 4200). The separate backend starts with
  `npx bookmonkey-api` on port 4730; its endpoint documentation is available at that address.
- Run `npm run build` for application changes; it checks strict compilation and production bundle budgets.
- Run relevant application browser tests with
  `npx playwright test tests/book-details.spec.ts --reporter=list`.
  The suite mocks API responses and does not require the backend. Install missing browsers with
  `npx playwright install`; Chromium, Firefox, and WebKit are configured.
- If port 4200 belongs to another application, set `BOOKMONKEY_TEST_PORT` to a free port before testing
  (PowerShell example: `$env:BOOKMONKEY_TEST_PORT = '4300'`). The configuration may reuse an existing server,
  so verify that it serves this project.
- `npm test -- --watch=false --browsers=ChromeHeadless` runs focused Karma/Jasmine tests for HTTP configuration,
  request lifetime, error reporting, list orchestration, and cover recovery. Chrome must be installed or `CHROME_BIN`
  must point to a compatible executable. External Playwright examples live outside the configured test directory.
- Format only changed files using `npx prettier --write <paths>` and check whitespace with `git diff --check`.
  Documentation-only changes need formatting and link checks rather than application builds.
- On Windows PowerShell, use `npm.cmd` and `npx.cmd` if execution policy blocks their `.ps1` wrappers.
- Report checks actually run, their results, and any environment limitations. Do not report blocked checks as passing.
