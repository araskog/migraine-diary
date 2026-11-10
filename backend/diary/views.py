from django.views.decorators.cache import never_cache
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import DiaryEntry
from .serializers import DiaryEntryInput, DiaryEntryOutput


@never_cache
@api_view(["GET", "POST"])
def entries(request):
    if request.method == "GET":
        entries = DiaryEntry.objects.filter(user=request.user).order_by("-date")
        return Response(DiaryEntryOutput(entries, many=True).data)

    serializer = DiaryEntryInput(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    entry, created = DiaryEntry.objects.update_or_create(
        user=request.user,
        date=data["date"],
        defaults={"status": data["status"]},
    )
    return Response(DiaryEntryOutput(entry).data, status=201 if created else 200)
