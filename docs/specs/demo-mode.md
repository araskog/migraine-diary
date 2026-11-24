# Demo Mode

Status: Delivered in demo-mode PR; pending owner merge.

## Goal and Scope

Visitors can open Migraine Diary with a populated sample diary, edit entries to see calendar and detail updates work, and optionally convert that session into a real account while keeping their changes. Each visitor receives an isolated demo session; there is no shared global demo account.

Password recovery is out of scope for this feature. Hosting and performance work remain unchanged.

## Acceptance Criteria

| ID | Observable outcome |
|---|---|
| DM1 | From the account entry screen, a visitor can start a demo without registering. The app opens the diary with sample entries visible on the calendar. |
| DM2 | Demo data is clearly labeled in the UI as sample or demo data, not the visitor's personal health record. |
| DM3 | A visitor can record, correct, clear, and edit details in the demo diary; changes persist while the same demo session remains active and after reload while still signed in. |
| DM4 | Starting demo creates a separate session per visitor; two browsers do not share one editable demo diary. |
| DM5 | While in a demo session, a visitor can create a real account with email and password. Conversion keeps existing diary entries on the same account; the session is no longer marked as demo. |
| DM6 | Demo sessions cannot be reopened with email and password sign-in; visitors who sign out of a demo must start a new demo or create an account during the session. |
| DM7 | Demo and conversion flows enforce the same backend validation, ownership, and CSRF rules as existing account and diary endpoints. Another user cannot access a demo user's entries. |

## Verification

Backend tests cover demo start, sample seeding, isolation, conversion with entry retention, and sign-in rejection for demo accounts. Frontend tests cover session typing for demo users where applicable. Manual verification uses synthetic data only.

References: [architecture](../architecture.md), [first usable diary](first-usable-diary.md), [workflow](../agents/workflow.md).