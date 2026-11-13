from django.db import IntegrityError, transaction
from django.test import Client, TestCase, override_settings

from .models import User
from .test_helpers import generated_password


@override_settings(PUBLIC_REGISTRATION_ENABLED=True)
class AccountTests(TestCase):
    def setUp(self):
        self.password = generated_password()
        self.client = Client(enforce_csrf_checks=True)
        self.token = self.client.get("/api/session/").json()["csrfToken"]

    def post(self, path, data=None, token=None):
        return self.client.post(
            path,
            data or {},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token or self.token,
        )

    def register(self, email="synthetic@example.test"):
        response = self.post(
            "/api/register/",
            {
                "email": email,
                "password": self.password,
                "health_consent": True,
                "privacy_policy_version": "2026-11-13",
            },
        )
        if response.status_code == 201:
            self.token = response.json()["csrfToken"]
        return response

    def test_registration_hashes_password_and_creates_persistent_session(self):
        response = self.register("Synthetic@Example.test")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["user"], {"email": "synthetic@example.test"})
        user = User.objects.get()
        self.assertNotEqual(user.password, self.password)
        self.assertTrue(user.check_password(self.password))
        reopened = Client(enforce_csrf_checks=True)
        reopened.cookies = self.client.cookies.copy()
        self.assertEqual(reopened.get("/api/diary/").status_code, 200)
        self.assertEqual(
            reopened.get("/api/session/").json()["user"], response.json()["user"]
        )
        self.assertTrue(self.client.cookies["sessionid"]["httponly"])
        self.assertIn("no-store", response["Cache-Control"])

    def test_invalid_registration_does_not_create_accounts(self):
        cases = [
            ({}, "email"),
            ({"email": "invalid", "password": self.password}, "email"),
            ({"email": "a@example.test", "password": "short"}, "password"),
            ({"email": "a@example.test", "password": "123456789012"}, "password"),
            ({"email": "a@example.test", "password": "password"}, "password"),
            (
                {"email": "similar@example.test", "password": "similar@example.test"},
                "password",
            ),
        ]
        for data, field in cases:
            with self.subTest(data=data):
                response = self.post("/api/register/", data)
                self.assertEqual(response.status_code, 400)
                self.assertIn(field, response.json())
        self.assertEqual(User.objects.count(), 0)

    def test_duplicate_email_is_case_insensitive_in_api_and_database(self):
        self.assertEqual(self.register().status_code, 201)
        self.assertEqual(self.register("SYNTHETIC@example.test").status_code, 400)
        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.create(
                email="SYNTHETIC@example.test", password=generated_password()
            )
        self.assertEqual(User.objects.count(), 1)

    def test_login_logout_and_old_session_rejection(self):
        User.objects.create_user("synthetic@example.test", self.password)
        for email, password in [
            ("missing@example.test", self.password),
            ("synthetic@example.test", "wrong"),
        ]:
            response = self.post(
                "/api/sign-in/", {"email": email, "password": password}
            )
            self.assertEqual(response.status_code, 400)
            self.assertEqual(
                response.json(), {"detail": "Email or password is incorrect."}
            )
        self.assertEqual(self.client.get("/api/diary/").status_code, 403)
        response = self.post(
            "/api/sign-in/",
            {"email": "SYNTHETIC@example.test", "password": self.password},
        )
        self.assertEqual(response.status_code, 200)
        self.token = response.json()["csrfToken"]
        old_session = Client(enforce_csrf_checks=True)
        old_session.cookies = self.client.cookies.copy()
        self.assertEqual(self.client.get("/api/diary/").status_code, 200)
        response = self.post("/api/sign-out/")
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["user"])
        self.assertEqual(self.client.get("/api/diary/").status_code, 403)
        self.assertEqual(old_session.get("/api/diary/").status_code, 403)

    def test_anonymous_registration_and_login_require_csrf(self):
        for path in ["/api/register/", "/api/sign-in/"]:
            response = self.client.post(
                path,
                {"email": "synthetic@example.test", "password": self.password},
                content_type="application/json",
            )
            self.assertEqual(response.status_code, 403)
            response = self.post(path, token="x" * 64)
            self.assertEqual(response.status_code, 403)
        response = self.client.post(
            "/api/register/",
            {"email": "synthetic@example.test", "password": self.password},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=self.token,
            HTTP_ORIGIN="https://untrusted.example",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(User.objects.count(), 0)

    def test_authenticated_logout_requires_csrf_and_rejects_cross_origin(self):
        self.register()
        self.assertEqual(self.client.post("/api/sign-out/").status_code, 403)
        response = self.client.post(
            "/api/sign-out/",
            HTTP_X_CSRFTOKEN=self.token,
            HTTP_ORIGIN="https://untrusted.example",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.client.get("/api/diary/").status_code, 200)

    def test_public_health_and_read_only_endpoints(self):
        self.assertEqual(self.client.get("/api/health/").status_code, 200)
        self.assertIsNone(self.client.get("/api/session/").json()["user"])
        self.assertEqual(self.client.get("/api/register/").status_code, 405)
        self.register()
        self.assertEqual(self.post("/api/diary/").status_code, 405)
        self.assertEqual(self.client.get("/api/sign-out/").status_code, 405)

    def test_browser_origin_matches_preserved_development_host(self):
        for port in [5173, 5174]:
            with self.subTest(port=port):
                response = self.client.post(
                    "/api/sign-in/",
                    {"email": "missing@example.test", "password": self.password},
                    content_type="application/json",
                    HTTP_X_CSRFTOKEN=self.token,
                    HTTP_HOST=f"127.0.0.1:{port}",
                    HTTP_ORIGIN=f"http://127.0.0.1:{port}",
                )
                # The credentials reach authentication rather than failing CSRF.
                self.assertEqual(response.status_code, 400)
                self.assertEqual(
                    response.json(), {"detail": "Email or password is incorrect."}
                )


class ClosedRegistrationTests(TestCase):
    @override_settings(PUBLIC_REGISTRATION_ENABLED=False)
    def test_registration_is_closed_without_creating_user(self):
        response = self.client.post(
            "/api/register/", {}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(User.objects.exists())

    @override_settings(PUBLIC_REGISTRATION_ENABLED=False)
    def test_existing_account_keeps_access(self):
        user = User.objects.create_user("existing@example.test", generated_password())
        self.client.force_login(user)
        self.assertEqual(self.client.get("/api/diary/").status_code, 200)


@override_settings(PUBLIC_REGISTRATION_ENABLED=True)
class PrivacyTests(AccountTests):
    def test_registration_requires_explicit_current_consent(self):
        for extra in [
            {},
            {"health_consent": False},
            {"health_consent": True, "privacy_policy_version": "old"},
        ]:
            response = self.post(
                "/api/register/",
                {"email": "consent@example.test", "password": self.password, **extra},
            )
            self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.exists())
        self.assertEqual(self.register().status_code, 201)
        user = User.objects.get()
        self.assertIsNotNone(user.health_consent_at)
        self.assertEqual(user.privacy_policy_version, "2026-11-13")

    def test_deletion_requires_password_csrf_and_preserves_other_owner(self):
        from diary.models import DiaryEntry

        self.register()
        user = User.objects.get()
        other = User.objects.create_user("other@example.test", generated_password())
        DiaryEntry.objects.create(user=user, date="2020-01-01", status="migraine")
        DiaryEntry.objects.create(user=other, date="2020-01-01", status="migraine")
        self.assertEqual(
            self.client.post(
                "/api/account/delete/", {"password": self.password}
            ).status_code,
            403,
        )
        self.assertEqual(
            self.post("/api/account/delete/", {"password": "incorrect"}).status_code,
            400,
        )
        self.assertTrue(User.objects.filter(pk=user.pk).exists())
        response = self.post(
            "/api/account/delete/", {"password": self.password, "user": other.pk}
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["user"])
        self.assertFalse(User.objects.filter(pk=user.pk).exists())
        self.assertEqual(
            list(DiaryEntry.objects.values_list("user_id", flat=True)), [other.pk]
        )
        self.assertEqual(self.client.get("/api/diary/").status_code, 403)
        self.assertEqual(
            self.post("/api/account/delete/", {"password": self.password}).status_code,
            403,
        )
