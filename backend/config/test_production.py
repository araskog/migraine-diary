import importlib.util
import os
from pathlib import Path
from secrets import token_urlsafe
from unittest.mock import patch

from django.conf import settings
from django.core.checks import Tags, run_checks
from django.core.exceptions import ImproperlyConfigured
from django.http import HttpResponse
from django.middleware.csrf import get_token
from django.test import Client, SimpleTestCase, override_settings
from django.urls import path

from . import settings as base_settings


def sample_view(request):
    get_token(request)
    request.session["visited"] = True
    return HttpResponse("ok")


urlpatterns = [path("", sample_view)]


def load_production(**environment):
    spec = importlib.util.spec_from_file_location(
        "config.production", Path(__file__).with_name("production.py")
    )
    module = importlib.util.module_from_spec(spec)
    with patch.dict(os.environ, environment, clear=True):
        spec.loader.exec_module(module)
    return module


def production_overrides(production):
    return {
        name: value
        for name, value in vars(production).items()
        if name.isupper() and value != getattr(base_settings, name, None)
    }


class ProductionSettingsTests(SimpleTestCase):
    def setUp(self):
        self.environment = {
            "DJANGO_SECRET_KEY": token_urlsafe(64),
            "DJANGO_ALLOWED_HOSTS": "diary.example.test",
        }

    def test_missing_or_weak_secret_is_rejected(self):
        environment = self.environment.copy()
        environment.pop("DJANGO_SECRET_KEY")
        with self.assertRaises(ImproperlyConfigured):
            load_production(**environment)
        for secret in ("", "short", "x" * 60, "django-insecure-" + token_urlsafe(64)):
            with self.subTest(secret_length=len(secret)):
                with self.assertRaises(ImproperlyConfigured):
                    load_production(**{**self.environment, "DJANGO_SECRET_KEY": secret})

    def test_missing_or_wildcard_hosts_are_rejected(self):
        for hosts in ("", " , ", "*", ".example.test", "diary.example.test,*"):
            with self.subTest(hosts=hosts):
                with self.assertRaises(ImproperlyConfigured):
                    load_production(
                        **{**self.environment, "DJANGO_ALLOWED_HOSTS": hosts}
                    )

    def test_production_disables_debug_and_parses_explicit_hosts(self):
        production = load_production(
            **{
                **self.environment,
                "DJANGO_DEBUG": "1",
                "DJANGO_ALLOWED_HOSTS": "diary.example.test, other.example.test,",
            }
        )
        self.assertFalse(production.DEBUG)
        self.assertEqual(
            production.ALLOWED_HOSTS, ["diary.example.test", "other.example.test"]
        )

    def test_https_host_and_cookie_protection(self):
        production = load_production(**self.environment)
        values = production_overrides(production)
        values.update(
            ROOT_URLCONF=__name__,
            SESSION_ENGINE="django.contrib.sessions.backends.signed_cookies",
        )
        with override_settings(**values):
            client = Client()
            response = client.get("/", HTTP_HOST="diary.example.test")
            self.assertEqual(response.status_code, 301)
            self.assertEqual(response["Location"], "https://diary.example.test/")
            response = client.get("/", secure=True, HTTP_HOST="attacker.example.test")
            self.assertEqual(response.status_code, 400)
            response = client.get("/", secure=True, HTTP_HOST="diary.example.test")
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.cookies[settings.SESSION_COOKIE_NAME]["secure"])
            self.assertEqual(response["X-Frame-Options"], "DENY")
            self.assertIn("max-age=3600", response["Strict-Transport-Security"])
            self.assertTrue(response.cookies[settings.CSRF_COOKIE_NAME]["secure"])

    def test_deployment_checks_report_only_deferred_hsts_policies(self):
        production = load_production(**self.environment)
        values = production_overrides(production)
        with override_settings(**values):
            checks = run_checks(tags=[Tags.security], include_deployment_checks=True)
            self.assertEqual(
                {check.id for check in checks}, {"security.W005", "security.W021"}
            )
