"""Settings for the serialized production migration job, never the web server."""

import os
import ssl

import dj_database_url
from django.core.exceptions import ImproperlyConfigured

from .settings import *  # noqa: F403

migration_url = os.environ.get("DATABASE_URL", "")
try:
    migration_database = dj_database_url.parse(migration_url)
except (ValueError, KeyError):
    raise ImproperlyConfigured(
        "A direct production DATABASE_URL is required."
    ) from None
if (
    migration_database.get("ENGINE") != "django.db.backends.postgresql"
    or "-pooler" in migration_database.get("HOST", "")
    or not all(
        migration_database.get(key) for key in ("NAME", "USER", "PASSWORD", "HOST")
    )
):
    raise ImproperlyConfigured("A complete direct PostgreSQL connection is required.")
migration_database.setdefault("OPTIONS", {}).update(
    sslmode="verify-full",
    sslrootcert=ssl.get_default_verify_paths().cafile or "system",
    connect_timeout=10,
)
DATABASES = {"default": migration_database}
