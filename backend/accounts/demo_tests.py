from datetime import date, datetime
from datetime import timezone as dt_timezone
from unittest.mock import patch

from django.test import Client, TestCase

from diary.models import DiaryEntry

from .models import User
from .test_helpers import generated_password


class DemoModeTests(TestCase):
    def setUp(self):
        self.password = generated_password()
        self.client = Client(enforce_csrf_checks=True)
        self.token = self.client.get("/api/session/").json()["csrfToken"]
        self.clock = patch(
            "accounts.views.timezone.now",
            return_value=datetime(2026, 3, 15, 12, 0, tzinfo=dt_timezone.utc),
        )
        self.clock.start()
        self.addCleanup(self.clock.stop)

    def post(self, path, data=None, token=None):
        return self.client.post(
            path,
            data or {},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token or self.token,
        )

    def start_demo(self, **extra):
        return self.post(
            "/api/demo/start/",
            {"timezone": "Europe/Stockholm", **extra},
        )

    def test_start_demo_creates_isolated_session_with_sample_entries(self):
        response = self.start_demo()
        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertTrue(body["user"]["isDemo"])
        self.assertTrue(body["user"]["email"].endswith("@demo.session.example.test"))
        self.assertGreater(DiaryEntry.objects.count(), 5)
        user = User.objects.get(pk=self.client.session["_auth_user_id"])
        self.assertTrue(user.is_demo)
        entries = list(
            DiaryEntry.objects.filter(user=user).values_list("date", "status")
        )
        self.assertIn((date(2026, 3, 14), DiaryEntry.Status.MIGRAINE), entries)

        other = Client(enforce_csrf_checks=True)
        other_token = other.get("/api/session/").json()["csrfToken"]
        other_response = other.post(
            "/api/demo/start/",
            {"timezone": "Europe/Stockholm"},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=other_token,
        )
        self.assertEqual(other_response.status_code, 201)
        self.assertEqual(User.objects.filter(is_demo=True).count(), 2)
        self.assertNotEqual(
            other_response.json()["user"]["email"], body["user"]["email"]
        )

    def test_demo_edits_persist_and_convert_keeps_entries(self):
        self.start_demo()
        self.token = self.client.get("/api/session/").json()["csrfToken"]
        response = self.client.post(
            "/api/diary/entries/",
            {
                "date": "2026-03-10",
                "status": "migraine_free",
                "timezone": "Europe/Stockholm",
            },
            content_type="application/json",
            HTTP_X_CSRFTOKEN=self.token,
        )
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(is_demo=True)
        count_before = DiaryEntry.objects.filter(user=user).count()

        convert = self.post(
            "/api/demo/convert/",
            {
                "email": "converted@example.test",
                "password": self.password,
                "health_consent": True,
                "privacy_policy_version": "2026-11-13",
            },
        )
        self.assertEqual(convert.status_code, 200)
        self.assertEqual(
            convert.json()["user"],
            {"email": "converted@example.test", "isDemo": False},
        )
        user.refresh_from_db()
        self.assertFalse(user.is_demo)
        self.assertEqual(user.email, "converted@example.test")
        self.assertEqual(DiaryEntry.objects.filter(user=user).count(), count_before)
        self.assertEqual(
            DiaryEntry.objects.get(user=user, date=date(2026, 3, 10)).status,
            DiaryEntry.Status.MIGRAINE_FREE,
        )

    def test_demo_sign_in_rejected(self):
        self.start_demo()
        demo_email = User.objects.get(is_demo=True).email
        self.client.post("/api/sign-out/", HTTP_X_CSRFTOKEN=self.token)
        self.token = self.client.get("/api/session/").json()["csrfToken"]
        response = self.post(
            "/api/sign-in/", {"email": demo_email, "password": "anything"}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Demo sessions", response.json()["detail"])

    def test_signed_in_user_cannot_start_demo(self):
        User.objects.create_user("member@example.test", self.password)
        self.post(
            "/api/sign-in/", {"email": "member@example.test", "password": self.password}
        )
        self.assertEqual(self.start_demo().status_code, 400)

    def test_convert_requires_active_demo_session(self):
        User.objects.create_user("member@example.test", self.password)
        response = self.post(
            "/api/sign-in/", {"email": "member@example.test", "password": self.password}
        )
        self.token = response.json()["csrfToken"]
        response = self.post(
            "/api/demo/convert/",
            {
                "email": "taken@example.test",
                "password": self.password,
                "health_consent": True,
                "privacy_policy_version": "2026-11-13",
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_demo_start_uses_client_timezone_for_sample_dates(self):
        response = self.post(
            "/api/demo/start/",
            {"timezone": "Pacific/Kiritimati"},
        )
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(is_demo=True)
        latest = max(
            DiaryEntry.objects.filter(user=user).values_list("date", flat=True)
        )
        self.assertEqual(latest, date(2026, 3, 15))
