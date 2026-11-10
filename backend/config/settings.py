"""Local development settings. Deployment is outside this foundation."""

import os

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY", "local-development-only-not-for-deployment"
)
DEBUG = False
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]"]
INSTALLED_APPS = ["django.contrib.contenttypes", "rest_framework", "health"]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
]
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("PGDATABASE", "migraine_diary_dev"),
        "USER": os.environ.get("PGUSER", ""),
        "PASSWORD": os.environ.get("PGPASSWORD", ""),
        "HOST": os.environ.get("PGHOST", "localhost"),
        "PORT": os.environ.get("PGPORT", "5432"),
    }
}
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "UNAUTHENTICATED_USER": None,
}
USE_TZ = True
