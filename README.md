# Migraine Diary

Mobile-friendly app for tracking migraine and migraine-free days.

## Prerequisites

- Node.js 24 and npm
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (Python 3.13)
- PostgreSQL 17 on your PATH (`createdb`, `psql`, etc.)

## Local setup

```sh
createdb migraine_diary_dev
cd backend && cp .env.example .env
uv sync --locked
uv run --env-file .env python manage.py migrate
uv run --env-file .env python manage.py runserver 127.0.0.1:8000
```

In another terminal:

```sh
cd frontend && npm ci && npm run dev
```

Open [the app](http://127.0.0.1:5173/static/app/). Adjust `backend/.env` if PostgreSQL connection settings differ from the example.

## Checks

`frontend/`:

```sh
npm run format:check && npm run lint && npm test && npm run typecheck && npm run build
```

`backend/` (PostgreSQL running):

```sh
uv run ruff check . && uv run ruff format --check .
uv run --env-file .env python manage.py check
uv run --env-file .env python manage.py makemigrations --check --dry-run
uv run --env-file .env python manage.py migrate --noinput
uv run --env-file .env python manage.py test
```

## Agents

See [AGENTS.md](AGENTS.md) for workflow, checks, and skill install.