# Repository Guidelines

## Project and Navigation

Migraine Diary tracks migraine days. The application lives in `frontend/` (React/TypeScript/Vite) and `backend/` (Django REST Framework/PostgreSQL). See [README](README.md) for verified setup and checks.

- Read the [workflow](docs/agents/workflow.md) for the full agent process (plan → implement → review → PR → merge).
- Read [reviews](docs/agents/reviews.md) for **`/code-review`** (local) and **[`review-pr`](.agents/skills/review-pr/SKILL.md)** (publish Standards + Spec to GitHub).
- Install Matt Pocock skills locally: `npx skills@latest add mattpocock/skills` (pinned in `skills-lock.json`).
- **Skills (local install):** [`implement`](.agents/skills/implement/SKILL.md), [`tdd`](.agents/skills/tdd/SKILL.md), [`code-review`](.agents/skills/code-review/SKILL.md), [`pr`](.agents/skills/pr/SKILL.md); intake: [`triage`](.agents/skills/triage/SKILL.md), [`to-spec`](.agents/skills/to-spec/SKILL.md), [`to-tickets`](.agents/skills/to-tickets/SKILL.md).
- **Skill (in git):** [`review-pr`](.agents/skills/review-pr/SKILL.md) — PR review history on GitHub.
- For structure and design, read [architecture](docs/architecture.md).
- For code style, read [coding standards](CODING_STANDARDS.md).
- For behavior and tests, read the relevant [specification](docs/specs/) and [glossary](GLOSSARY.md).
- Shipped milestones include [First Usable Diary](docs/specs/first-usable-diary.md), [Diary details](docs/specs/diary-details.md), [Account and privacy](docs/specs/account-and-privacy.md), and [Demo mode](docs/specs/demo-mode.md). Planned work includes [Expanded diary fields](docs/specs/expanded-diary-fields.md).

README covers setup and checks; AGENTS.md provides repository context; specifications define agreed behavior; PR descriptions cover the problem, final behavior, and scope. Commit messages and review comments hold rationale, verification results, and review follow-ups. Avoid duplicating these sources.

## Working Rules

Use English for repository content and Conventional Commits, such as `feat(diary): record migraine days`.

Keep changes within the agreed task. Ask the user about unresolved product decisions before implementing affected behavior, then record agreed answers in the specification.

Never push directly to `main`. Agents never merge PRs or enable auto-merge; the owner performs merges.

Never include secrets or real health data in repository files, logs, screenshots, issues, or PRs. Use synthetic development data.

## Verification and Guidance

Check relevant official guidance when changing tools, frameworks, or agent workflows. Cite guidance actually checked and explain deliberate departures.

Agree test boundaries per feature. Completion requires acceptance criteria and required checks to pass, and review findings to be resolved or explicitly accepted by the owner. Report unavailable checks and remaining limitations; do not claim they passed.

Keep this guide current as the repository develops. Use these sources when changing agent instructions:

- [OpenAI best practices](https://learn.chatgpt.com/docs/learn/best-practices)
- [OpenAI AGENTS.md guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Writing for agents](https://github.com/mattpocock/skills/blob/main/skills/productivity/writing-for-agents/SKILL.md)

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues in `araskog/migraine-diary`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles use GitHub label strings with the same names. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: root `GLOSSARY.md` and `docs/adr/` when present. See `docs/agents/domain.md`.