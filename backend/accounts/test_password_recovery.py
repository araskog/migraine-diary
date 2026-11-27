from django.test import Client, TestCase

from .models import PasswordRecoveryRequest, User
from .password_recovery import PASSWORD_RECOVERY_CONFIRMATION
from .test_helpers import generated_password


class PasswordRecoveryTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.token = self.client.get("/api/session/").json()["csrfToken"]

    def post(self, data, token=None):
        return self.client.post(
            "/api/password-recovery/",
            data,
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token or self.token,
        )

    def test_request_returns_generic_confirmation_and_persists_email(self):
        response = self.post({"email": "Help@Example.test"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["detail"], PASSWORD_RECOVERY_CONFIRMATION)
        self.assertEqual(
            PasswordRecoveryRequest.objects.get().email, "help@example.test"
        )

    def test_unknown_email_gets_same_confirmation(self):
        response = self.post({"email": "nobody@example.test"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["detail"], PASSWORD_RECOVERY_CONFIRMATION)
        self.assertTrue(
            PasswordRecoveryRequest.objects.filter(email="nobody@example.test").exists()
        )

    def test_invalid_email_is_rejected_without_storing_request(self):
        response = self.post({"email": "not-an-email"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json())
        self.assertFalse(PasswordRecoveryRequest.objects.exists())

    def test_registered_user_email_does_not_reveal_account_in_response(self):
        password = generated_password()
        User.objects.create_user("member@example.test", password)
        response = self.post({"email": "MEMBER@example.test"})
        self.assertEqual(response.json()["detail"], PASSWORD_RECOVERY_CONFIRMATION)
        unknown = self.post({"email": "other@example.test"})
        self.assertEqual(unknown.json()["detail"], response.json()["detail"])
