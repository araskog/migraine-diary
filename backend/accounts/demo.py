import secrets
import uuid
from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.db import transaction

from diary.models import DiaryEntry

from .models import User

DEMO_EMAIL_DOMAIN = "demo.session.example.test"

# Offsets are days before the reference "today" supplied when seeding.
SAMPLE_ENTRY_SPECS = [
    {"days_ago": 28, "status": DiaryEntry.Status.MIGRAINE_FREE},
    {"days_ago": 26, "status": DiaryEntry.Status.MIGRAINE, "pain_severity": 7},
    {"days_ago": 25, "status": DiaryEntry.Status.MIGRAINE_FREE},
    {"days_ago": 23, "status": DiaryEntry.Status.MIGRAINE, "pain_severity": 5},
    {"days_ago": 21, "status": DiaryEntry.Status.MIGRAINE_FREE},
    {
        "days_ago": 19,
        "status": DiaryEntry.Status.MIGRAINE,
        "pain_severity": 6,
        "medication_taken": True,
        "medication_name": "Sample reliever",
        "sleep": DiaryEntry.Sleep.POOR,
        "sleep_duration": DiaryEntry.SleepDuration.LESS,
    },
    {"days_ago": 17, "status": DiaryEntry.Status.MIGRAINE_FREE},
    {"days_ago": 14, "status": DiaryEntry.Status.MIGRAINE, "pain_severity": 4},
    {"days_ago": 12, "status": DiaryEntry.Status.MIGRAINE_FREE},
    {"days_ago": 10, "status": DiaryEntry.Status.MIGRAINE, "pain_severity": 8},
    {
        "days_ago": 8,
        "status": DiaryEntry.Status.MIGRAINE_FREE,
        "sleep": DiaryEntry.Sleep.GOOD,
        "sleep_duration": DiaryEntry.SleepDuration.USUAL,
    },
    {"days_ago": 5, "status": DiaryEntry.Status.MIGRAINE, "pain_severity": 3},
    {"days_ago": 3, "status": DiaryEntry.Status.MIGRAINE_FREE},
    {"days_ago": 1, "status": DiaryEntry.Status.MIGRAINE, "pain_severity": 5},
]


def demo_email():
    return f"demo-{uuid.uuid4().hex}@{DEMO_EMAIL_DOMAIN}"


def seed_sample_entries(user, *, reference_date):
    entries = []
    for spec in SAMPLE_ENTRY_SPECS:
        entry_date = reference_date - timedelta(days=spec["days_ago"])
        entries.append(
            DiaryEntry(
                user=user,
                date=entry_date,
                status=spec["status"],
                pain_severity=spec.get("pain_severity"),
                medication_taken=spec.get("medication_taken"),
                medication_name=spec.get("medication_name", ""),
                sleep=spec.get("sleep", ""),
                sleep_duration=spec.get("sleep_duration", ""),
            )
        )
    DiaryEntry.objects.bulk_create(entries)


@transaction.atomic
def create_demo_user(*, reference_date):
    password = secrets.token_urlsafe(32)
    user = User.objects.create(
        email=demo_email(),
        password=make_password(password),
        is_demo=True,
    )
    seed_sample_entries(user, reference_date=reference_date)
    return user
