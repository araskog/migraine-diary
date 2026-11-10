# Architecture

## Stack and Responsibilities

| Component | Planned technology and responsibility |
|---|---|
| `frontend/` | React, TypeScript, and Vite: diary interaction, display, and user feedback. |
| `backend/` | Python, Django, and Django REST Framework: authentication, authorization, validation, API, and persistence. |
| Database | PostgreSQL: durable records associated with their owners. |
| `docs/` | Architecture, feature specifications, and agent workflow. |

Application directories do not exist yet. Establish their internal structure, supported versions, and verified commands during foundation setup.

The browser calls the backend API, never PostgreSQL directly. Client validation improves feedback; the backend enforces validation and ownership checks.

Local development uses an isolated Python environment managed by uv and local PostgreSQL. A Vite development proxy to Django is proposed. Choose authentication configuration and define the API contract when implementing the relevant feature.

## Later Direction

AI summaries follow the usable diary; reports follow summaries. No LLM framework is selected. Render with Neon PostgreSQL is a hosting proposal, not an implemented deployment.

## References

- [React with a build tool](https://react.dev/learn/build-a-react-app-from-scratch)
- [Vite setup](https://vite.dev/guide/)
- [Django project structure](https://docs.djangoproject.com/en/5.2/intro/tutorial01/) (structural example, not a version pin)
- [Open Knowledge Format](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing): background reference for portable, linked documentation; no format adoption is planned.
