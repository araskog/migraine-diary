# Migraine Diary

Migraine Diary is a simple, mobile-friendly app for keeping track of migraine and migraine-free days. It helps users maintain a personal diary.

## Prerequisites

- Node.js 24 and npm
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (Python 3.13)
- PostgreSQL 17 running locally, with its command-line tools on your PATH

## Local setup

Create a dedicated database with your local PostgreSQL role:

```sh
createdb migraine_diary_dev
cd backend
cp .env.example .env
uv sync --locked
uv run --env-file .env python manage.py migrate
uv run --env-file .env python manage.py runserver 127.0.0.1:8000
```

Adjust PostgreSQL connection settings in `backend/.env` if needed; the role must be able to create a test database. Keep `.env` untracked. `DJANGO_DEBUG=1` enables local development static assets and error pages; it defaults to off when unset.

In another terminal, from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open [Migraine Diary](http://127.0.0.1:5173). For [Django admin](http://127.0.0.1:8000/admin/), create your own local administrator interactively from `backend/`:

```sh
uv run --env-file .env python manage.py createsuperuser
```

## Checks

From `frontend/`:

```sh
npm run format:check
npm run lint
npm test
npm run typecheck
npm run build
```

For browser regressions, start the frontend and open the
[popup checks](http://127.0.0.1:5173/static/app/tests/diary-interactions.html) or
[detail-autosave checks](http://127.0.0.1:5173/static/app/tests/diary-details.html).
These use synthetic API responses; backend persistence is checked below.

From `backend/`, with PostgreSQL running:

```sh
uv run ruff check .
uv run ruff format --check .
uv run --env-file .env python manage.py check
uv run --env-file .env python manage.py makemigrations --check --dry-run
uv run --env-file .env python manage.py migrate --noinput
uv run --env-file .env python manage.py test
```
