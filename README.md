# Migraine Diary

Local React/TypeScript/Vite and Django REST Framework/PostgreSQL foundation. Accounts and diary recording are not implemented yet. Use synthetic data only.

## Prerequisites

- Node.js 24 and npm
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (provisions Python 3.13)
- A running PostgreSQL 17 server and its command-line tools on your PATH

## Local setup

Create a dedicated database using your local PostgreSQL role:

```sh
createdb migraine_diary_dev
cd backend
cp .env.example .env
uv sync --locked
uv run --env-file .env python manage.py migrate
uv run --env-file .env python manage.py runserver 127.0.0.1:8000
```

If PostgreSQL requires credentials, set `PGUSER` and `PGPASSWORD` in `backend/.env`. Set `PGHOST`, `PGPORT`, or `PGDATABASE` there when using a different local connection. The database role needs permission to create a separate test database for `manage.py test`. Never commit `.env`.

In another terminal, from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Vite proxies `/api` to Django on port 8000. Both development servers bind to the loopback interface. The page reports the service/database connection and provides a retry button. `GET /api/health/` returns `200 {"status":"ok"}` after a PostgreSQL query, or `503 {"status":"unavailable"}` if the database is unavailable. Other methods receive 405. No account or diary data is exposed.

These are local development settings, including a public development-only secret key. Deployment configuration and authentication will be addressed in later increments. Vite preview serves the built frontend only; the API proxy is for development.

## Verified checks

From `frontend/`:

```sh
npm run lint
npm run typecheck
npm run build
```

From `backend/`, with PostgreSQL running and local settings configured:

```sh
uv run ruff check .
uv run ruff format --check .
uv run --env-file .env python manage.py check
uv run --env-file .env python manage.py makemigrations --check --dry-run
uv run --env-file .env python manage.py migrate --noinput
uv run --env-file .env python manage.py test
```

The API tests exercise the real PostgreSQL connection, a generic database failure response, and method rejection. CI runs the same baseline checks using a PostgreSQL 17 service. Browser interaction checks remain manual.

## Guidance checked

The foundation follows [Vite setup](https://vite.dev/guide/), [Django 5.2 installation compatibility](https://docs.djangoproject.com/en/5.2/faq/install/), [DRF requirements](https://www.django-rest-framework.org/), and [uv project and lockfile guidance](https://docs.astral.sh/uv/guides/projects/). Django 5.2 LTS with Python 3.13 keeps the backend on supported versions. No deliberate departures from this guidance.
