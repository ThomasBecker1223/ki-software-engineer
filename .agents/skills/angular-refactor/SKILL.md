---
name: angular-refactor
description: Refactor Angular components while preserving requirements and observable behavior. Apply project standards and practical SOLID principles through one production component per file, clear responsibility and abstraction boundaries, and lifecycle-safe reactive composition. Use for requested Angular maintainability work or the TDD Refactor phase, not new feature implementation.
---

# Angular refactoring

Improve the structure of the requested Angular code without changing accepted behavior. Make concrete
maintainability improvements, not a framework migration or an application-wide rewrite.

## Establish scope and a behavioral baseline

- Read the user's target and any Green-phase handoff. Use [recover-context](../recover-context/SKILL.md)
  when the requirement or scope is missing. Do not assume the most recently edited feature is the target.
- Read applicable `AGENTS.md` files, relevant sections of `ARCHITECTURE.md`, the actual source, callers,
  tests, compiler settings, and formatting configuration. Treat historical architecture findings as
  context, not automatic authorization to fix the whole backlog.
- Inspect existing user changes and preserve them. Identify the smallest cohesive refactoring scope and
  name the observed problem and intended improvement before editing.
- Run affected tests to establish the baseline. Separate existing behavioral failures from runner/browser
  problems. Refactoring is not permission to implement missing behavior; when that is necessary, surface
  it and use [tdd-green](../tdd-green/SKILL.md) only within the user's authorized task.

Preserve public inputs/outputs, route behavior, HTTP contracts, event ordering, request timing, persistence,
error/retry behavior, and accessible UI semantics. Clarify any proposed externally visible change instead
of quietly including it in cleanup. If execution is blocked, report that baseline verification is incomplete.

## Apply project conventions and practical SOLID

For this repository, retain standalone components, strict TypeScript/templates, feature-local ownership,
Angular DI/HttpClient, Tailwind styling, English UI text, and `.prettierrc`. Keep the shared theme tokens,
visible keyboard focus, semantic navigation, and text interpolation. Confirm current standards before use.

- **One component per file:** Put each production `@Component` in its own appropriately named file and
  update imports/callers. Keep component-specific types local when useful. Do not scatter trivial types
  across files or split a focused test host merely to satisfy the production-file convention.
- **Single responsibility:** Route/request containers coordinate view state; presentation components
  render inputs and emit user actions; API services own transport. Extract behavior with a distinct reason
  to change, such as reusable cover fallback. Do not introduce a service for every small function.
- **Open/closed:** When concrete variants already exist, prefer a small configuration, input, or composed
  collaborator over repeated conditionals. Do not invent extension points for hypothetical future features.
- **Liskov substitution:** Any replacement must preserve the caller's contract, including errors, nullability,
  side effects, and subscription/cancellation behavior. Prefer composition over new component base classes.
- **Interface segregation:** Give components and collaborators the smallest relevant inputs/outputs or
  callable surface. Avoid passing an entire store or service when a value and event express the boundary.
- **Dependency inversion:** Use Angular DI and configurable tokens for genuine external/configuration
  boundaries. Depend on focused collaborators, but do not add interfaces or generic repositories solely
  to mirror every concrete service. TypeScript interfaces alone are not Angular injection tokens.

Keep feature-specific abstractions within the feature. Promote them to `shared/` only for an established
cross-feature responsibility. Reuse existing dependencies; installed but unused stores/query packages are
not a reason to introduce global state.

## Keep abstraction levels consistent

A method or template block should express one level of intent. Separate routing/query orchestration,
transport construction, domain transformations, and presentation where they are currently mixed.
Extract a cohesive helper or collaborator with a meaningful name rather than replacing a short expression
with several layers of forwarding methods.

Use external templates for substantial view markup. Move complex data transformations and business rules
out of templates; leave simple display conditions and bindings visible. Use the project's control-flow
blocks and a typed view model for mutually exclusive states. Unwrap observable view state once when that
avoids duplicate subscriptions. Extract components for coherent behavior or reuse, not arbitrary line limits.
Preserve parent layout, focus, IDs/labels, content semantics, and styling when moving markup.

Keep constructors focused on dependency acquisition. Move imperative startup work to an explicit initializer
or appropriate lifecycle boundary when it currently runs during construction, preserving when it must occur.
A lazily declared observable is not itself an executed HTTP side effect and does not need ceremonial relocation.

## Compose state and effects reactively

- Give each piece of state one clear owner. Prefer derived values through `computed` for existing signals
  or observable operators for existing streams instead of synchronizing duplicate mutable fields.
  Keep presentation state local to its component, separate from request state.
- Replace nested subscriptions and unmanaged timers with a composed stream where this simplifies ownership.
  Choose operators according to required concurrency: `switchMap` for replaceable reads, ordered or guarded
  composition for operations that must finish. Do not cancel writes merely to standardize syntax.
- Preserve debounce, clear, retry, and input-change semantics. For latest-query-wins reads, ensure a new
  query invalidates stale work immediately, even when the next request is delayed by debounce.
- Use `AsyncPipe`, `takeUntilDestroyed`, or equivalent existing lifecycle ownership. Clean up timers,
  browser listeners, and effects, not just HTTP subscriptions. Avoid manual subscription arrays when the
  framework's lifecycle integration suffices.
- Keep loading, error, and empty/success states distinct. Catch recoverable errors at the level that allows
  future input/retry events to continue; do not terminate the outer interaction stream accidentally.
  Preserve global diagnostic ownership and expected-error context rather than adding duplicate logging/toasts.
- Avoid using effects for pure derivation or adding caching/multicasting by default. If sharing is needed,
  explicitly preserve request count, cache lifetime, ref-counting, error behavior, and cancellation semantics.
  Do not convert all signals to RxJS or vice versa for stylistic uniformity.

## Refactor incrementally and verify

Make small cohesive transformations and run affected tests after each meaningful change. Retain existing
behavioral assertions and acceptance IDs. Add focused characterization coverage only for important uncovered
behavior at risk; do not add tests that simply mirror extracted methods.

If an internal refactoring invalidates a private-structure assertion or test import, change only that coupling
and explain why the same observable behavior remains covered. Do not weaken acceptance criteria, bulk-update
snapshots, add skips, or alter runner selection/retries to hide a regression. Stop and investigate any new failure.

After affected tests pass, run the applicable unit/UI suites, production build, and formatting/type checks
required by repository guidance. Include configured browser projects when claiming the full UI suite passes;
otherwise name the verified subset and blocked projects. Report prior baseline failures separately. Inspect
the final diff for unintended public API, behavior, dependency, or unrelated formatting changes. Update
architecture documentation only when the refactoring changes documented responsibilities or data flow.

Return the problems addressed, resulting responsibility boundaries, relevant changed files, tests/checks
actually run and their outcomes, and any limitations or remaining risks. Do not claim preserved behavior
is fully verified when required checks could not run. Stop after the scoped refactoring; do not add features,
commit to TFS, or run the `Description` code generator. Follow the root guidance if generation is required.
