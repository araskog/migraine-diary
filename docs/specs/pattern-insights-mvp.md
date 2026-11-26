# Pattern Insights (Deterministic MVP)

Status: Step 1 (deterministic stats). LLM narrative and MCP chat remain out of scope.

## Goal and Scope

A signed-in user can open **Insights** and see descriptive statistics from **their own** diary entries: migraine status, date, sleep, sleep duration, pain severity, and medication taken.

Statistics use a rolling window ending on the user's **local today** (90 days by default). The calendar still treats a missing entry as **unrecorded**, not migraine-free. **Migraine share** uses calendar days in the window as the denominator; unrecorded days add no migraine days to the numerator. Optional fields contribute only on days where the user answered them.

A later step may add a short written summary at the top of Insights, generated from the same stats (not replacing them).

## Acceptance Criteria

| ID | Observable outcome |
|---|---|
| I1 | A signed-in user can open Insights and receive pattern statistics for their own entries only. |
| I2 | Unauthenticated requests and another user's session cannot read insights. |
| I3 | The user sees window summary counts (calendar, recorded, unrecorded, migraine, migraine share) and a clear signal when too few days are recorded to trust detailed breakdowns. |
| I4 | The user can compare patterns by weekday, sleep duration, and sleep quality, with enough context to judge whether a comparison has too few logged answers. |
| I5 | The user sees an average pain level for migraine days where pain was logged (step 1: one window-level average, not grouped by other fields). |
| I6 | Detailed breakdowns stay hidden until enough days are recorded; comparisons with too few answers are visually de-emphasized. |

## Capabilities

| Surface | What the user (or client) can rely on |
|---|---|
| **Insights API** | Authenticated read of pattern statistics for the signed-in user, scoped to the rolling window, with `today` computed from a supplied IANA timezone; responses are private and not cached. |
| **Insights UI** | Calendar / Insights toggle; window migraine summary; medication-taken day count; migraine and pain summary cards; weekday and sleep breakdowns when data is sufficient. |

## Delivery and Verification

Backend tests cover computation, auth, thresholds, and timezone boundaries. Frontend tests cover API response validation. Manual checks may use the demo account with varied synthetic entries.

References: [architecture](../architecture.md), [glossary](../../GLOSSARY.md), [coding standards](../../CODING_STANDARDS.md).