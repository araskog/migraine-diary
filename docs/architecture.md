# Architecture

## Stack and Responsibilities

| Component | Technology and responsibility |
|---|---|
| `frontend/` | React, TypeScript, and Vite: diary interaction, display, and user feedback. |
| `backend/` | Python, Django, and Django REST Framework: authentication, authorization, validation, API, and persistence. |
| Database | PostgreSQL: durable records associated with their owners. |
| `docs/` | Architecture, feature specifications, and agent workflow. |

`frontend/src/` contains the React application. `backend/config/` contains Django settings and routing; `backend/health/` contains the readiness API and tests. The foundation uses Node.js 24, Python 3.13, Django 5.2 LTS, and PostgreSQL 17. Dependency versions are locked in `frontend/package-lock.json` and `backend/uv.lock`. See [README](../README.md) for setup and verified commands.

The browser calls the backend API, never PostgreSQL directly. Client validation improves feedback; the backend enforces validation and ownership checks.

Local development uses an isolated Python environment managed by uv and local PostgreSQL. A Vite development proxy forwards `/api` to Django on loopback port 8000. `GET /api/health/` checks database readiness without exposing connection details. Choose authentication configuration and define the API contract when implementing the relevant feature.

## Later Direction

AI summaries follow the usable diary; reports follow summaries. No LLM framework is selected. Render with Neon PostgreSQL is a hosting proposal, not an implemented deployment.

## References

- [React with a build tool](https://react.dev/learn/build-a-react-app-from-scratch)
- [Vite setup](https://vite.dev/guide/)
- [Django project structure](https://docs.djangoproject.com/en/5.2/intro/tutorial01/) (structural example, not a version pin)
- [Open Knowledge Format](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing): background reference for portable, linked documentation; no format adoption is planned.
