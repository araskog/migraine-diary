#!/bin/sh
set -eu
npm ci --prefix frontend
npm run build --prefix frontend
uv sync --project backend --locked --no-dev
backend/.venv/bin/python backend/manage.py collectstatic --noinput
