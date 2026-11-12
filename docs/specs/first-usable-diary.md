# First Usable Diary

Status: Complete. Password recovery is deferred outside this milestone.

## Goal and Scope

A user can create an account, sign in, record migraine or migraine-free days, and return to their saved private diary. The first version runs locally and works on mobile-sized screens.

Include sign-out and correcting entries. Entries record migraine status only; intensity, medication, and notes are outside this milestone, along with AI summaries, reports, trigger analysis, deployment, and use of real health data.

## Acceptance Criteria

| ID | Observable outcome |
|---|---|
| D1 | A user can register, sign in, and sign out. Signing out prevents further access to protected diary data until they sign in again. |
| D3 | A user can record either migraine or migraine-free status for today or a past date. Each user/date has one current status; changing it updates that record. Success and failed saves are visibly distinguishable. |
| D4 | Saved entries and corrections remain after closing/reopening the app and signing in again. Verification exercises backend persistence, not only browser state. |
| D5 | Another user cannot read or change these records, including through direct API requests. |
| D6 | Invalid dates and dates later than today are rejected without creating or changing a record. Today follows the device's local timezone, including when travelling. Stored diary dates remain calendar dates and do not shift when the timezone changes. Validation is enforced by the backend using the supplied timezone. |
| D7 | A missing entry has no calendar status icon or legend entry, never implying a confirmed migraine-free day. Its accessible date label identifies it as unrecorded. |
| D9 | Registration, sign-in, recording, and correction work on mobile-sized screens and can be demonstrated locally with synthetic accounts and records. |

## Delivery and Verification

Build in focused increments: runnable local foundation, accounts, then diary recording. Each PR links to the criteria it implements. Agree test boundaries before implementing each feature; check ownership, validation, and persistence through the backend, and verify the core user interactions in the browser.

References: [architecture](../architecture.md), [glossary](../../GLOSSARY.md), [coding standards](../../CODING_STANDARDS.md), and [workflow](../agents/workflow.md).
