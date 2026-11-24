from datetime import date, datetime, timedelta
from datetime import timezone as dt_timezone
from unittest.mock import patch

from django.test import Client, TestCase

from accounts.models import User
from accounts.test_helpers import generated_password

from .insights import compute_insights
from .models import DiaryEntry


class InsightsComputationTests(TestCase):
    def test_empty_diary_is_insufficient(self):
        today = date(2026, 1, 15)
        body = compute_insights([], today)
        self.assertTrue(body["summary"]["insufficient_data"])
        self.assertEqual(body["summary"]["recorded_days"], 0)
        self.assertIsNone(body["summary"]["migraine_rate"])

    def test_window_excludes_out_of_range_entries(self):
        today = date(2026, 1, 15)
        entries = [
            DiaryEntry(date=today, status=DiaryEntry.Status.MIGRAINE),
            DiaryEntry(
                date=today - timedelta(days=89),
                status=DiaryEntry.Status.MIGRAINE_FREE,
            ),
            DiaryEntry(
                date=today - timedelta(days=90),
                status=DiaryEntry.Status.MIGRAINE,
            ),
        ]
        body = compute_insights(entries, today)
        self.assertEqual(body["summary"]["recorded_days"], 2)
        self.assertEqual(body["summary"]["migraine_days"], 1)

    def test_sleep_duration_slice_requires_minimum_days(self):
        today = date(2026, 1, 15)
        entries = [
            DiaryEntry(
                date=today - timedelta(days=offset),
                status=DiaryEntry.Status.MIGRAINE
                if offset % 2 == 0
                else DiaryEntry.Status.MIGRAINE_FREE,
                sleep_duration=DiaryEntry.SleepDuration.LESS,
            )
            for offset in range(12)
        ]
        body = compute_insights(entries, today)
        self.assertFalse(body["summary"]["insufficient_data"])
        less = next(item for item in body["sleep_duration"] if item["value"] == "less")
        self.assertEqual(less["recorded_days"], 12)
        self.assertTrue(less["sufficient_data"])
        usual = next(
            item for item in body["sleep_duration"] if item["value"] == "usual"
        )
        self.assertFalse(usual["sufficient_data"])


class InsightsApiTests(TestCase):
    path = "/api/diary/insights/"

    def setUp(self):
        self.password = generated_password()
        self.user = User.objects.create_user("insights@example.test", self.password)
        self.other = User.objects.create_user(
            "other-insights@example.test", generated_password()
        )
        self.client = Client(enforce_csrf_checks=True)
        self.clock = patch(
            "diary.views.timezone.now",
            return_value=datetime(2026, 1, 15, 12, 0, tzinfo=dt_timezone.utc),
        )
        self.clock.start()
        self.addCleanup(self.clock.stop)
        token = self.client.get("/api/session/").json()["csrfToken"]
        response = self.client.post(
            "/api/sign-in/",
            {"email": self.user.email, "password": self.password},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, 200)
        self.token = response.json()["csrfToken"]

    def seed_window(self):
        for offset in range(12):
            DiaryEntry.objects.create(
                user=self.user,
                date=date(2026, 1, 15) - timedelta(days=offset),
                status=(
                    DiaryEntry.Status.MIGRAINE
                    if offset % 3 == 0
                    else DiaryEntry.Status.MIGRAINE_FREE
                ),
                sleep_duration=(
                    DiaryEntry.SleepDuration.LESS
                    if offset % 2 == 0
                    else DiaryEntry.SleepDuration.USUAL
                ),
                sleep=DiaryEntry.Sleep.POOR
                if offset % 4 == 0
                else DiaryEntry.Sleep.GOOD,
                medication_taken=offset % 5 == 0,
                pain_severity=6 if offset % 3 == 0 else None,
            )

    def test_unauthenticated_request_is_rejected(self):
        self.client = Client(enforce_csrf_checks=True)
        response = self.client.get(self.path, {"timezone": "UTC"})
        self.assertEqual(response.status_code, 403)

    def test_insights_are_scoped_to_signed_in_user(self):
        DiaryEntry.objects.create(
            user=self.other,
            date="2026-01-10",
            status=DiaryEntry.Status.MIGRAINE,
        )
        self.seed_window()
        response = self.client.get(self.path, {"timezone": "UTC"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["summary"]["recorded_days"], 12)
        self.assertIn("no-store", response["Cache-Control"])

    def test_invalid_timezone_is_rejected(self):
        response = self.client.get(self.path, {"timezone": "Not/AZone"})
        self.assertEqual(response.status_code, 400)

    def test_response_includes_weekday_and_pain_slices(self):
        self.seed_window()
        monday = date(2026, 1, 12)
        self.assertEqual(monday.weekday(), 0)
        DiaryEntry.objects.filter(user=self.user, date=monday).update(
            sleep_duration=DiaryEntry.SleepDuration.MORE,
            sleep=DiaryEntry.Sleep.POOR,
            medication_taken=True,
            pain_severity=8,
        )
        response = self.client.get(self.path, {"timezone": "UTC"})
        body = response.json()
        monday_slice = next(item for item in body["weekdays"] if item["weekday"] == 0)
        self.assertGreaterEqual(monday_slice["recorded_days"], 1)
        pain_slice = next(
            item for item in body["pain_by_sleep_quality"] if item["value"] == "poor"
        )
        self.assertIsNotNone(pain_slice["average_pain_severity"])
