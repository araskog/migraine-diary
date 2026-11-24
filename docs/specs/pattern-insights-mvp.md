# Pattern Insights (Deterministic MVP)

Status: Step 1 (deterministic stats) implemented. LLM narrative and MCP chat remain out of scope.

## Goal and Scope

A signed-in user can view descriptive pattern statistics computed from their own diary entries. Insights use existing diary fields only: status, date, sleep, sleep duration, pain severity, and medication taken. No LLM, chat, or MCP tools are included.

Statistics cover a rolling window ending on the user's local today (90 days by default). Missing diary dates are excluded; they never count as migraine-free. Optional detail fields contribute only on days where the user answered them.

## Acceptance Criteria

| ID | Observable outcome |
|---|---|
| I1 | A signed-in user can open an Insights view and receive pattern statistics for their own entries only. |
| I2 | Unauthenticated requests and another user's session cannot read insights. |
| I3 | The response states the window, counts of recorded and migraine days, and flags `insufficient_data` when recorded days in the window are below the minimum threshold (10). |
| I4 | Weekday, sleep duration, sleep quality, and medication slices include sample sizes and flag slices below the minimum threshold (3 days). |
| I5 | Pain severity averages appear only on migraine days with a pain answer, grouped where sleep or medication answers exist. |
| I6 | The UI presents the statistics with a non-medical disclaimer and hides or downplays comparisons marked insufficient. |

## API

`GET /api/diary/insights/?timezone=<IANA>`

Requires authentication. Validates timezone like diary saves. Computes `today` in that timezone. Returns JSON with `schema_version`, `window_days`, `today`, coverage counts, summary for the window, weekday breakdown, categorical slices, and pain averages. Responses are not cached (`Cache-Control: no-store, private`).

## Delivery and Verification

Backend unit tests cover computation, thresholds, isolation, and timezone boundaries. Frontend tests cover response validation. Manual verification uses the demo account, which includes varied synthetic entries.

References: [architecture](../architecture.md), [glossary](../../GLOSSARY.md), [coding standards](../../CODING_STANDARDS.md).