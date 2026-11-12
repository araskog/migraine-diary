import logging

from django.conf import settings
from django.contrib.auth.forms import PasswordResetForm, SetPasswordForm
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import transaction
from django.middleware.csrf import get_token
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.cache import never_cache
from rest_framework import serializers
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from .models import User

logger = logging.getLogger(__name__)


class ResetEmail(serializers.Serializer):
    email = serializers.EmailField(max_length=254)


class ResetPassword(serializers.Serializer):
    uid = serializers.CharField(max_length=128)
    token = serializers.CharField(max_length=128)
    new_password1 = serializers.CharField(max_length=1024, trim_whitespace=False)
    new_password2 = serializers.CharField(max_length=1024, trim_whitespace=False)


class ResetRequestThrottle(UserRateThrottle):
    scope = "password_reset_request"
    rate = "5/hour"


class ResetConfirmThrottle(UserRateThrottle):
    scope = "password_reset_confirm"
    rate = "20/hour"


@never_cache
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ResetRequestThrottle])
def request_reset(request):
    SessionAuthentication().enforce_csrf(request)
    data = ResetEmail(data=request.data)
    data.is_valid(raise_exception=True)
    if not settings.PASSWORD_RESET_ENABLED:
        return Response(
            {"detail": "Password recovery is temporarily unavailable."}, status=503
        )
    form = PasswordResetForm({"email": data.validated_data["email"]})
    form.is_valid()
    for user in form.get_users(form.cleaned_data["email"]):
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_url = f"{settings.PASSWORD_RESET_ORIGIN}/#reset-password/{uid}/{token}"
        message = render_to_string(
            "accounts/password_reset_email.txt", {"reset_url": reset_url}
        )
        try:
            send_mail(
                "Reset your Migraine Diary password",
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
            )
        except Exception:
            logger.error("Password-reset email delivery failed.")
    return Response(
        {
            "detail": "If an account exists for that email, we will send a password-reset link."
        }
    )


@never_cache
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ResetConfirmThrottle])
def confirm_reset(request):
    SessionAuthentication().enforce_csrf(request)
    data = ResetPassword(data=request.data)
    data.is_valid(raise_exception=True)
    values = data.validated_data
    invalid = {"detail": "This reset link is invalid or expired. Request a new one."}
    try:
        uid = urlsafe_base64_decode(values["uid"]).decode()
        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=uid, is_active=True)
            if (
                not user.has_usable_password()
                or not default_token_generator.check_token(user, values["token"])
            ):
                return Response(invalid, status=400)
            form = SetPasswordForm(user, values)
            if not form.is_valid():
                return Response(
                    form.errors.get_json_data(escape_html=False), status=400
                )
            form.save()
    except (ValueError, UnicodeDecodeError, OverflowError, User.DoesNotExist):
        return Response(invalid, status=400)
    return Response(
        {
            "detail": "Password updated. Sign in with your new password.",
            "csrfToken": get_token(request),
        }
    )
