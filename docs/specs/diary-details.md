# Diary Details

Status: Complete.

## Goal and Scope

A signed-in user can optionally add answers about medication, sleep, and migraine-day pain to a date that already has a saved migraine or migraine-free status. All detail fields are optional; unanswered fields remain unset rather than implying a negative answer. Free-text notes outside the fixed fields remain out of scope.

Detail behavior follows the same persistence, ownership, timezone, and date rules as [First Usable Diary](first-usable-diary.md). Clearing a calendar entry removes its status and details together.

## Acceptance Criteria

| ID | Observable outcome |
|---|---|
| DD1 | For a recorded date, a user can leave medication unanswered, answer that they did or did not take migraine medication, and supply a medication name only when they answer yes. Clearing or answering no removes a saved name. |
| DD2 | A user can optionally record sleep quality (poor, okay, or good) and sleep duration (less than usual, usual, or more than usual), and can clear each answer independently. |
| DD3 | On migraine days, a user can optionally record worst pain severity as a whole number from 0 through 10, or leave it unanswered. A recorded 0 is an explicit answer, not the same as unanswered. The pain control is not shown for migraine-free days. |
| DD4 | Saved details remain after closing and reopening the app and signing in again. Failed saves keep the in-progress answers visible and allow retrying without discarding them silently. |
| DD5 | Changing a date to migraine-free clears stored pain severity while preserving other saved detail answers. Changing back to migraine day does not restore a previously cleared pain answer unless the user sets it again. |
| DD6 | Invalid detail values are rejected without overwriting previously saved answers for that date. Status and date rules from the first usable diary still apply. |
| DD7 | Another user cannot read or change diary details, including through direct API requests. |
| DD8 | Detail edits save in the background without reloading the whole diary list. While details are unsaved or a detail save is in progress, sign-out and demo account creation prompt before discarding in-progress answers. |

## Delivery and Verification

Backend tests in `diary.tests` cover persistence, validation, privacy, status transitions, and clearing behavior for optional fields. With the frontend dev server running, [detail-autosave checks](http://127.0.0.1:5173/static/app/tests/diary-details.html) exercise autosave stability and migraine-free hiding of pain details. Manual verification uses synthetic data only.

References: [architecture](../architecture.md), [first usable diary](first-usable-diary.md), [glossary](../../GLOSSARY.md), [coding standards](../../CODING_STANDARDS.md), and [workflow](../agents/workflow.md).