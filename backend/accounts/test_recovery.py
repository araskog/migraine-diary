from django.core.cache import cache
from django.test import Client, TestCase, override_settings
from django.urls import reverse

from .models import PasswordRecoveryRequest, User
from .test_helpers import generated_password


class PasswordRecoveryTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.password = generated_password()
        cls.member = User.objects.create_user("jane@example.test", cls.password)
        cls.owner = User.objects.create_superuser("owner@example.test", cls.password)

    def setUp(self):
        cache.clear()
        self.client = Client(enforce_csrf_checks=True)
        self.token = self.client.get("/api/session/").json()["csrfToken"]

    def submit(self, email="jane@example.test", **headers):
        return self.client.post(
            "/api/password-recovery/",
            {"email": email},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=self.token,
            **headers,
        )

    def test_known_and_unknown_addresses_have_the_same_response_and_no_account_changes(
        self,
    ):
        before = self.member.password
        known = self.submit()
        unknown = self.submit("unknown@example.test")
        self.assertEqual(known.status_code, 200)
        self.assertEqual(known.json(), unknown.json())
        self.assertEqual(PasswordRecoveryRequest.objects.count(), 2)
        self.member.refresh_from_db()
        self.assertEqual(self.member.password, before)
        self.assertEqual(User.objects.count(), 2)

    def test_duplicates_are_normalized_and_reopen_one_request(self):
        self.submit()
        record = PasswordRecoveryRequest.objects.get()
        previous_time = record.requested_at
        record.handled = True
        record.save(update_fields=["handled"])
        self.assertEqual(self.submit(" JANE@EXAMPLE.TEST ").status_code, 200)
        record.refresh_from_db()
        self.assertFalse(record.handled)
        self.assertGreaterEqual(record.requested_at, previous_time)
        self.assertEqual(PasswordRecoveryRequest.objects.count(), 1)
        self.assertEqual(record.email, "jane@example.test")

    def test_invalid_email_and_missing_csrf_do_not_create_requests(self):
        self.assertEqual(self.submit("not-an-email").status_code, 400)
        response = self.client.post(
            "/api/password-recovery/",
            {"email": self.member.email},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(PasswordRecoveryRequest.objects.exists())
        self.assertEqual(self.client.get("/api/password-recovery/").status_code, 405)

    def test_requests_are_limited(self):
        for _ in range(5):
            self.assertEqual(self.submit().status_code, 200)
        response = self.submit("another@example.test")
        self.assertEqual(response.status_code, 429)
        self.assertIn("Retry-After", response)
        self.assertEqual(PasswordRecoveryRequest.objects.count(), 1)

    @override_settings(REST_FRAMEWORK={"NUM_PROXIES": 1})
    def test_proxy_client_identity_uses_the_last_forwarded_address(self):
        for _ in range(5):
            self.assertEqual(
                self.submit(HTTP_X_FORWARDED_FOR="spoofed, 192.0.2.10").status_code,
                200,
            )
        self.assertEqual(
            self.submit(HTTP_X_FORWARDED_FOR="different, 192.0.2.10").status_code,
            429,
        )
        self.assertEqual(
            self.submit(HTTP_X_FORWARDED_FOR="192.0.2.11").status_code, 200
        )

    def test_only_admin_can_review_and_handle_requests(self):
        record = PasswordRecoveryRequest.objects.create(email=self.member.email)
        listing = reverse("admin:accounts_passwordrecoveryrequest_changelist")
        change = reverse(
            "admin:accounts_passwordrecoveryrequest_change", args=[record.pk]
        )
        for user in (None, self.member):
            client = Client()
            if user:
                client.force_login(user)
            self.assertEqual(client.get(listing).status_code, 302)
            self.assertEqual(client.get(change).status_code, 302)
        staff = User.objects.create_user(
            "staff@example.test", generated_password(), is_staff=True
        )
        staff_client = Client()
        staff_client.force_login(staff)
        self.assertEqual(staff_client.get(listing).status_code, 403)
        self.assertEqual(staff_client.get(change).status_code, 403)
        admin = Client()
        admin.force_login(self.owner)
        self.assertContains(admin.get(listing), self.member.email)
        self.assertEqual(
            admin.post(change, {"handled": "on", "_save": "Save"}).status_code, 302
        )
        record.refresh_from_db()
        self.assertTrue(record.handled)
        self.assertEqual(
            admin.get(
                reverse("admin:accounts_passwordrecoveryrequest_add")
            ).status_code,
            403,
        )
