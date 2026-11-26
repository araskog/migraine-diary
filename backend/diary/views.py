from datetime import timedelta

from django.utils import timezone
from django.views.decorators.cache import never_cache
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .insights import WINDOW_DAYS, compute_insights
from .models import DiaryEntry
from .serializers import (
    DiaryDateInput,
    DiaryEntryInput,
    DiaryEntryOutput,
    InsightsQuery,
)


@never_cache
@api_view(["GET", "POST", "DELETE"])
def entries(request):
    if request.method == "GET":
        entries = DiaryEntry.objects.filter(user=request.user).order_by("-date")
        return Response(DiaryEntryOutput(entries, many=True).data)

    if request.method == "DELETE":
        serializer = DiaryDateInput(data=request.data)
        serializer.is_valid(raise_exception=True)
        DiaryEntry.objects.filter(
            user=request.user, date=serializer.validated_data["date"]
        ).delete()
        return Response(status=204)

    serializer = DiaryEntryInput(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    defaults = {
        key: value for key, value in data.items() if key not in {"date", "timezone"}
    }
    if defaults.get("medication_taken") is not True and "medication_taken" in defaults:
        defaults["medication_name"] = ""
    if data["status"] == DiaryEntry.Status.MIGRAINE_FREE:
        defaults["pain_severity"] = None
        defaults["symptoms"] = []
    entry, created = DiaryEntry.objects.update_or_create(
        user=request.user,
        date=data["date"],
        defaults=defaults,
    )
    return Response(DiaryEntryOutput(entry).data, status=201 if created else 200)


@never_cache
@api_view(["GET"])
def insights(request):
    serializer = InsightsQuery(data=request.query_params)
    serializer.is_valid(raise_exception=True)
    tz = serializer.validated_data["timezone"]
    today = timezone.localdate(timezone.now(), tz)
    window_start = today - timedelta(days=WINDOW_DAYS - 1)
    entries = list(
        DiaryEntry.objects.filter(
            user=request.user, date__gte=window_start, date__lte=today
        ).order_by("date")
    )
    return Response(compute_insights(entries, today))
