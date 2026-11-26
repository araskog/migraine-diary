# Diary Insights (narrative v1)

Status: Planned.

## Goal and Scope

A signed-in user can expand an **Insights** panel on the diary calendar and read short, plain-language observations derived from **their own** recorded migraine days and optional wellness details.

**v1 delivers:**

- Deterministic **ranked facts** computed in the browser from diary entries already loaded for the calendar.
- Optional **AI phrasing** via Cloudflare Workers AI on the Pages edge (`POST /api/insights/narrate/`), using only aggregated fact JSON (no personal notes, no medication names, no raw diary rows).
- **Template wording** whenever the user has too little data, the narrate endpoint is unavailable, free-tier limits apply, or the model returns invalid output.

The existing **Pattern insights** statistics view ([pattern-insights-mvp.md](pattern-insights-mvp.md)) remains available as a separate tab; this spec covers the calendar-panel assistant wording.

## Non-goals (v1)

- Conversational chat, user prompts, or MCP tools ([first-mcp-integration.md](first-mcp-integration.md)).
- Mining `personal_note` text or sending medication names to an LLM.
- Paid LLM APIs or full-diary model reasoning.
- Replacing deterministic stats with model-generated numbers.

## Data and thresholds

- Analyze **migraine days** only for pattern facts.
- Minimum migraine days before facts: **5** (`N_min`).
- At most **3** insight lines (`K`).
- Compound sleep-duration × weekday facts require at least **3** supporting days and **1.5×** lift over baseline weekday share.

Fields used: calendar date (weekday), `sleep_duration`, `sleep_quality`, `medication_taken` (when answered).

## LLM narration

| Item | Rule |
|---|---|
| Provider | Cloudflare Workers AI on [Pages `_worker.js`](../../frontend/public/_worker.js) |
| Auth | Valid session cookie; CSRF header on POST |
| Budget | Free tier only; per-session daily cap in the worker; client fingerprint cache |
| Fallback | Mandatory template sentences from the same facts |
| Privacy | UI disclosure; subprocessors include Cloudflare for aggregated narration |

## Acceptance Criteria

| ID | Observable outcome |
|---|---|
| DI1 | On the calendar view, a collapsible Insights panel is available while signed in. |
| DI2 | With fewer than five migraine days recorded, the panel explains that more migraine days are needed; no narrate request is sent. |
| DI3 | With enough data, the user sees up to three observations with a non-medical disclaimer. |
| DI4 | Template wording works without Workers AI (local Vite dev and narrate failures). |
| DI5 | When narrate succeeds in production, lines reflect only supplied facts (no new clinical claims); failure falls back to templates without breaking the page. |
| DI6 | Narrate requests include no personal notes or medication names; only structured fact objects. |
| DI7 | Insights update after diary saves without a full page reload. |
| DI8 | Demo sessions see insights from sample data under the same rules. |

## Delivery and Verification

- Frontend unit tests for fact extraction, ranking, templates, and fingerprinting.
- Worker unit tests for narrate routing, session gate, and fallback when AI is missing.
- Backend pattern-insights tests remain for the statistics tab.

References: [architecture](../architecture.md), [pattern-insights-mvp](pattern-insights-mvp.md), [glossary](../../GLOSSARY.md), [account and privacy](account-and-privacy.md), [workflow](../agents/workflow.md).