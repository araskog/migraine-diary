from datetime import date, datetime, timezone
from unittest.mock import patch

from django.db import IntegrityError, transaction
from django.test import Client, TestCase

from accounts.models import User
from accounts.test_helpers import generated_password

from .models import DiaryEntry


class DiaryEntryTests(TestCase):
    path = "/api/diary/entries/"

    def setUp(self):
        self.password = generated_password()
        self.user = User.objects.create_user("diary@example.test", self.password)
        self.other = User.objects.create_user(
            "other@example.test", generated_password()
        )
        self.client = Client(enforce_csrf_checks=True)
        self.sign_in()
        self.clock = patch(
            "diary.serializers.timezone.now",
            return_value=datetime(2026, 1, 2, 0, 30, tzinfo=timezone.utc),
        )
        self.clock.start()
        self.addCleanup(self.clock.stop)

    def sign_in(self):
        token = self.client.get("/api/session/").json()["csrfToken"]
        response = self.client.post(
            "/api/sign-in/",
            {"email": self.user.email, "password": self.password},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, 200)
        self.token = response.json()["csrfToken"]

    def save(self, **overrides):
        data = {
            "date": "2026-01-01",
            "status": "migraine",
            "timezone": "Europe/Stockholm",
        }
        data.update(overrides)
        return self.client.post(
            self.path,
            data,
            content_type="application/json",
            HTTP_X_CSRFTOKEN=self.token,
        )

    def test_save_correct_and_reopen_persistent_diary(self):
        self.assertEqual(self.client.get(self.path).json(), [])
        response = self.save()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), {"date": "2026-01-01", "status": "migraine"})
        self.assertEqual(self.save(status="migraine_free").status_code, 200)
        entry = DiaryEntry.objects.get(user=self.user)
        self.assertEqual(entry.date, date(2026, 1, 1))
        self.assertEqual(entry.status, "migraine_free")
        self.assertEqual(self.save(date="2025-12-31").status_code, 201)
        response = self.client.post("/api/sign-out/", HTTP_X_CSRFTOKEN=self.token)
        self.assertEqual(response.status_code, 200)
        self.client = Client(enforce_csrf_checks=True)
        self.sign_in()
        response = self.client.get(self.path)
        self.assertEqual(
            response.json(),
            [
                {"date": "2026-01-01", "status": "migraine_free"},
                {"date": "2025-12-31", "status": "migraine"},
            ],
        )
        self.assertIn("no-store", response["Cache-Control"])
        self.assertIn("private", response["Cache-Control"])

    def test_users_cannot_list_or_overwrite_another_users_entries(self):
        other_entry = DiaryEntry.objects.create(
            user=self.other, date="2026-01-01", status="migraine_free"
        )
        self.assertEqual(self.client.get(self.path).json(), [])
        response = self.save(user=self.other.pk, user_id=self.other.pk)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(DiaryEntry.objects.get(user=self.user).status, "migraine")
        other_entry.refresh_from_db()
        self.assertEqual(other_entry.status, "migraine_free")
        self.assertEqual(
            self.client.get(self.path).json(),
            [{"date": "2026-01-01", "status": "migraine"}],
        )

    def test_invalid_input_does_not_create_or_overwrite(self):
        self.save()
        invalid = [
            {"date": "2026-02-30"},
            {"date": "not-a-date"},
            {"date": "2026-01-03", "today": "2099-01-01"},
            {"date": None},
            {"status": "unknown"},
            {"status": None},
            {"timezone": "Invalid/Zone"},
            {"timezone": "../UTC"},
            {"timezone": ""},
            {"timezone": None},
        ]
        for overrides in invalid:
            with self.subTest(overrides=overrides):
                response = self.save(**overrides)
                self.assertEqual(response.status_code, 400)
                self.assertIn("no-store", response["Cache-Control"])
                self.assertEqual(DiaryEntry.objects.count(), 1)
                self.assertEqual(DiaryEntry.objects.get().status, "migraine")
        for missing in ["date", "status", "timezone"]:
            data = {"date": "2026-01-01", "status": "migraine_free", "timezone": "UTC"}
            del data[missing]
            response = self.client.post(
                self.path,
                data,
                content_type="application/json",
                HTTP_X_CSRFTOKEN=self.token,
            )
            self.assertEqual(response.status_code, 400)
        self.assertEqual(DiaryEntry.objects.get().status, "migraine")

    def test_today_uses_supplied_timezone_and_stored_dates_do_not_shift(self):
        self.assertEqual(
            self.save(date="2026-01-02", timezone="America/Los_Angeles").status_code,
            400,
        )
        with patch(
            "diary.serializers.timezone.now",
            return_value=datetime(2026, 1, 1, 23, 30, tzinfo=timezone.utc),
        ):
            self.assertEqual(
                self.save(date="2026-01-02", timezone="Pacific/Kiritimati").status_code,
                201,
            )
        self.assertEqual(self.save(timezone="America/Los_Angeles").status_code, 201)
        self.assertEqual(
            self.client.get(self.path).json(),
            [
                {"date": "2026-01-02", "status": "migraine"},
                {"date": "2026-01-01", "status": "migraine"},
            ],
        )

    def test_anonymous_and_signed_out_sessions_cannot_access_entries(self):
        anonymous = Client(enforce_csrf_checks=True)
        for method in [anonymous.get, anonymous.post]:
            response = method(self.path)
            self.assertEqual(response.status_code, 403)
            self.assertIn("no-store", response["Cache-Control"])
        old_session = Client(enforce_csrf_checks=True)
        old_session.cookies = self.client.cookies.copy()
        self.client.post("/api/sign-out/", HTTP_X_CSRFTOKEN=self.token)
        self.assertEqual(old_session.get(self.path).status_code, 403)
        self.assertEqual(self.save().status_code, 403)
        self.assertFalse(DiaryEntry.objects.exists())

    def test_authenticated_writes_require_csrf_and_reject_cross_origin(self):
        data = {"date": "2026-01-01", "status": "migraine", "timezone": "UTC"}
        for headers in [
            {},
            {"HTTP_X_CSRFTOKEN": "x" * 64},
            {
                "HTTP_X_CSRFTOKEN": self.token,
                "HTTP_ORIGIN": "https://untrusted.example",
            },
        ]:
            with self.subTest(headers=headers):
                response = self.client.post(
                    self.path, data, content_type="application/json", **headers
                )
                self.assertEqual(response.status_code, 403)
        self.assertFalse(DiaryEntry.objects.exists())
        self.assertEqual(self.save().status_code, 201)
        self.assertEqual(
            self.client.delete(self.path, HTTP_X_CSRFTOKEN=self.token).status_code, 405
        )

    def test_database_enforces_one_status_per_user_date_and_valid_status(self):
        DiaryEntry.objects.create(user=self.user, date="2026-01-01", status="migraine")
        for values in [
            {"date": "2026-01-01", "status": "migraine_free"},
            {"date": "2025-12-31", "status": "unknown"},
        ]:
            with self.subTest(values=values):
                with self.assertRaises(IntegrityError), transaction.atomic():
                    DiaryEntry.objects.create(user=self.user, **values)
        self.assertEqual(DiaryEntry.objects.count(), 1)
        DiaryEntry.objects.create(user=self.other, date="2026-01-01", status="migraine")
        self.assertEqual(DiaryEntry.objects.count(), 2)
