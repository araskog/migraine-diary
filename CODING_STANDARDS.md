# Coding Standards

## Boundaries and Errors

Use TypeScript for frontend application code and Python for Django code. Keep changes focused and use existing framework capabilities; add dependencies and abstractions only for current needs.

Enforce validation, authorization, and ownership on the backend. Derive ownership from the authenticated user, never client-supplied identifiers. Define API contracts and narrow external input at the boundary. Return useful errors without exposing secrets or internal details. Show success only after an operation succeeds and support retrying failures.

Treat diary dates as calendar dates, following the specification's timezone rules. Use the [glossary](GLOSSARY.md); missing entries never establish migraine-free days. Keep privileged credentials outside version control.

The browser calls the backend only through same-origin `/api/` routes (see [architecture](docs/architecture.md) for deployment and proxying). Keep HTTP clients in focused modules (for example `diary.ts`, `session.ts`) rather than scattering `fetch` through components. Parse JSON as `unknown` and narrow with type guards before use. Use `cache: 'no-store'` on session and diary reads so stale auth or entries are not served from the HTTP cache. Send `X-CSRFToken` on mutating requests; obtain the token from `GET /api/session/`. Include the viewer's IANA `timezone` on diary writes when the specification requires it.

## React and TypeScript

Follow [Thinking in React](https://react.dev/learn/thinking-in-react) and the [Rules of React](https://react.dev/reference/rules): components have focused responsibilities, rendering stays pure, and Hooks run unconditionally at component or custom Hook top level. Define components at module scope.

Extract distinct or reused UI into cohesive components with typed props; avoid arbitrary line limits, trivial label components, and generic frameworks. Keep state with its closest responsible owner, lifting shared state to a common parent. Do not mutate props or state. Keep side effects outside rendering and clean up Effects.

Do not use explicit `any` or non-null assertions. Use explicit types or `unknown` with narrowing. Oxlint enforces these restrictions and the Hooks rule. TypeScript checks complement linting.

## UI and Theming

Follow the visual direction in [architecture](docs/architecture.md) (Interface Design): calm surfaces, sage accents, generous spacing, and accessible focus states.

Use [Mantine](https://mantine.dev/) for controls, typography, spacing, and surfaces. Prefer Mantine props and theme tokens over bespoke markup. Extend shared defaults in `frontend/src/theme.ts` with `createTheme` and component `.extend()` when a pattern repeats. Register app-specific colors and per-scheme variables in `cssVariablesResolver`; reference them in CSS as `--mantine-*` or `--app-*`.

Wrap the application in `MantineProvider` with the shared theme (see `frontend/src/main.tsx`). Import Mantine package styles there or in test setup that renders components. Reserve custom CSS for layout the library does not cover, scoped under a component root (for example `.app` in `App.css`).

## CSS and Formatting

Follow [MDN's CSS organization guidance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Organizing): use readable, consistent rules and low-specificity selectors scoped to the component root. Reserve global styles for document defaults and resets. Prefer Mantine and theme variables for color and radius; see [UI and Theming](#ui-and-theming). Preserve responsive layouts, accessible labels, and visible keyboard focus.

Use local [Prettier](https://prettier.io/docs/install) for frontend source and configuration: two-space indentation, single quotes, and no semicolons. Run the formatting check alongside lint, types, and build.

## Python and Django

Apply the relevant application conventions from [Django 5.2 coding style](https://docs.djangoproject.com/en/5.2/internals/contributing/writing-code/coding-style/): PEP 8 naming, four-space indentation, and grouped standard-library, third-party, and local imports. Use Ruff for linting, import ordering, and formatting rather than Django core's Black/flake8 tooling; other core contribution rules are not blanket application requirements.

Use Django REST Framework serializers to validate request bodies and shape responses. Scope queries and writes with `request.user`; do not trust client-supplied user identifiers. Decorate session- and diary-facing API views with `@never_cache` so browsers and intermediaries do not cache personalized responses.

## Tests and Checks

Test observable behavior within agreed boundaries, especially persistence, ownership, validation, and failures. Keep behavioral inputs deterministic; generate valid synthetic credentials with standard-library helpers. Fixed invalid credentials are appropriate for failure tests. Add regression tests for fixes; do not mock away the behavior under test.

Use the checks in [README](README.md) and [reviews](docs/agents/reviews.md). Report unavailable checks and distinguish defects from optional suggestions.