# Demo Mode

Status: Complete.

## Goal and Scope

Visitors can open Migraine Diary with a populated sample diary, edit entries to see calendar and detail updates work, and sign out when they want a real account. Each visitor receives an isolated demo session; there is no shared global demo account.

A real account is always created from scratch on the sign-in screen and starts with an empty diary. Demo edits are not carried over.

Password recovery is out of scope for this feature. Hosting and performance work remain unchanged.

## Acceptance Criteria

| ID | Observable outcome |
|---|---|
| DM1 | From the account entry screen, a visitor can start a demo without registering. The app opens the diary with sample entries visible on the calendar. |
| DM2 | The demo is clearly labeled in everyday language (demo account and sample diary), not as technical test data. |
| DM3 | A visitor can record, correct, clear, and edit details in the demo diary; changes persist while the same demo session remains active and after reload while still signed in. |
| DM4 | Starting demo creates a separate session per visitor; two browsers do not share one editable demo diary. |
| DM5 | Create account in the demo opens the normal registration form after sign-out. The new account starts with an empty diary; demo edits are not copied. |
| DM6 | Demo sessions cannot be reopened with email and password sign-in; visitors who sign out of a demo must start a new demo or create an account. |
| DM7 | Demo start and diary use enforce the same backend validation, ownership, and CSRF rules as existing account and diary endpoints. Another user cannot access a demo user's entries. |

## Verification

Backend tests in `accounts.test_demo_mode` cover demo start, sample seeding,
isolation, session persistence, and sign-in rejection for demo accounts. Frontend tests cover session typing for demo users where applicable. Manual verification uses synthetic data only.

References: [architecture](../architecture.md), [first usable diary](first-usable-diary.md), [workflow](../agents/workflow.md).