import logging
from concurrent.futures import ThreadPoolExecutor
from threading import BoundedSemaphore

from django.conf import settings
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import connections
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

logger = logging.getLogger(__name__)
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="password-reset")
_slots = BoundedSemaphore(4)


def deliver_reset(email):
    try:
        form = PasswordResetForm({"email": email})
        form.is_valid()
        for user in form.get_users(form.cleaned_data["email"]):
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = (
                f"{settings.PASSWORD_RESET_ORIGIN}/#reset-password/{uid}/{token}"
            )
            message = render_to_string(
                "accounts/password_reset_email.txt", {"reset_url": reset_url}
            )
            send_mail(
                "Reset your Migraine Diary password",
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
            )
    except Exception:
        logger.error("Password-reset email delivery failed.")


def _run_delivery(email):
    try:
        deliver_reset(email)
    finally:
        connections.close_all()


def queue_reset(email):
    if not _slots.acquire(blocking=False):
        return None
    try:
        future = _executor.submit(_run_delivery, email)
    except RuntimeError:
        _slots.release()
        return None
    future.add_done_callback(lambda completed: _slots.release())
    return future
