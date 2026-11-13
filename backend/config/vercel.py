"""API-only deployment on Vercel; frontend is served by Cloudflare Pages."""

import os

from .production import *  # noqa: F403

ROOT_URLCONF = "config.urls"
STATICFILES_DIRS = []
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]
# PgBouncer transaction pooling must not retain server-side cursors.
DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True  # noqa: F405
