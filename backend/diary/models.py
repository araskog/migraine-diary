from django.conf import settings
from django.db import models


class DiaryEntry(models.Model):
    class Status(models.TextChoices):
        MIGRAINE = "migraine", "Migraine day"
        MIGRAINE_FREE = "migraine_free", "Migraine-free day"

    class Sleep(models.TextChoices):
        POOR = "poor", "Poor"
        OKAY = "okay", "Okay"
        GOOD = "good", "Good"

    class SleepDuration(models.TextChoices):
        LESS = "less", "Less than usual"
        USUAL = "usual", "Usual"
        MORE = "more", "More than usual"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=13, choices=Status.choices)
    medication_taken = models.BooleanField(null=True, blank=True)
    medication_name = models.CharField(max_length=200, blank=True)
    sleep = models.CharField(max_length=4, choices=Sleep.choices, blank=True)
    sleep_duration = models.CharField(
        max_length=5, choices=SleepDuration.choices, blank=True
    )
    pain_severity = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "date"], name="diary_user_date_unique"
            ),
            models.CheckConstraint(
                condition=models.Q(status__in=["migraine", "migraine_free"]),
                name="diary_status_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(pain_severity__lte=10),
                name="diary_pain_severity_valid",
            ),
        ]
