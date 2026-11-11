---
name: tdd-green
description: Run the TDD Green phase from failing unit or UI tests and their requirements. Read test expectations, implement the smallest production change that satisfies the agreed behavior, and verify the test suites pass. Preserve tests unless a concrete test defect is demonstrated; stop before broad refactoring.
---

# TDD Green phase

Implement the behavior exposed by failing tests, preserving their intent and the agreed requirements.
The deliverable is working production code with verified passing tests, not a rewritten test suite.

## Recover the contract and reproduce the failure

- Read the failing test files, failure output, and any [Red-phase](../tdd-red/SKILL.md) handoff. Recover the
  user story, acceptance criteria, and later corrections using [recover-context](../recover-context/SKILL.md)
  if needed. Do not treat obsolete criteria or incidental fixture values as new product requirements.
- Read applicable `AGENTS.md` files, relevant production code, nearby tests, and runner configuration.
  Inspect the working tree so existing user edits can be preserved.
- Run the targeted failing cases before changing production behavior. Historical failure logs are useful
  clues, not proof that the current checkout is still Red. If they already pass, report them as already
  satisfied and do not invent extra work.
- Distinguish assertion failures caused by missing behavior from test defects, compilation problems,
  broken fixtures, missing browsers, and unavailable services. Repair only setup defects within the task's
  scope; unresolved execution problems mean verification is blocked, not that the feature is wrong.

For each failing scenario, identify its criterion ID or source requirement, **Given** setup, **When** action,
**Then** expectations, actual result, and the production boundary responsible. Read all assertions and
relevant hooks/mocks rather than implementing only the first matcher printed in the failure output.
If a conflict between the tests and requirements is unresolved, clarify it before choosing behavior.

## Implement the smallest correct production change

- Change the existing component, service, or other production boundary responsible for the failure.
  Reuse the project's architecture, dependencies, state ownership, and UI conventions.
- Satisfy the full behavior specified by the scenario, including its agreed boundaries and failure paths.
  Minimal means a focused implementation, not hard-coded fixture values, test-environment branches, fake
  success responses, suppressed exceptions, or a special case for one assertion.
- Preserve working behavior and public contracts unless the requirement explicitly changes them.
  Keep subscriptions, timers, listeners, and other effects tied to their proper lifetimes when affected.
- Keep test files, fixtures, snapshots, runner settings, and acceptance criteria unchanged by default.
  Do not add skips, focused-only tests, weaker assertions, broad retries, or changed expected values to
  conceal a production failure. Do not exclude a failing browser or test file to declare Green.
- Iterate on small production changes and rerun the affected cases. Avoid unrelated cleanup, speculative
  abstractions, dependency migrations, or a general Refactor phase. Do not fix unrelated baseline failures
  silently; report them separately.

## Correct tests only when demonstrably wrong

A test may be corrected when evidence shows an error such as a fixture inconsistent with the documented
contract, a locator targeting the wrong control, or an expectation contradicted by a confirmed user change.
An inconvenient failure, implementation preference, timeout, or flaky run alone does not establish that
the test is wrong.

Before editing a test, identify the defect and cite the requirement or source evidence. Make the smallest
correction while preserving scenario coverage, criterion mapping, and meaningful assertions. Where the
required behavior is still absent, verify that the corrected test exposes it before implementation.
For a snapshot change, inspect the actual output against the accepted requirement; never bulk-accept it.
Record every test correction and its reason in the handoff. Ask for clarification if the intended contract
cannot be determined; do not rewrite the requirement to match the current implementation.

## Verify Green

After targeted cases pass, run the full configured unit and UI suites relevant to the repository, including
their configured browser projects, and required build/type/format checks. Inspect totals and exit status;
verify that test selection has not accidentally reduced discovery. In this repository:

- `npm test -- --watch=false --browsers=ChromeHeadless` runs Jasmine/Karma tests.
- `npx playwright test --reporter=list` runs the configured Playwright suite and browser projects.
- `npm run build` verifies production compilation and bundle budgets. Format only changed files and use
  `git diff --check` for whitespace checks.

Read current scripts/configuration before use. On PowerShell, use `npm.cmd`/`npx.cmd` when script policy
requires them. Use the existing `BOOKMONKEY_TEST_PORT` setting for an occupied app port and verify the
server serves this checkout. Report the actual browser and any alternate launch/capture procedure.

If a required suite or browser cannot run, report the passing subset and the unverified part explicitly;
do not claim all tests pass or full Green. Treat unrelated baseline failures separately from regressions,
but disclose them because the overall suite is not Green. Rerun checks after subsequent changes that can
affect their results; do not keep repeating successful suites without new changes or unresolved concerns.

## Return the Green handoff

Summarize requirement/criterion to test to production change, the commands executed, test totals/results,
and build/check outcomes. Include any justified test corrections, remaining failures, environment blockers,
or behavior that remains unverified. Distinguish new passing runs from earlier reports and already-green
cases. Return the handoff in conversation or to the caller; create a separate report only when requested.

Stop once the scoped implementation and verification are complete. Do not begin broad refactoring, commit,
publish, or change issue state as part of this skill unless separately requested.
