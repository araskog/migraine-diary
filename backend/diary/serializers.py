from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.utils import timezone
from rest_framework import serializers

from .models import DiaryEntry


class DiaryEntryInput(serializers.Serializer):
    date = serializers.DateField()
    status = serializers.ChoiceField(choices=DiaryEntry.Status.choices)
    timezone = serializers.CharField(max_length=255)
    medication_taken = serializers.BooleanField(required=False, allow_null=True)
    medication_name = serializers.CharField(
        required=False, allow_blank=True, max_length=200
    )
    sleep = serializers.ChoiceField(
        choices=DiaryEntry.Sleep.choices, required=False, allow_blank=True
    )
    pain_severity = serializers.IntegerField(
        required=False, allow_null=True, min_value=0, max_value=10
    )

    def validate_timezone(self, value):
        try:
            return ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise serializers.ValidationError("Supply a valid IANA timezone.")

    def validate(self, attrs):
        today = timezone.localdate(timezone.now(), attrs["timezone"])
        if attrs["date"] > today:
            raise serializers.ValidationError({"date": "Future dates cannot be saved."})
        if attrs.get("medication_name") and attrs.get("medication_taken") is not True:
            raise serializers.ValidationError(
                {"medication_name": "Choose Yes before naming medication."}
            )
        if (
            attrs["status"] == DiaryEntry.Status.MIGRAINE_FREE
            and attrs.get("pain_severity") is not None
        ):
            raise serializers.ValidationError(
                {"pain_severity": "Pain severity is recorded on migraine days."}
            )
        return attrs


class DiaryEntryOutput(serializers.ModelSerializer):
    class Meta:
        model = DiaryEntry
        fields = [
            "date",
            "status",
            "medication_taken",
            "medication_name",
            "sleep",
            "pain_severity",
        ]
