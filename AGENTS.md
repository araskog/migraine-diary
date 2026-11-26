# Repository Guidelines

## How agents work

`AGENTS.md` is the entry point for every agent in this repo (Cursor, Cloud Agents, and others that read it). **All agents share one process** — the ordered steps live in [workflow](docs/agents/workflow.md); follow that file for implementation, review, and PRs. Read it at the start of those tasks; do not skip steps unless the user limits scope (for example, questions only, no PR).

When a named skill applies (`/implement`, `/tdd`, `/code-review`, `/pr`, intake skills, or **`review-pr`** on an open PR), read that skill’s [`SKILL.md`](.agents/skills/) and follow it.

## Project and Navigation

Migraine Diary tracks migraine days. The application lives in `frontend/` (React/TypeScript/Vite) and `backend/` (Django REST Framework/PostgreSQL). See [README](README.md) for verified setup and checks.

- [Workflow](docs/agents/workflow.md) — plan → implement → review → PR → merge (layer 1).
- [Reviews](docs/agents/reviews.md) — **`/code-review`** (local) and [`review-pr`](.agents/skills/review-pr/SKILL.md) (Standards + Spec on GitHub).
- [Architecture](docs/architecture.md), [coding standards](CODING_STANDARDS.md), [specifications](docs/specs/), [glossary](GLOSSARY.md).
- Shipped milestones include [First Usable Diary](docs/specs/first-usable-diary.md), [Diary details](docs/specs/diary-details.md), [Account and privacy](docs/specs/account-and-privacy.md), and [Demo mode](docs/specs/demo-mode.md). Planned work includes [Expanded diary fields](docs/specs/expanded-diary-fields.md) and [Diary insights narrative](docs/specs/diary-insights.md) (see [Pattern insights MVP](docs/specs/pattern-insights-mvp.md) for statistics).

README covers setup and checks; specifications define agreed behavior; PR descriptions cover the problem, final behavior, and scope. Commit messages and review comments hold rationale, verification results, and review follow-ups. Avoid duplicating these sources.

## Working Rules

Use English for repository content and Conventional Commits, such as `feat(diary): record migraine days`.

Keep changes within the agreed task. Ask the user about unresolved product decisions before implementing affected behavior, then record agreed answers in the specification.

Never push directly to `main`. Agents never merge PRs or enable auto-merge; the owner performs merges.

Never include secrets or real health data in repository files, logs, screenshots, issues, or PRs. Use synthetic development data.

## Verification and Guidance

Check relevant official guidance when changing tools, frameworks, or agent workflows. Cite guidance actually checked and explain deliberate departures.

Agree test boundaries per feature. Completion requires acceptance criteria and required checks to pass, and review findings to be resolved or explicitly accepted by the owner. Report unavailable checks and remaining limitations; do not claim they passed.

Keep this guide current as the repository develops. Use these sources when changing agent instructions:

- [OpenAI AGENTS.md guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md) — root `AGENTS.md` as the shared entry point; detailed process in linked docs.
- [OpenAI best practices](https://learn.chatgpt.com/docs/learn/best-practices)
- [Writing for agents](https://github.com/mattpocock/skills/blob/main/skills/productivity/writing-for-agents/SKILL.md)

## Agent skills

Matt Pocock skills install into `.agents/skills/` (gitignored; only [`review-pr`](.agents/skills/review-pr/SKILL.md) is committed). Pin versions in [`skills-lock.json`](skills-lock.json).

**Install or refresh:** `npx skills@latest add mattpocock/skills`, or restore from the lockfile: `npx skills@latest experimental_install -a cursor -y --frozen-lockfile`.

**Cloud Agents:** [`.cursor/environment.json`](.cursor/environment.json) runs the restore command during environment builds so every agent has the same skills on disk. Wire the environment to that file, or run the same command once in a fresh VM.

**In git:** [`review-pr`](.agents/skills/review-pr/SKILL.md) — PR review history on GitHub.

**After install:** [`implement`](.agents/skills/implement/SKILL.md), [`tdd`](.agents/skills/tdd/SKILL.md), [`code-review`](.agents/skills/code-review/SKILL.md), [`pr`](.agents/skills/pr/SKILL.md); intake: [`triage`](.agents/skills/triage/SKILL.md), [`to-spec`](.agents/skills/to-spec/SKILL.md), [`to-tickets`](.agents/skills/to-tickets/SKILL.md).

### Issue tracker

Issues and specs live as GitHub issues in `araskog/migraine-diary`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles use GitHub label strings with the same names. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: root `GLOSSARY.md` and `docs/adr/` when present. See `docs/agents/domain.md`.