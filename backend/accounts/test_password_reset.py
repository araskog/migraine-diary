import json
import re
from datetime import datetime, timedelta
from unittest.mock import patch

import requests
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.core.cache import cache
from django.test import Client, TestCase, override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from .models import User
from .test_helpers import generated_password


@override_settings(
    PASSWORD_RESET_ENABLED=True,
    PASSWORD_RESET_ORIGIN="https://diary.example.test",
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="Migraine Diary <sender@example.test>",
)
class PasswordResetTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.password = generated_password()
        cls.member = User.objects.create_user("jane@example.test", cls.password)
        cls.other = User.objects.create_user("other@example.test", generated_password())

    def setUp(self):
        cache.clear()
        self.client = Client(enforce_csrf_checks=True)
        self.csrf = self.client.get("/api/session/").json()["csrfToken"]

    def request_reset(self, email="jane@example.test", **headers):
        return self.client.post(
            "/api/password-reset/",
            {"email": email},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=self.csrf,
            **headers,
        )

    def token(self):
        self.assertEqual(self.request_reset().status_code, 200)
        return re.search(
            r"#reset-password/([^/\s]+)/([^\s]+)", mail.outbox[-1].body
        ).groups()

    def confirm(self, uid, token, password=None, **overrides):
        password = password or generated_password()
        values = {
            "uid": uid,
            "token": token,
            "new_password1": password,
            "new_password2": password,
            **overrides,
        }
        return self.client.post(
            "/api/password-reset/confirm/",
            values,
            content_type="application/json",
            HTTP_X_CSRFTOKEN=self.csrf,
        )

    def test_known_unknown_and_inactive_accounts_have_generic_response(self):
        known = self.request_reset("JANE@EXAMPLE.TEST")
        self.assertEqual(len(mail.outbox), 1)
        unknown = self.request_reset("unknown@example.test")
        self.other.is_active = False
        self.other.save(update_fields=["is_active"])
        inactive = self.request_reset(self.other.email)
        self.assertEqual(known.status_code, 200)
        self.assertEqual(known.json(), unknown.json())
        self.assertEqual(known.json(), inactive.json())
        self.assertEqual(len(mail.outbox), 1)
        self.member.refresh_from_db()
        self.assertTrue(self.member.check_password(self.password))

    def test_reset_link_changes_password_once_and_invalidates_existing_session(self):
        old_session = Client()
        self.assertTrue(
            old_session.login(email=self.member.email, password=self.password)
        )
        uid, token = self.token()
        new_password = generated_password()
        self.assertEqual(self.confirm(uid, token, new_password).status_code, 200)
        self.member.refresh_from_db()
        self.assertTrue(self.member.check_password(new_password))
        self.assertFalse(self.member.check_password(self.password))
        self.assertEqual(old_session.get("/api/diary/").status_code, 403)
        self.assertIsNone(self.client.get("/api/session/").json()["user"])
        self.assertEqual(self.confirm(uid, token).status_code, 400)
        self.assertTrue(Client().login(email=self.member.email, password=new_password))

    def test_expired_and_altered_tokens_are_rejected(self):
        with patch.object(
            default_token_generator,
            "_now",
            return_value=datetime.now() - timedelta(hours=2),
        ):
            uid, expired = self.token()
        self.assertEqual(self.confirm(uid, expired).status_code, 400)
        uid, token = self.token()
        for bad_uid, bad_token in (
            (uid, token + "x"),
            ("/w", token),
            ("invalid", token),
            (urlsafe_base64_encode(force_bytes(self.other.pk)), token),
        ):
            with self.subTest(uid=bad_uid):
                self.assertEqual(self.confirm(bad_uid, bad_token).status_code, 400)
        self.member.refresh_from_db()
        self.assertTrue(self.member.check_password(self.password))

    def test_password_rules_and_confirmation_apply_without_consuming_token(self):
        uid, token = self.token()
        self.assertEqual(self.confirm(uid, token, "password").status_code, 400)
        self.assertEqual(
            self.confirm(uid, token, new_password2=generated_password()).status_code,
            400,
        )
        self.assertEqual(self.confirm(uid, token).status_code, 200)

    def test_both_writes_require_csrf_and_reject_invalid_input(self):
        uid, token = self.token()
        for path, data in (
            ("/api/password-reset/", {"email": self.member.email}),
            (
                "/api/password-reset/confirm/",
                {
                    "uid": uid,
                    "token": token,
                    "new_password1": generated_password(),
                    "new_password2": generated_password(),
                },
            ),
        ):
            self.assertEqual(
                self.client.post(
                    path, data, content_type="application/json"
                ).status_code,
                403,
            )
            self.assertEqual(self.client.get(path).status_code, 405)
        self.assertEqual(self.request_reset("not-an-email").status_code, 400)
        self.assertEqual(
            self.confirm(uid, token, new_password1="x" * 1025).status_code, 400
        )

    def test_link_uses_configured_origin_not_request_host(self):
        with override_settings(ALLOWED_HOSTS=["testserver", "attacker.example.test"]):
            self.assertEqual(
                self.request_reset(HTTP_HOST="attacker.example.test").status_code, 200
            )
        self.assertIn(
            "https://diary.example.test/#reset-password/", mail.outbox[-1].body
        )
        self.assertNotIn("attacker.example.test", mail.outbox[-1].body)

    def test_disabled_delivery_fails_equally_for_all_addresses(self):
        with override_settings(PASSWORD_RESET_ENABLED=False):
            known = self.request_reset()
            unknown = self.request_reset("unknown@example.test")
        self.assertEqual(known.status_code, 503)
        self.assertEqual(known.json(), unknown.json())

    def test_delivery_failure_does_not_expose_email_or_token(self):
        with patch(
            "accounts.password_reset.send_mail",
            side_effect=RuntimeError("sensitive provider detail"),
        ):
            with self.assertLogs("accounts.password_reset", level="ERROR") as logs:
                failed = self.request_reset()
        unknown = self.request_reset("unknown@example.test")
        self.assertEqual(failed.json(), unknown.json())
        self.assertEqual(
            logs.output,
            ["ERROR:accounts.password_reset:Password-reset email delivery failed."],
        )

    def test_request_throttle_does_not_block_confirmation(self):
        uid, token = self.token()
        for _ in range(4):
            self.assertEqual(self.request_reset().status_code, 200)
        self.assertEqual(self.request_reset().status_code, 429)
        self.assertEqual(self.confirm(uid, token).status_code, 200)

    def test_brevo_adapter_sends_the_reset_email_over_https(self):
        response = requests.Response()
        response.status_code = 201
        response._content = b'{"messageId":"synthetic-message"}'
        with override_settings(
            EMAIL_BACKEND="anymail.backends.brevo.EmailBackend",
            ANYMAIL={"BREVO_API_KEY": generated_password()},
        ):
            with patch("requests.sessions.Session.send", return_value=response) as send:
                self.assertEqual(self.request_reset().status_code, 200)
        request = send.call_args.args[0]
        self.assertEqual(request.url, "https://api.brevo.com/v3/smtp/email")
        body = json.loads(request.body)
        self.assertEqual(body["to"], [{"email": self.member.email}])
        self.assertIn("#reset-password/", body["textContent"])
