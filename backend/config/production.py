"""Select with DJANGO_SETTINGS_MODULE=config.production."""

import os
import ssl
from pathlib import Path

import dj_database_url
from django.core.exceptions import ImproperlyConfigured

from .settings import *  # noqa: F403
from .settings import MIDDLEWARE, TEMPLATES

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")
if (
    len(SECRET_KEY) < 50
    or len(set(SECRET_KEY)) < 5
    or SECRET_KEY.startswith("django-insecure-")
):
    raise ImproperlyConfigured("Set DJANGO_SECRET_KEY to a strong random secret.")

ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",")
    if host.strip()
]
if not ALLOWED_HOSTS or any(
    "*" in host or host.startswith(".") for host in ALLOWED_HOSTS
):
    raise ImproperlyConfigured("Set DJANGO_ALLOWED_HOSTS to explicit hostnames.")

DEBUG = False
MIDDLEWARE = [*MIDDLEWARE, "django.middleware.clickjacking.XFrameOptionsMiddleware"]
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 3600
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

DATABASE_URL = os.environ.get("DATABASE_URL", "")
try:
    database = dj_database_url.parse(DATABASE_URL)
except (ValueError, KeyError):
    raise ImproperlyConfigured(
        "Set DATABASE_URL to a valid PostgreSQL connection URL."
    ) from None
if database.get("ENGINE") != "django.db.backends.postgresql" or not all(
    database.get(key) for key in ("NAME", "USER", "PASSWORD", "HOST")
):
    raise ImproperlyConfigured(
        "Set DATABASE_URL to a complete PostgreSQL connection URL."
    )
database.setdefault("OPTIONS", {}).update(
    sslmode="verify-full",
    sslrootcert=ssl.get_default_verify_paths().cafile or "system",
    connect_timeout=10,
)
DATABASES = {"default": database}

SECURE_REDIRECT_EXEMPT = [r"^api/health/$"]
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
ROOT_URLCONF = "config.production_urls"
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR.parent / "frontend" / "dist"
TEMPLATES = [{**template, "DIRS": [FRONTEND_DIR]} for template in TEMPLATES]
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [("app", FRONTEND_DIR)]
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"
    },
}
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
