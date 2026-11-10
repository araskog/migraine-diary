# Migraine Diary

Migraine Diary is a simple, mobile-friendly app for keeping track of migraine and migraine-free days. It helps users maintain a personal diary.

Local React/TypeScript/Vite and Django REST Framework/PostgreSQL foundation. Email/password registration, sign-in, sign-out, and a protected diary placeholder are implemented. Password recovery and diary recording are not implemented yet. Use synthetic data only.

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
uv run --env-file .env python manage.py runserver 127.0.0.1:8000 --insecure
```

If PostgreSQL requires credentials, set `PGUSER` and `PGPASSWORD` in `backend/.env`. Set `PGHOST`, `PGPORT`, or `PGDATABASE` there when using a different local connection. The database role needs permission to create a separate test database for `manage.py test`. Never commit `.env`.

In another terminal, from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Vite proxies `/api` to Django on port 8000 while preserving the browser Host header, so Django compares CSRF Origin against the frontend origin. Keep `changeOrigin: false` when overriding local ports. Both development servers bind to the loopback interface. Create a synthetic account or sign in to open the protected Your diary placeholder. Reloading restores the server session; signing out revokes it. Connection and form failures provide retry feedback. `GET /api/health/` returns `200 {"status":"ok"}` after a PostgreSQL query, or `503 {"status":"unavailable"}` if the database is unavailable. Unsupported write methods receive 405; DRF also permits `OPTIONS` for endpoint metadata. No account or diary data is exposed.

These are local development settings, including a public development-only secret key. Deployment configuration will be addressed in a later increment. Vite preview serves the built frontend only; the API proxy is for development.

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

The API tests exercise registration validation, case-insensitive email uniqueness, password hashing, sign-in/out, session persistence and revocation, anonymous and authenticated CSRF protection, the real PostgreSQL connection, generic database failure responses, and method rejection. CI runs the same baseline checks using a PostgreSQL 17 service. Browser interaction checks remain manual.

## Guidance checked

The foundation follows [Vite setup](https://vite.dev/guide/), [Django 5.2 installation compatibility](https://docs.djangoproject.com/en/5.2/faq/install/), [DRF requirements](https://www.django-rest-framework.org/), and [uv project and lockfile guidance](https://docs.astral.sh/uv/guides/projects/). Django 5.2 LTS with Python 3.13 keeps the backend on supported versions. No deliberate departures from this guidance.

## Account API

Django database sessions use an HttpOnly, SameSite=Lax cookie; no authentication tokens are stored in browser storage. Local HTTP settings are for loopback development only. New API endpoints require authentication by default; health and account entry endpoints explicitly allow anonymous access.

- `GET /api/session/`: `{ "user": null | { "email": "…" }, "csrfToken": "…" }`. Call before posting and use the returned token as `X-CSRFToken` with same-origin cookies.
- `POST /api/register/`: JSON email/password; 201 with session shape, signs in on success. Emails are trimmed and lowercased; uniqueness is also enforced case-insensitively by PostgreSQL. Django's four standard password validators apply (email similarity, minimum 8 characters, common passwords, numeric passwords).
- `POST /api/sign-in/`: JSON email/password; 200 with session shape. Invalid credentials return a generic 400 error.
- `POST /api/sign-out/`: requires authentication and CSRF; 200 with anonymous session shape. Session keys are invalidated on the server.
- `GET /api/diary/`: authenticated placeholder `{ "title": "Your diary", "recordingAvailable": false }`; anonymous requests return 403. No diary records exist yet.

Registration validation uses 400 field-name arrays; other errors use `detail`. All account responses disable caching. Successful sign-in/registration rotates the CSRF token, so use the newly returned value. Explicit CSRF protection covers anonymous registration and sign-in as well as sign-out.

Manual browser checks: at mobile width, create a synthetic account, check weak-password and duplicate-email feedback, reload the diary, sign out, reload, check invalid credentials, and sign back in. Stop the backend and verify connection errors and retry. Password recovery is the next account increment.

The [Vite proxy options](https://vite.dev/config/server-options#server-proxy) and installed Vite implementation were checked: the string shorthand changes Host, so the explicit proxy configuration preserves it for Django CSRF checks.

Account implementation follows [Django custom users](https://docs.djangoproject.com/en/5.2/topics/auth/customizing/), [Django password validation](https://docs.djangoproject.com/en/5.2/topics/auth/passwords/), [Django CSRF](https://docs.djangoproject.com/en/5.2/howto/csrf/), [Django login/logout](https://docs.djangoproject.com/en/5.2/topics/auth/default/), [Django sessions](https://docs.djangoproject.com/en/5.2/topics/http/sessions/), and [DRF session authentication](https://www.django-rest-framework.org/api-guide/authentication/#sessionauthentication). In particular, explicit CSRF enforcement handles anonymous login, where DRF session authentication alone does not enforce it. No deliberate departures.

## Local user administration

Open [Django admin](http://127.0.0.1:8000/admin/) to inspect synthetic users, search by email, and add or edit accounts. Django's built-in appearance toggle offers light/dark/system modes. Only staff with the required permissions can use administration; a local superuser can manage all users.

Create your own local administrator interactively, from `backend/`:

```sh
uv run --env-file .env python manage.py createsuperuser
```

Choose a synthetic email and your own password at the prompts. No administrator credentials are provided or stored in the repository. Sign in at the admin link with that email and password. The custom user forms hash passwords and enforce Django password validation when adding users.

The documented local `runserver --insecure` command serves the built-in admin CSS/JavaScript with this project's `DEBUG=False` setting. This option is strictly for loopback local development, not deployment. See [Django admin requirements](https://docs.djangoproject.com/en/5.2/ref/contrib/admin/) and [custom user admin forms](https://docs.djangoproject.com/en/5.2/topics/auth/customizing/#custom-users-and-django-contrib-admin).
