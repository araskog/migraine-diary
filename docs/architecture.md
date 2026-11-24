# Architecture

## Stack and Responsibilities

| Component | Technology and responsibility |
|---|---|
| `frontend/` | React, TypeScript, Vite, and Mantine: diary interaction, display, and user feedback. |
| `backend/` | Python, Django, and Django REST Framework: authentication, authorization, validation, API, and persistence. |
| Database | PostgreSQL: durable records associated with their owners. |
| `docs/` | Architecture, feature specifications, and agent workflow. |

`frontend/src/` contains the React application. `backend/config/` contains Django settings and routing; `backend/health/` contains the readiness API and tests. The foundation uses Node.js 24, Python 3.13, Django 5.2 LTS, and PostgreSQL 17. Dependency versions are locked in `frontend/package-lock.json` and `backend/uv.lock`. See [README](../README.md) for setup and verified commands.

The browser calls the backend API, never PostgreSQL directly. Client validation improves feedback; the backend enforces validation and ownership checks.

Local development uses an isolated Python environment managed by uv and local PostgreSQL. A Vite development proxy forwards `/api` to Django on loopback port 8000. `GET /api/health/` checks database readiness without exposing connection details. Accounts use a custom email user, Django password validators, database sessions, and explicit CSRF protection for anonymous account writes. Demo visitors start an isolated session with a sample diary; real accounts are created separately with an empty diary. See [demo mode](specs/demo-mode.md). DRF defaults to authenticated access; the health and account entry endpoints explicitly allow anonymous access.

## Interface Design

Use the approved clear, approachable direction: neutral surfaces and sage accents, with theme-appropriate contrast for primary actions and selected states. Keep typography simple, spacing generous, and forms uncluttered, with visible keyboard focus and a mobile-friendly layout.

For Mantine usage, theming, API clients, and related implementation rules, see [CODING_STANDARDS.md](../CODING_STANDARDS.md) (UI and Theming, Boundaries and Errors).

## Deployment

The React frontend runs on Cloudflare Pages, the Django API runs on Vercel, and Neon PostgreSQL stores accounts, sessions, and diary records. The browser calls `/api/*` on the frontend origin; a Pages Function forwards those requests to Vercel, preserving session cookies, request origins, and CSRF headers. API responses are not cached. The same function forwards `/admin/*` and `/static/admin/*` to the API for Django admin on the Pages origin.

Vercel uses API-only Django settings with explicit allowed hosts and trusted frontend origins. Application traffic uses Neon's pooled connection; migrations use a separate direct connection.

Production traffic uses [Migraine Diary](https://migraine-diary.pages.dev/) on Cloudflare Pages. The legacy Render monolith configuration is removed from the repository; delete any remaining Render service in the Render dashboard so traffic and builds do not drift.

On free tiers, Neon and Vercel scale down after idle time, so the first request after a quiet period can be noticeably slower. A scheduled [keep-alive workflow](../.github/workflows/keep-alive.yml) requests `GET /api/health/` every four minutes, which wakes the database and API without caching user responses.

## Later Direction

Keep diary capabilities API-first. The browser, a planned public MCP service, and the in-app assistant must use the same backend validation and ownership rules. The MCP service and in-app AI chat will share one set of tool definitions and execution handlers backed by diary operations. Strands Agents is a candidate for the agent runtime and MCP integration. See [AI Chat and MCP Diary Tools](specs/first-mcp-integration.md) for scope, authorization, and acceptance criteria.

Deterministic pattern insights ([pattern insights MVP](specs/pattern-insights-mvp.md)) follow extended diary fields and precede LLM narratives. AI summaries follow insights; reports follow summaries. No LLM framework is selected.

## References

- [React with a build tool](https://react.dev/learn/build-a-react-app-from-scratch)
- [Vite setup](https://vite.dev/guide/)
- [Django project structure](https://docs.djangoproject.com/en/5.2/intro/tutorial01/) (structural example, not a version pin)
- [Open Knowledge Format](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing): background reference for portable, linked documentation; no format adoption is planned.
