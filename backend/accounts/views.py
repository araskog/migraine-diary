from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.cache import never_cache
from rest_framework import serializers
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .demo import create_demo_user
from .models import User

PRIVACY_POLICY_VERSION = "2026-11-13"


class RegistrationConsent(serializers.Serializer):
    health_consent = serializers.BooleanField()
    privacy_policy_version = serializers.ChoiceField(choices=[PRIVACY_POLICY_VERSION])

    def validate_health_consent(self, value):
        if not value:
            raise serializers.ValidationError(
                "Explicit health-data consent is required."
            )
        return value


class Credentials(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(trim_whitespace=False, max_length=1024)

    def validate_email(self, value):
        return value.lower()


def identity(request):
    if not request.user.is_authenticated:
        return {"user": None, "csrfToken": get_token(request)}
    return {
        "user": {
            "email": request.user.email,
            "isDemo": request.user.is_demo,
        },
        "csrfToken": get_token(request),
    }


@never_cache
@api_view(["GET"])
@permission_classes([AllowAny])
def session(request):
    return Response(identity(request))


# SessionAuthentication normally checks CSRF only for authenticated users.
# These entry points explicitly enforce it before accepting anonymous credentials.
@never_cache
@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    SessionAuthentication().enforce_csrf(request)
    credentials = Credentials(data=request.data)
    credentials.is_valid(raise_exception=True)
    email = credentials.validated_data["email"]
    password = credentials.validated_data["password"]
    try:
        validate_password(password, user=User(email=email))
    except ValidationError as error:
        return Response({"password": error.messages}, status=400)
    consent = RegistrationConsent(data=request.data)
    consent.is_valid(raise_exception=True)
    try:
        with transaction.atomic():
            user = User.objects.create_user(
                email,
                password,
                health_consent_at=timezone.now(),
                privacy_policy_version=PRIVACY_POLICY_VERSION,
            )
    except IntegrityError:
        return Response(
            {"email": ["An account with this email already exists."]}, status=400
        )
    login(request, user)
    return Response(identity(request), status=201)


@never_cache
@api_view(["POST"])
@permission_classes([AllowAny])
def sign_in(request):
    SessionAuthentication().enforce_csrf(request)
    credentials = Credentials(data=request.data)
    credentials.is_valid(raise_exception=True)
    user = authenticate(request, **credentials.validated_data)
    if user is None:
        return Response({"detail": "Email or password is incorrect."}, status=400)
    if user.is_demo:
        return Response(
            {
                "detail": (
                    "Demo sessions cannot be signed into. Start a new demo or "
                    "create your own account after signing out."
                )
            },
            status=400,
        )
    login(request, user)
    return Response(identity(request))


@never_cache
@api_view(["POST"])
def sign_out(request):
    logout(request)
    return Response(identity(request))


@never_cache
@api_view(["GET"])
def diary(request):
    return Response({"title": "Your diary", "recordingAvailable": False})


class DemoStartInput(serializers.Serializer):
    timezone = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_timezone(self, value):
        if not value:
            return ZoneInfo("UTC")
        try:
            return ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise serializers.ValidationError("Supply a valid IANA timezone.")


@never_cache
@api_view(["POST"])
@permission_classes([AllowAny])
def start_demo(request):
    SessionAuthentication().enforce_csrf(request)
    if request.user.is_authenticated and not request.user.is_demo:
        return Response(
            {"detail": "Sign out before starting a demo."},
            status=400,
        )
    if request.user.is_authenticated and request.user.is_demo:
        return Response(identity(request))
    start = DemoStartInput(data=request.data)
    start.is_valid(raise_exception=True)
    reference_date = timezone.localdate(
        timezone.now(), start.validated_data["timezone"]
    )
    user = create_demo_user(reference_date=reference_date)
    login(request, user)
    return Response(identity(request), status=201)


@never_cache
@api_view(["POST"])
def delete_account(request):
    password = serializers.CharField(trim_whitespace=False, max_length=1024)
    value = password.run_validation(request.data.get("password"))
    if not request.user.check_password(value):
        return Response({"detail": "Password is incorrect."}, status=400)
    with transaction.atomic():
        request.user.delete()
        logout(request)
    return Response(identity(request))
