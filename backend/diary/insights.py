from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta
from statistics import mean

from .models import DiaryEntry

SCHEMA_VERSION = 1
WINDOW_DAYS = 90
MIN_RECORDED_DAYS = 10
MIN_SLICE_DAYS = 3

WEEKDAY_LABELS = (
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
)

SLEEP_DURATION_VALUES = (
    DiaryEntry.SleepDuration.LESS,
    DiaryEntry.SleepDuration.USUAL,
    DiaryEntry.SleepDuration.MORE,
)

SLEEP_QUALITY_VALUES = (
    DiaryEntry.Sleep.POOR,
    DiaryEntry.Sleep.OKAY,
    DiaryEntry.Sleep.GOOD,
)


def _window_start(today: date, window_days: int) -> date:
    return today - timedelta(days=window_days - 1)


def _entries_in_window(
    entries: list[DiaryEntry], today: date, window_days: int
) -> list[DiaryEntry]:
    start = _window_start(today, window_days)
    return [entry for entry in entries if start <= entry.date <= today]


def _migraine_rate(migraine_days: int, recorded_days: int) -> float | None:
    if recorded_days == 0:
        return None
    return round(migraine_days / recorded_days, 3)


def _slice_stats(days: list[DiaryEntry]) -> dict:
    recorded_days = len(days)
    migraine_days = sum(1 for day in days if day.status == DiaryEntry.Status.MIGRAINE)
    return {
        "recorded_days": recorded_days,
        "migraine_days": migraine_days,
        "migraine_rate": _migraine_rate(migraine_days, recorded_days),
        "sufficient_data": recorded_days >= MIN_SLICE_DAYS,
    }


def _default_label(value: str | bool) -> str:
    if isinstance(value, bool):
        return "Yes" if value else "No"
    return value.replace("_", " ").title()


def _categorical_slice(
    window_entries: list[DiaryEntry],
    field: str,
    values: tuple[str | bool, ...],
    labels: dict[str | bool, str] | None = None,
) -> list[dict]:
    slices = []
    for value in values:
        days = [entry for entry in window_entries if getattr(entry, field) == value]
        item = {
            "value": value,
            "label": (labels or {}).get(value, _default_label(value)),
            **_slice_stats(days),
        }
        slices.append(item)
    return slices


def _weekday_slices(window_entries: list[DiaryEntry]) -> list[dict]:
    by_weekday: dict[int, list[DiaryEntry]] = defaultdict(list)
    for entry in window_entries:
        by_weekday[entry.date.weekday()].append(entry)
    slices = []
    for index, label in enumerate(WEEKDAY_LABELS):
        days = by_weekday[index]
        slices.append(
            {
                "weekday": index,
                "label": label,
                **_slice_stats(days),
            }
        )
    return slices


def _average_pain(days: list[DiaryEntry]) -> float | None:
    values = [
        day.pain_severity
        for day in days
        if day.status == DiaryEntry.Status.MIGRAINE and day.pain_severity is not None
    ]
    if not values:
        return None
    return round(mean(values), 1)


def _pain_slices(
    window_entries: list[DiaryEntry],
    field: str,
    values: tuple[str, ...],
    labels: dict[str, str] | None = None,
) -> list[dict]:
    slices = []
    for value in values:
        days = [
            entry
            for entry in window_entries
            if getattr(entry, field) == value
            and entry.status == DiaryEntry.Status.MIGRAINE
            and entry.pain_severity is not None
        ]
        migraine_days = len(days)
        slices.append(
            {
                "value": value,
                "label": (labels or {}).get(value, value.replace("_", " ").title()),
                "migraine_days": migraine_days,
                "average_pain_severity": _average_pain(days),
                "sufficient_data": migraine_days >= MIN_SLICE_DAYS,
            }
        )
    return slices


def _medication_pain_slices(window_entries: list[DiaryEntry]) -> list[dict]:
    slices = []
    for taken, label in ((True, "Medication taken"), (False, "No medication")):
        days = [
            entry
            for entry in window_entries
            if entry.medication_taken is taken
            and entry.status == DiaryEntry.Status.MIGRAINE
            and entry.pain_severity is not None
        ]
        migraine_days = len(days)
        slices.append(
            {
                "medication_taken": taken,
                "label": label,
                "migraine_days": migraine_days,
                "average_pain_severity": _average_pain(days),
                "sufficient_data": migraine_days >= MIN_SLICE_DAYS,
            }
        )
    return slices


def _coverage(window_entries: list[DiaryEntry]) -> dict:
    return {
        "sleep_duration_answered": sum(
            1 for entry in window_entries if entry.sleep_duration
        ),
        "sleep_quality_answered": sum(1 for entry in window_entries if entry.sleep),
        "medication_answered": sum(
            1 for entry in window_entries if entry.medication_taken is not None
        ),
        "pain_answered": sum(
            1
            for entry in window_entries
            if entry.status == DiaryEntry.Status.MIGRAINE
            and entry.pain_severity is not None
        ),
    }


def compute_insights(
    entries: list[DiaryEntry], today: date, window_days: int = WINDOW_DAYS
) -> dict:
    window_entries = _entries_in_window(entries, today, window_days)
    recorded_days = len(window_entries)
    migraine_days = sum(
        1 for entry in window_entries if entry.status == DiaryEntry.Status.MIGRAINE
    )
    migraine_free_days = recorded_days - migraine_days

    sleep_duration_labels = {
        DiaryEntry.SleepDuration.LESS: "Less than usual",
        DiaryEntry.SleepDuration.USUAL: "Usual",
        DiaryEntry.SleepDuration.MORE: "More than usual",
    }
    sleep_quality_labels = {
        DiaryEntry.Sleep.POOR: "Poor",
        DiaryEntry.Sleep.OKAY: "Okay",
        DiaryEntry.Sleep.GOOD: "Good",
    }

    return {
        "schema_version": SCHEMA_VERSION,
        "window_days": window_days,
        "today": today.isoformat(),
        "summary": {
            "recorded_days": recorded_days,
            "migraine_days": migraine_days,
            "migraine_free_days": migraine_free_days,
            "migraine_rate": _migraine_rate(migraine_days, recorded_days),
            "insufficient_data": recorded_days < MIN_RECORDED_DAYS,
            "minimum_recorded_days": MIN_RECORDED_DAYS,
        },
        "coverage": _coverage(window_entries),
        "weekdays": _weekday_slices(window_entries),
        "sleep_duration": _categorical_slice(
            window_entries,
            "sleep_duration",
            SLEEP_DURATION_VALUES,
            sleep_duration_labels,
        ),
        "sleep_quality": _categorical_slice(
            window_entries, "sleep", SLEEP_QUALITY_VALUES, sleep_quality_labels
        ),
        "medication": _categorical_slice(
            window_entries,
            "medication_taken",
            (True, False),
            {True: "Medication taken", False: "No medication"},
        ),
        "pain_by_sleep_duration": _pain_slices(
            window_entries,
            "sleep_duration",
            SLEEP_DURATION_VALUES,
            sleep_duration_labels,
        ),
        "pain_by_sleep_quality": _pain_slices(
            window_entries, "sleep", SLEEP_QUALITY_VALUES, sleep_quality_labels
        ),
        "pain_by_medication": _medication_pain_slices(window_entries),
    }
