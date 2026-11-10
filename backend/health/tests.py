from unittest.mock import patch

from django.db import OperationalError, connection
from django.test import TestCase


class HealthTests(TestCase):
    def test_health_checks_postgresql(self):
        self.assertEqual(connection.vendor, "postgresql")
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_database_failure_returns_generic_error(self):
        with patch(
            "health.views.connection.cursor",
            side_effect=OperationalError("private detail"),
        ):
            response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"status": "unavailable"})

    def test_health_is_read_only(self):
        self.assertEqual(self.client.post("/api/health/").status_code, 405)
