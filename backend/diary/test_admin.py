from datetime import date

from django.test import TestCase
from django.urls import reverse

from accounts.models import User
from accounts.test_helpers import generated_password

from .models import DiaryEntry


class DiaryEntryAdminTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_superuser(
            "owner@example.test", generated_password()
        )
        cls.member = User.objects.create_user(
            "member@example.test", generated_password()
        )
        cls.entry = DiaryEntry.objects.create(
            user=cls.member, date="2026-01-01", status="migraine"
        )

    def test_owner_can_inspect_and_search_entries(self):
        self.client.force_login(self.owner)
        response = self.client.get(
            reverse("admin:diary_diaryentry_changelist"), {"q": "member@"}
        )
        self.assertContains(response, "member@example.test")
        self.assertEqual(list(response.context["cl"].queryset), [self.entry])
        response = self.client.get(
            reverse("admin:diary_diaryentry_change", args=[self.entry.pk])
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Migraine day")
        self.assertNotContains(response, 'name="_save"')

    def test_anonymous_and_nonstaff_cannot_inspect_entries(self):
        urls = [
            reverse("admin:diary_diaryentry_changelist"),
            reverse("admin:diary_diaryentry_change", args=[self.entry.pk]),
        ]
        for user in [None, self.member]:
            if user is not None:
                self.client.force_login(user)
            for url in urls:
                with self.subTest(user=user, url=url):
                    response = self.client.get(url)
                    self.assertEqual(response.status_code, 302)
                    self.assertTrue(response.url.startswith("/admin/login/"))

    def test_even_owner_cannot_add_change_or_delete_entries(self):
        self.client.force_login(self.owner)
        urls = [
            reverse("admin:diary_diaryentry_add"),
            reverse("admin:diary_diaryentry_change", args=[self.entry.pk]),
            reverse("admin:diary_diaryentry_delete", args=[self.entry.pk]),
        ]
        for url in urls:
            with self.subTest(url=url):
                response = self.client.post(
                    url,
                    {
                        "user": self.owner.pk,
                        "date": "2099-01-01",
                        "status": "migraine_free",
                        "post": "yes",
                    },
                )
                self.assertEqual(response.status_code, 403)
        self.entry.refresh_from_db()
        self.assertEqual(DiaryEntry.objects.count(), 1)
        self.assertEqual(self.entry.user, self.member)
        self.assertEqual(self.entry.date, date(2026, 1, 1))
        self.assertEqual(self.entry.status, "migraine")
