from django.conf import settings
from django.db import models


class DiaryEntry(models.Model):
    class Status(models.TextChoices):
        MIGRAINE = "migraine", "Migraine day"
        MIGRAINE_FREE = "migraine_free", "Migraine-free day"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=13, choices=Status.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "date"], name="diary_user_date_unique"
            ),
            models.CheckConstraint(
                condition=models.Q(status__in=["migraine", "migraine_free"]),
                name="diary_status_valid",
            ),
        ]
