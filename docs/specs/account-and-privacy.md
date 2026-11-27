# Account and Privacy

Status: Complete.

## Goal and Scope

Real accounts require explicit consent to store health entries under the in-app privacy notice. Users can read that notice during registration and from the diary. Account deletion withdraws consent and removes the user's account and diary from the active database.

Demo sessions are started without this registration flow; they do not offer account deletion. [Admin-assisted password recovery](password-recovery-admin.md) is the supported reset path (no automated email). Export/self-service download and re-consent flows for existing users after a policy change are out of scope.

## Acceptance Criteria

| ID | Observable outcome |
|---|---|
| AP1 | Creating a real account requires an explicit health-data consent affirmation. Registration without consent does not create a user. |
| AP2 | Creating a real account requires the privacy policy version the server currently accepts. Omitted, stale, or unknown versions are rejected with no user created. Successful registration records consent time and the accepted version on the user. |
| AP3 | Prospective and signed-in users can open in-app privacy information from registration and the diary. The notice shows the current policy version shown to new users. |
| AP4 | A signed-in real-account user can delete their account with password confirmation and CSRF. Correct confirmation removes their user and diary entries, ends the session, and does not change another user's data. Wrong passwords are rejected without deletion. |
| AP5 | When the privacy policy version changes, the backend registration validator and the frontend registration payload and displayed version are updated together so only the new version is accepted for new sign-ups. Privacy copy is updated when the policy meaning changes. |

## Delivery and Verification

`PrivacyTests` in `accounts.tests` covers consent, version rejection, deletion, and isolation. Registration UI requires the consent checkbox and sends the frontend `privacyVersion` with sign-up. Manual checks use synthetic accounts only.

### Privacy version bump (maintainers)

1. Set `PRIVACY_POLICY_VERSION` in `backend/accounts/views.py`.
2. Set `privacyVersion` in `frontend/src/PrivacyNotice.tsx` to the same value.
3. Revise privacy modal text when users need to see new information.
4. Update synthetic expectations in `PrivacyTests` and any other tests that pin the version string.

References: [architecture](../architecture.md), [first usable diary](first-usable-diary.md), [demo mode](demo-mode.md), [workflow](../agents/workflow.md).