# Password recovery (admin-assisted)

Status: Complete.

## Goal and scope

A signed-out user who forgot their password can ask for help without automated email. The app records the request (or shows the same confirmation without persistence if only UI is shipped). A maintainer verifies identity out of band, sets a new password in Django Admin, and delivers it through a secure channel. There is no self-service reset link and no mail provider requirement.

Demo accounts do not use this flow. In-app “change password while signed in” remains out of scope.

## Acceptance criteria

| ID | Observable outcome |
|---|---|
| PR1 | On sign-in, a user can open password recovery, submit an email address with CSRF, and always see the same generic confirmation. Invalid email format is rejected with validation errors, not the generic confirmation. |
| PR2 | Submitting an email that does not belong to an account still returns the same generic confirmation as for a registered email (no account enumeration). |
| PR3 | Recovery requests are listed for staff in Django Admin (email and time). Maintainer password change continues to hash the password and revoke existing app sessions (`test_admin_password_change_hashes_password_and_revokes_member_session`). |
| PR4 | Recovery UI matches account form layout on mobile-sized screens and does not promise an automated email. |

## Maintainer runbook

1. Open **Password recovery requests** in `/admin/` (or the agreed support channel if UI-only).
2. Confirm the request plausibly matches the account owner (out-of-band verification—policy is maintainer judgment).
3. **Users** → search by email → **change password** (Django admin password form).
4. Deliver the new password securely (not in GitHub, logs, or the app UI).
5. User signs in with the new password; prior sessions no longer access the diary.

## Delivery and verification

`PasswordRecoveryTests` in `accounts.tests` covers generic responses and validation. Frontend unit tests cover the recovery API client. Manual checks use synthetic emails only.

References: [account and privacy](account-and-privacy.md), [first usable diary](first-usable-diary.md), [architecture](../architecture.md).