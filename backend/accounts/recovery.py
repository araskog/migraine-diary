from django.utils import timezone
from django.views.decorators.cache import never_cache
from rest_framework import serializers
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from .models import PasswordRecoveryRequest


class RecoveryEmail(serializers.Serializer):
    email = serializers.EmailField(max_length=254)


class RecoveryRequestThrottle(UserRateThrottle):
    scope = "password_recovery"
    rate = "5/hour"


@never_cache
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([RecoveryRequestThrottle])
def request_recovery(request):
    SessionAuthentication().enforce_csrf(request)
    data = RecoveryEmail(data=request.data)
    data.is_valid(raise_exception=True)
    PasswordRecoveryRequest.objects.update_or_create(
        email=data.validated_data["email"].lower(),
        defaults={"handled": False, "requested_at": timezone.now()},
    )
    return Response(
        {"detail": "Request received. We will review it and contact you by email."}
    )
