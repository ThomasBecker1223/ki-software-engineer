---
name: tdd-red
description: Run the TDD Red phase from a user story and Given/When/Then acceptance criteria. Scaffold executable unit and UI tests using the project's existing tools, map every scenario to a test case, and verify failures expose missing required behavior. Stop before implementing the feature.
---

# TDD Red phase

Turn agreed requirements into executable failing tests and a handoff for the Green phase. Create tests when
this skill is invoked; do not implement application behavior, refactor production code, or start Green automatically.

## Establish the requirement and test environment

- Read the supplied user story, acceptance criteria, and subsequent user corrections. If task context is
  missing, use [recover-context](../recover-context/SKILL.md). If an acceptance criterion has a material
  ambiguity, clarify it with the user or use [requirements-interview](../requirements-interview/SKILL.md).
  Do not invent business rules to make a scenario testable.
- Read applicable `AGENTS.md` files, test scripts/configuration, relevant source, and nearby tests before
  choosing paths, interfaces, or fixtures. Treat technical notes as implementation context rather than
  additional acceptance criteria unless the user explicitly made them requirements.
- Use the installed test stack. In this repository, Jasmine/Karma unit tests live under `src/` as
  `*.spec.ts`, and Playwright application tests live under `tests/`. Reuse existing fixtures and the
  configured `baseURL`; `tests-examples/` is outside the application suite.
- Run a focused existing test when needed to establish that the relevant runner works. Missing packages,
  compilation errors, unavailable browsers, and a wrong development server are setup problems, not Red.
  Avoid unrelated tooling migrations; report a blocker if a working test environment cannot be established
  within the authorized scope.

## Map Given/When/Then to test cases

Assign each supplied acceptance scenario a stable identifier, preserving existing IDs when available.
Each Given/When/Then scenario must map to at least one named, executable test case; each example row in a
scenario outline becomes a separate parameterized case. Keep the mapping visible in test names or comments.

Translate **Given** into deterministic setup, **When** into the action, and **Then** into observable assertions.
Keep **And** clauses as setup, actions, or assertions belonging to the same scenario. Split genuinely independent
outcomes when necessary while retaining their source criterion ID. Do not collapse several scenarios into one
large smoke test or leave a criterion covered only by a comment.

Choose the layer that can prove the criterion:

- **Unit tests:** Isolate business rules, service/component behavior, state transitions, and failure handling
  with Jasmine and the existing Angular testing utilities. Use controlled clocks and HTTP testing tools
  where appropriate. Assert public outcomes rather than private fields or implementation call order.
- **UI tests:** Exercise user-visible workflows with Playwright, semantic locators, realistic navigation,
  and observable results. Control backend responses and browser state so the case does not depend on a
  live external service. Mock the boundary, not the application behavior being tested.

Scaffold both layers when the requirement includes both isolated behavior and a UI workflow. A scenario may
have complementary unit and UI cases, but do not duplicate every assertion at both layers. For a scenario
that is meaningful only at one layer, record why that layer is sufficient rather than inventing UI or logic
outside the requirement. Preserve negative/boundary examples already specified; label additional proposed
scenarios separately and clarify them if they would expand scope.

## Write meaningful failing tests

- Follow nearby naming and fixture conventions. Make assertions about required behavior so the same tests
  can pass after implementation without changing their expectations.
- Keep tests discoverable, type-correct, and runnable. Do not use skipped/pending tests, empty test bodies,
  unconditional failures, intentionally false assertions, or placeholder snapshots to manufacture Red.
- Prefer testing through existing public entry points. An assertion that required UI is absent can be a
  valid Red result; a typo in its locator or a page that never bootstrapped cannot.
- If the intended unit interface does not exist, identify the smallest proposed public contract and clarify
  it where necessary. Do not add production stubs or create unresolved imports just to obtain a failure.
  Use an existing behavioral boundary if possible; otherwise report the affected unit case as blocked,
  with the missing contract, rather than claiming a compilation failure verifies its acceptance criterion.
- Isolate mutable browser state and release deferred fixtures during cleanup. Avoid arbitrary sleeps and
  broad exception swallowing. Preserve existing tests and production behavior.

## Verify Red and stop

Run the new or changed tests with the repository's runner and inspect the actual failure output. For every
case, distinguish:

- **Red verified:** The test executed and failed because a specific required behavior is missing or incorrect.
- **Already satisfied:** The test executed and passed. Keep valid coverage; never break existing behavior,
  weaken a passing test, or reverse an assertion to force Red.
- **Blocked/unverified:** Setup, type checking, fixture defects, inaccessible resources, or execution problems
  prevented observing the required failure. Include the cause; an unrun scaffold is not a verified failing test.

Correct test defects and rerun affected cases. If a failure could reflect either a bad fixture or missing
behavior, investigate before labeling it Red. Use existing working cases or runner output to verify that
the application and relevant fixture reached the scenario. Do not repeatedly run unrelated suites once the
targeted result is clear.

Project commands include `npm test -- --watch=false --browsers=ChromeHeadless` for units and
`npx playwright test <test-file> --reporter=list` for UI tests. Check the current configuration before use.
On PowerShell, use `npm.cmd`/`npx.cmd` if script execution policy requires it. For an occupied application
port, use the existing `BOOKMONKEY_TEST_PORT` setting and verify the server belongs to this project.
Report the browser and any alternate capture/launch procedure actually used.

Return a compact handoff containing the requirement source, changed test files, and a mapping of criterion ID
to layer/test case, actual status, and observed failure reason. Include executed commands, blockers, and the
missing behavior that the Green phase should implement. Return it in conversation or to the caller; create
a separate report file only when requested. Leave meaningful failing tests in place and stop at Red.
