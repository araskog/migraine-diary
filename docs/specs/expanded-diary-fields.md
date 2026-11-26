# Expanded Diary Fields

Status: Planned. Deliver in **Phase A → Phase B → Phase C** increments; each PR links to the criteria it implements.

## Problem

The diary captures status and a small set of optional details, but not enough of what matters day to day (symptoms, context, notes) to support personal review or future pattern analysis. Logging must stay optional and quick so it does not feel like a clinical form.

## Goal and Scope

A user can record richer information on **recorded days** without losing the distinction between **missing entries** and **migraine-free days**. Optional fields use **progressive disclosure** (collapsed sections, autosave, only status is required) so logging stays lightweight. Store structured data so a later milestone can analyse triggers and risk; dashboards, triggers, and reporting are out of scope here.

**Recorded day rules (unchanged):** only a saved migraine or migraine-free status creates a diary entry. Optional details never exist on unrecorded dates. Clearing an entry removes its status and all details.

| Phase | Focus |
|-------|--------|
| **A** | **Migraine days:** symptom catalog, personal note, and existing pain and acute medication and sleep fields. **Migraine-free days:** personal note only (prototype-style minimal details panel). **Stress is not in v1 UI** — deferred to Phase B with the wellness block. |
| **B** | Migraine-free **wellness** UI (sleep, sleep duration, **stress**, note); **Tracking preferences** (menstruation); cycle fields when enabled on any recorded day |
| **C** | Structured **treatment log** per migraine date; replace simple acute medication fields |

**Product design reference:** symptom chips use four grouped multi-select sections (pain characteristics, sensory, other, early warning signs) as in the Phase A design mockup ([PR #52](https://github.com/araskog/migraine-diary/pull/52)). Migraine-free v1 follows that prototype: status on the calendar plus an optional **personal note** in daily details, without sleep, medication, or symptom controls until Phase B.

The treatment log UI mockup informs Phase C.

See [Symptom catalog](#symptom-catalog) for the fixed v1 list.

### Phase A product decisions (issue #51)

| Topic | Decision |
|-------|----------|
| **Stress** | Out of **v1 UI**; first stress control ships with Phase B wellness on migraine-free days. |
| **Personal note** | Optional on **any recorded day** (migraine or migraine-free). |
| **Migraine-free UX** | Prototype-style **minimal** daily details: personal note only; no symptom, pain, sleep, or medication controls in Phase A. |

## Design and interaction

- Record **status** first; optional sections stay collapsed until opened.
- **Migraine day** sections include symptoms (chip multi-select), personal note, and existing pain, acute medication, and sleep fields. **No stress control in Phase A.**
- **Migraine-free day** in Phase A shows **personal note only** in daily details (same progressive “Add a personal note” pattern as migraine days). Phase B adds the full wellness block (sleep, duration, stress) and continues to hide symptom, pain, and acute medication controls.
- Detail edits **autosave** like existing diary details, with visible save failures and unsaved-leave warnings.
- Symptoms (including early warning signs) are recorded only while the day has **migraine** status; they are not offered on migraine-free days.

## Status changes

When a recorded date changes between migraine and migraine-free:

| Field | On change to migraine-free |
|-------|----------------------------|
| Symptoms | Cleared (not shown) |
| Pain severity | Cleared (existing rule) |
| Personal note | **Preserved** unless the user clears it |
| Sleep / cycle (when present) | **Preserved** in storage; Phase A migraine-free UI does not edit sleep until Phase B |
| Acute medication fields | **Preserved** until Phase C replaces them |
| Stress (when present) | **Preserved** once stored; no Phase A UI |

Changing back to migraine does **not** restore previously cleared symptoms or pain.

## Acceptance Criteria — Phase A

| ID | Observable outcome |
|---|---|
| EA1 | On a **migraine day**, a user can select zero or more symptoms from the fixed catalog, grouped in four sections matching the product design. Selections autosave and persist after reload. |
| EA2 | The backend accepts only valid catalog codes for that migraine entry. Invalid codes are rejected without overwriting previously saved symptoms. |
| EA3 | Changing a date to **migraine-free** clears saved symptoms and pain severity. Personal note remains unless the user clears it. Changing back to migraine does not restore prior symptom selections unless the user selects them again. |
| EA4 | On any **recorded day**, a user can optionally enter a **personal note** (plain text, max 2 000 characters). Empty means no note. |
| EA5 | On a **migraine-free day**, daily details offer **personal note only** (no Phase A stress, sleep, symptom, pain, or medication controls). |
| EA6 | Symptom and note edits use the same autosave, failure, and unsaved-change behaviour as existing diary details. Saving optional fields does not reload the whole diary list. |
| EA7 | Another user cannot read or change these fields via the API. |
| EA8 | Demo sessions can use Phase A fields under the same validation, ownership, and CSRF rules as real accounts. |

**Deferred from Phase A:** stress UI and API (moves to Phase B with wellness).

## Acceptance Criteria — Phase B

| ID | Observable outcome |
|---|---|
| EB1 | On a **migraine-free day**, the UI shows **wellness** controls (sleep quality, sleep duration, stress, personal note) and does not show symptoms, pain severity, or acute medication controls. |
| EB2 | Wellness fields remain optional. Unanswered fields do not imply a negative answer. Invalid values are rejected without corrupting saved answers. |
| EB3 | A user can open **Tracking preferences** from the account menu and turn **menstruation tracking** on or off. When off, cycle fields are hidden on all dates. |
| EB4 | When menstruation tracking is on, each **recorded day** (migraine or migraine-free) can optionally record **on period** (yes, no, or unknown) and optional **cycle day** (positive integer). Unanswered remains valid. |
| EB5 | The app may offer an optional, dismissible hint to enable menstruation tracking after the user saves their first diary entry; it does not block diary use. |
| EB6 | Demo sessions follow the same rules for Phase B fields as for real accounts. |
| EB7 | On any **recorded day**, a user can optionally set **stress** (0–10 integer) or leave it unanswered. `0` is an explicit answer, distinct from unanswered. |

## Acceptance Criteria — Phase C

| ID | Observable outcome |
|---|---|
| EC1 | On a **migraine day**, a user can add zero or more **treatment records** on that diary date, each with medication name, dose (optional text), time taken (optional local time), effect after two hours (pain-free, significant relief, some relief, no relief, not yet evaluated), and whether migraine returned within 24 hours (yes / no / unknown). |
| EC2 | Treatment records autosave, persist across reload, and belong only to the owning user and date. |
| EC3 | Phase C **replaces** the simple acute “medication taken + name” fields on migraine days with the treatment log. Existing saved values migrate to at least one treatment record or equivalent without data loss for synthetic and development accounts. |
| EC4 | Invalid treatment payloads are rejected without corrupting saved records. |

## Out of scope (this milestone)

- Custom or user-defined symptoms; editing the catalog without a deliberate release
- **Daily life impact** chips (for example missed work, left work early) — planned after core fields; fixed multi-select on migraine days, not a numeric slider
- **Preventive medication** schedules — future **user-level** settings (not per-day fields in Phases A–C)
- Correlation analysis, reports, export beyond existing API access
- Changes to missing-entry calendar semantics or password recovery

## Testing seams

Prefer end-to-end diary entry persistence through the existing authenticated diary API, plus account preference APIs for menstruation tracking. Extend `diary.tests` for validation, ownership, status transitions, and catalog enforcement; extend account tests for preferences. Browser checks only where layout or autosave stability needs them.

## Verification

Backend tests cover persistence, validation, privacy, and status-transition clearing. Manual verification uses synthetic accounts only.

References: [architecture](../architecture.md), [first usable diary](first-usable-diary.md), [demo mode](demo-mode.md), [glossary](../../GLOSSARY.md), [coding standards](../../CODING_STANDARDS.md), [workflow](../agents/workflow.md).

## Symptom catalog

Stable codes (v1) and group labels. UI shows labels; API stores codes. Early warning signs are recorded only on **migraine** days, with other symptoms.

### Pain characteristics

`throbbing`, `pressure`, `stabbing`, `one_sided`, `both_sides`, `neck_pain`

### Sensory symptoms

`light_sensitivity`, `sound_sensitivity`, `smell_sensitivity`, `visual_aura`, `sensory_aura`

### Other symptoms

`nausea`, `vomiting`, `dizziness`, `brain_fog`, `fatigue`, `difficulty_speaking`

### Early warning signs

`yawning`, `food_cravings`, `neck_stiffness`, `mood_changes`, `frequent_urination`, `unusual_tiredness`

Future catalog changes version the list in code and require an explicit migration; they are not user-editable in v1.