from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.utils import timezone
from rest_framework import serializers

from .models import DiaryEntry


class DiaryEntryInput(serializers.Serializer):
    date = serializers.DateField()
    status = serializers.ChoiceField(choices=DiaryEntry.Status.choices)
    timezone = serializers.CharField(max_length=255)

    def validate_timezone(self, value):
        try:
            return ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise serializers.ValidationError("Supply a valid IANA timezone.")

    def validate(self, attrs):
        today = timezone.localdate(timezone.now(), attrs["timezone"])
        if attrs["date"] > today:
            raise serializers.ValidationError({"date": "Future dates cannot be saved."})
        return attrs


class DiaryEntryOutput(serializers.ModelSerializer):
    class Meta:
        model = DiaryEntry
        fields = ["date", "status"]
