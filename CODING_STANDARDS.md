# Coding Standards

## Boundaries and Data

- Use TypeScript for frontend application code and Python for Django code.
- Enforce authorization and authoritative validation on the backend. Derive record ownership from the authenticated user, never a client-supplied owner identifier.
- Treat diary dates as calendar dates, not timestamps. Follow the agreed specification for allowed dates and timezone behavior.
- Use the [glossary](GLOSSARY.md) consistently. Missing entries do not establish migraine-free days.
- Keep privileged credentials on the server and outside version control.

## Code and Errors

- Do not use TypeScript `any` or non-null assertions such as `value!`. Use explicit types or `unknown`, and narrow values with checks before use. Ordinary logical negation (`!condition`) is allowed.
- Prefer focused changes and existing framework capabilities. Add abstractions for current needs.
- Define API contracts explicitly and validate external input at the boundary.
- Return useful errors without exposing secrets or internal details. Do not swallow failures or show a successful save before it succeeds; support retrying failed actions.

## Tests and Tooling

Within the agreed feature test boundaries, test observable behavior rather than internal wiring. Prioritize persistence, date validation, user isolation, and failure handling. Use deterministic synthetic data and expected results derived from requirements. Add regression tests for bug fixes where appropriate. Do not mock away the behavior under test.

When using TDD, work in small slices: failing behavior test, implementation, then verification.

Select formatting, linting, type-checking, and test tools during foundation setup; automate mechanical checks in CI and document verified commands. No such tooling exists yet.

Reviewers distinguish rule violations from optional design suggestions and explain their impact. Follow the [workflow](docs/agents/workflow.md).

Testing guidance adapts [Matt Pocock's TDD principles](https://github.com/mattpocock/skills/blob/main/skills/engineering/tdd/SKILL.md).
