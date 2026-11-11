"""Select with DJANGO_SETTINGS_MODULE=config.production."""

import os

from django.core.exceptions import ImproperlyConfigured

from .settings import *  # noqa: F403
from .settings import MIDDLEWARE

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
