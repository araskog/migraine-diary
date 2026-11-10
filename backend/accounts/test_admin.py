from django.test import TestCase
from django.urls import reverse

from .models import User


class AccountAdminTests(TestCase):
    password = "Synthetic!River82-Paper"

    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_superuser("owner@example.test", cls.password)
        cls.member = User.objects.create_user("member@example.test", cls.password)

    def test_anonymous_and_nonstaff_cannot_manage_users(self):
        url = reverse("admin:accounts_user_changelist")
        self.assertRedirects(self.client.get(url), f"/admin/login/?next={url}")
        self.client.force_login(self.member)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.url.startswith("/admin/login/"))

    def test_owner_can_search_and_change_user_email(self):
        self.client.force_login(self.owner)
        response = self.client.get(
            reverse("admin:accounts_user_changelist"), {"q": "member@"}
        )
        self.assertContains(response, "member@example.test")
        self.assertContains(response, "theme-toggle")
        url = reverse("admin:accounts_user_change", args=[self.member.pk])
        self.assertEqual(self.client.get(url).status_code, 200)
        old_password = self.member.password
        response = self.client.post(
            url, {"email": "JANE@example.test", "is_active": "on", "_save": "Save"}
        )
        self.assertEqual(response.status_code, 302)
        self.member.refresh_from_db()
        self.assertEqual(self.member.email, "jane@example.test")
        self.assertEqual(self.member.password, old_password)
        self.assertFalse(self.member.is_staff)

    def test_owner_can_create_user_with_validated_hashed_password(self):
        self.client.force_login(self.owner)
        url = reverse("admin:accounts_user_add")
        self.assertEqual(self.client.get(url).status_code, 200)
        response = self.client.post(
            url,
            {
                "email": "Added@example.test",
                "password1": self.password,
                "password2": self.password,
                "_save": "Save",
            },
        )
        self.assertEqual(response.status_code, 302)
        added = User.objects.get(email="added@example.test")
        self.assertTrue(added.check_password(self.password))
        self.assertNotEqual(added.password, self.password)
        self.assertFalse(added.is_staff)
        self.assertFalse(added.is_superuser)
        response = self.client.post(
            url,
            {
                "email": "weak@example.test",
                "password1": "password",
                "password2": "password",
                "_save": "Save",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "too common")
        self.assertFalse(User.objects.filter(email="weak@example.test").exists())

    def test_admin_duplicate_email_validation_is_case_insensitive(self):
        self.client.force_login(self.owner)
        response = self.client.post(
            reverse("admin:accounts_user_add"),
            {
                "email": "MEMBER@example.test",
                "password1": self.password,
                "password2": self.password,
                "_save": "Save",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "An account with this email already exists.")
        url = reverse("admin:accounts_user_change", args=[self.member.pk])
        response = self.client.post(
            url, {"email": "OWNER@example.test", "is_active": "on", "_save": "Save"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "An account with this email already exists.")
        self.member.refresh_from_db()
        self.assertEqual(self.member.email, "member@example.test")

    def test_admin_sign_in_accepts_case_insensitive_email(self):
        response = self.client.post(
            reverse("admin:login"),
            {
                "username": "OWNER@EXAMPLE.TEST",
                "password": self.password,
                "next": "/admin/",
            },
        )
        self.assertRedirects(response, "/admin/")
