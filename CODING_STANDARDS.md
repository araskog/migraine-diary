# Coding Standards

## Boundaries and Errors

Use TypeScript for frontend application code and Python for Django code. Keep changes focused and use existing framework capabilities; add dependencies and abstractions only for current needs.

Enforce validation, authorization, and ownership on the backend. Derive ownership from the authenticated user, never client-supplied identifiers. Define API contracts and narrow external input at the boundary. Return useful errors without exposing secrets or internal details. Show success only after an operation succeeds and support retrying failures.

Treat diary dates as calendar dates, following the specification's timezone rules. Use the [glossary](GLOSSARY.md); missing entries never establish migraine-free days. Keep privileged credentials outside version control.

## React and TypeScript

Follow [Thinking in React](https://react.dev/learn/thinking-in-react) and the [Rules of React](https://react.dev/reference/rules): components have focused responsibilities, rendering stays pure, and Hooks run unconditionally at component or custom Hook top level. Define components at module scope.

Extract distinct or reused UI into cohesive components with typed props; avoid arbitrary line limits, trivial label components, and generic frameworks. Keep state with its closest responsible owner, lifting shared state to a common parent. Do not mutate props or state. Keep side effects outside rendering and clean up Effects.

Do not use explicit `any` or non-null assertions. Use explicit types or `unknown` with narrowing. Oxlint enforces these restrictions and the Hooks rule. TypeScript checks complement linting.

## CSS and Formatting

Follow [MDN's CSS organization guidance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Organizing): use readable, consistent rules and low-specificity selectors scoped to the component root. Reserve global styles for document defaults and resets. Reuse CSS custom properties for shared colors and radii. Preserve responsive layouts, accessible labels, and visible keyboard focus.

Use local [Prettier](https://prettier.io/docs/install) for frontend source and configuration: two-space indentation, single quotes, and no semicolons. Run the formatting check alongside lint, types, and build.

## Python and Django

Apply the relevant application conventions from [Django 5.2 coding style](https://docs.djangoproject.com/en/5.2/internals/contributing/writing-code/coding-style/): PEP 8 naming, four-space indentation, and grouped standard-library, third-party, and local imports. Use Ruff for linting, import ordering, and formatting rather than Django core's Black/flake8 tooling; other core contribution rules are not blanket application requirements.

## Tests and Checks

Test observable behavior within agreed boundaries, especially persistence, ownership, validation, and failures. Keep behavioral inputs deterministic; generate valid synthetic credentials with standard-library helpers. Fixed invalid credentials are appropriate for failure tests. Add regression tests for fixes; do not mock away the behavior under test.

Use the checks in [README](README.md) and the [review workflow](docs/agents/workflow.md). Report unavailable checks and distinguish defects from optional suggestions.
