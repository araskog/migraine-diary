import os
import subprocess
import sys

from django.test import SimpleTestCase


class MigrationSettingsTests(SimpleTestCase):
    def settings_process(self, url):
        return subprocess.run(
            [
                sys.executable,
                "-c",
                "import config.migrations as s; "
                "assert s.DATABASES['default']['OPTIONS']['sslmode'] == 'verify-full'",
            ],
            env={**os.environ, "DATABASE_URL": url},
            capture_output=True,
            check=False,
        )

    def test_rejects_missing_invalid_and_pooled_connections(self):
        for url in [
            "",
            "sqlite:///local.db",
            "postgresql://example.test/db",
            "postgresql://synthetic:synthetic@example-pooler.test/db",
        ]:
            with self.subTest(url=url):
                self.assertNotEqual(self.settings_process(url).returncode, 0)

    def test_accepts_complete_direct_connection_with_verified_tls(self):
        result = self.settings_process(
            "postgresql://synthetic:synthetic@example.test/db"
        )
        self.assertEqual(result.returncode, 0, result.stderr)
