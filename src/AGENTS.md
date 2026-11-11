# Source guidance

These instructions supplement the [root guidance](../AGENTS.md) for all files under `src/`.
Use [ARCHITECTURE.md](../ARCHITECTURE.md) for broader context, verifying its descriptions against current code.

## Technical conventions

- Use Angular standalone components, strict TypeScript, and strict template checking. Keep imports explicit
  and preserve type safety rather than adding `any` or weakening compiler settings.
- Keep bootstrap and application providers in `main.ts` and `app/app.config.ts`, navigation in
  `app/app.routes.ts`, and feature behavior in its feature folder. Register concrete routes before the wildcard.
- Use Angular dependency injection and `HttpClient` through feature API services; keep HTTP URLs and
  request construction out of templates and presentation components.
- Keep state local when it belongs to one view. NgRx, TanStack Query, SSR, and Express packages are installed
  but are not integrated into the current application; their presence alone is not a reason to adopt them.
- Coordinate asynchronous work so outdated responses cannot replace current state. Bind subscriptions and
  timers to component lifetimes, using `AsyncPipe` or explicit lifecycle cleanup as appropriate.
- Represent loading and failure explicitly in new request-driven views. Avoid presenting a request failure
  as an empty result.

## UI and shared code

- Follow the existing Tailwind styling and responsive layout. Angular Material currently supplies the shared
  snack-bar wrapper; avoid adding a second UI framework.
- Keep UI text in English. Use semantic links for navigation, buttons for actions, meaningful image alternative
  text, visible keyboard focus, and accessible status/error messages.
- Render API text with interpolation. Do not render book descriptions as raw HTML.
- Keep feature-specific components and helpers within their feature. Add shared code under `app/shared/`
  when it has a concrete reusable responsibility.
- Follow `.prettierrc`: two-space indentation, single quotes in TypeScript, semicolons, and no trailing commas.
  Format changed files rather than unrelated source.

For book-related changes, also follow [books/AGENTS.md](app/books/AGENTS.md).
