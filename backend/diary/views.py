from django.views.decorators.cache import never_cache
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import DiaryEntry
from .serializers import DiaryDateInput, DiaryEntryInput, DiaryEntryOutput


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
    entry, created = DiaryEntry.objects.update_or_create(
        user=request.user,
        date=data["date"],
        defaults=defaults,
    )
    return Response(DiaryEntryOutput(entry).data, status=201 if created else 200)
