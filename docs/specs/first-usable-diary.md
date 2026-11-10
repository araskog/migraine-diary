# First Usable Diary

## Goal and Scope

A user can create an account, sign in, record migraine or migraine-free days, and return to their saved private diary. The first version runs locally and works on mobile-sized screens.

Include sign-out, password recovery, and correcting or removing entries. Entries record migraine status only; intensity, medication, and notes are outside this milestone, along with AI summaries, reports, trigger analysis, deployment, and use of real health data.

## Acceptance Criteria

| ID | Observable outcome |
|---|---|
| D1 | A user can register, sign in, and sign out. Signing out prevents further access to protected diary data until they sign in again. |
| D2 | A user who forgets their password can recover access through a secure password-reset flow. Expired or already-used reset links cannot reset a password. |
| D3 | A user can record either migraine or migraine-free status for today or a past date. Each user/date has one current status; changing it updates that record. Success and failed saves are visibly distinguishable. |
| D4 | Saved entries and corrections remain after closing/reopening the app and signing in again. Verification exercises backend persistence, not only browser state. |
| D5 | Another user cannot read or change these records, including through direct API requests. |
| D6 | Invalid dates and dates later than today are rejected without creating or changing a record. Today follows the device's local timezone, including when travelling. Stored diary dates remain calendar dates and do not shift when the timezone changes. Validation is enforced by the backend using the supplied timezone. |
| D7 | A missing entry is displayed as unrecorded, never as a confirmed migraine-free day. |
| D8 | Removing an entry requires confirmation. Cancelling leaves it unchanged; confirming removes it persistently. A failed removal is reported and is not shown as successful. |
| D9 | Registration, sign-in, recovery, recording, correction, and removal work on mobile-sized screens and can be demonstrated locally with synthetic accounts and records. |

## Account Access Increment

The approved first account increment implements D1 and the account portions of D9: email/password self-registration, sign-in, sign-out, and a protected Your diary placeholder. Successful registration signs the user in. Email identifies accounts case-insensitively. Server sessions restore access on reload, and logout invalidates access. Password recovery (D2) follows in the next increment; diary recording is not included here.

The approved visual direction is a neutral white page, soft sage buttons, and dark green main actions and selected controls, with clear labels, loading states, errors, and retry feedback on mobile screens. No theme feature or design library is included.

Agreed tests cover backend registration validation/password validation, authentication, session persistence, protected access after logout, and anonymous/authenticated CSRF. Manual browser checks cover mobile forms, validation errors, reload, and sign-out. Existing frontend and backend checks and PostgreSQL CI remain required.

## Delivery and Verification

Build in focused increments: runnable local foundation, accounts, then diary recording. Each PR links to the criteria it implements. Agree test boundaries before implementing each feature; check ownership, validation, and persistence through the backend, and verify the core user interactions in the browser.

References: [architecture](../architecture.md), [glossary](../../GLOSSARY.md), [coding standards](../../CODING_STANDARDS.md), and [workflow](../agents/workflow.md).
