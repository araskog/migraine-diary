# Expanded Diary Fields

Status: Planned. Deliver in **Phase A → Phase B → Phase C** increments; each PR links to the criteria it implements.

## Goal and Scope

A user can record richer information on **recorded days** without losing the distinction between **missing entries** and **migraine-free days**. Optional fields use progressive disclosure and autosave so logging stays lightweight. Structured data should later support pattern analysis; dashboards, triggers, and reporting are out of scope until a follow-on milestone.

**Recorded day rules (unchanged):** only a saved migraine or migraine-free status creates a diary entry. Optional details never exist on unrecorded dates. Clearing an entry removes its status and all details.

| Phase | Focus |
|-------|--------|
| **A** | Migraine days: symptom catalog, stress, personal note; keep existing pain and acute medication fields |
| **B** | Migraine-free days: wellness block; tracking preferences (menstruation); cycle fields when enabled |
| **C** | Structured treatment log per date; replace simple acute medication fields |

See [Symptom catalog](#symptom-catalog) for the fixed v1 list.

## Acceptance Criteria — Phase A

| ID | Observable outcome |
|---|---|
| EA1 | On a **migraine day**, a user can select zero or more symptoms from the fixed catalog, grouped as in the product design. Selections autosave and persist after reload. |
| EA2 | The backend accepts only valid catalog codes for that migraine entry. Invalid codes are rejected without overwriting previously saved symptoms. |
| EA3 | Changing a date to **migraine-free** clears saved symptoms (and pain severity per existing rules). Changing back does not restore prior symptom selections unless the user selects them again. |
| EA4 | On a **migraine day**, a user can optionally set **stress** (0–10 integer) or leave it unanswered. `0` is an explicit answer, distinct from unanswered. |
| EA5 | On a **recorded migraine day**, a user can optionally enter a **personal note** (plain text, max 2 000 characters). Empty means no note. |
| EA6 | Symptom, stress, and note edits use the same autosave, failure, and unsaved-change behaviour as existing diary details. Saving optional fields does not reload the whole diary list. |
| EA7 | Another user cannot read or change these fields via the API. |

## Acceptance Criteria — Phase B

| ID | Observable outcome |
|---|---|
| EB1 | On a **migraine-free day**, the UI shows **wellness** controls (sleep quality, sleep duration, stress, personal note) and does not show symptoms, pain severity, or acute medication controls. |
| EB2 | Wellness fields remain optional. Unanswered fields do not imply a negative answer. Invalid values are rejected without corrupting saved answers. |
| EB3 | A user can open **Tracking preferences** from the account menu and turn **menstruation tracking** on or off. When off, cycle fields are hidden on all dates. |
| EB4 | When menstruation tracking is on, each **recorded day** (migraine or migraine-free) can optionally record **on period** (yes, no, or unknown) and optional **cycle day** (positive integer). Unanswered remains valid. |
| EB5 | The app may offer an optional, dismissible hint to enable menstruation tracking after the user saves their first diary entry; it does not block diary use. |
| EB6 | Demo sessions follow the same validation, ownership, and CSRF rules for new fields. |

## Acceptance Criteria — Phase C

| ID | Observable outcome |
|---|---|
| EC1 | On a **migraine day**, a user can add zero or more **treatment records** on that diary date, each with medication name, dose (optional text), time taken (optional local time), effect after two hours (fixed choices), and whether migraine returned within 24 hours (yes / no / unknown). |
| EC2 | Treatment records autosave, persist across reload, and belong only to the owning user and date. |
| EC3 | Phase C **replaces** the simple acute “medication taken + name” fields on migraine days with the treatment log. Existing saved values migrate to at least one treatment record or equivalent without data loss for synthetic and development accounts. |
| EC4 | Invalid treatment payloads are rejected without corrupting saved records. |

## Out of scope (this milestone)

- Custom or user-defined symptoms; editing the catalog without a deliberate release
- **Daily life impact** chips (for example missed work) — planned after core fields; use fixed multi-select on migraine days, not a numeric slider
- **Preventive medication** schedules — future **user-level** settings (not per-day fields in Phases A–C)
- Correlation analysis, reports, export beyond existing API access
- Changes to missing-entry calendar semantics or password recovery

## Testing seams

Prefer end-to-end diary entry persistence through the existing authenticated diary API, plus account preference APIs for menstruation tracking. Extend `diary.tests` for validation, ownership, status transitions, and catalog enforcement; extend account tests for preferences. Browser checks only where layout or autosave stability needs them.

## Verification

Backend tests cover persistence, validation, privacy, and status-transition clearing. Manual verification uses synthetic accounts only.

References: [architecture](../architecture.md), [first usable diary](first-usable-diary.md), [demo mode](demo-mode.md), [glossary](../../GLOSSARY.md), [coding standards](../../CODING_STANDARDS.md), [workflow](../agents/workflow.md).

## Symptom catalog

Stable codes (v1) and group labels. UI shows labels; API stores codes.

### Pain characteristics

`throbbing`, `pressure`, `stabbing`, `one_sided`, `both_sides`, `neck_pain`

### Sensory symptoms

`light_sensitivity`, `sound_sensitivity`, `smell_sensitivity`, `visual_aura`, `sensory_aura`

### Other symptoms

`nausea`, `vomiting`, `dizziness`, `brain_fog`, `fatigue`, `difficulty_speaking`

### Early warning signs

`yawning`, `food_cravings`, `neck_stiffness`, `mood_changes`, `frequent_urination`, `unusual_tiredness`

Future catalog changes version the list in code and require an explicit migration; they are not user-editable in v1.