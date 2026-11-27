# Development Workflow

This repo uses a **three-layer** agent workflow. Layers 1–2 are in git; Matt Pocock skills install locally (see [Skills](#skills)). **`review-pr`** is committed in git (GitHub publication).

| Layer | What | Where |
| ----- | ---- | ----- |
| 1. Process | What agents do, in order | [`AGENTS.md`](../../AGENTS.md) (entry) → this file (steps) |
| 2. CI | Lint, tests, build | `.github/workflows/checks.yml` |
| 3. Review | Standards + spec; history on GitHub | [`reviews.md`](reviews.md), [`review-pr`](../../.agents/skills/review-pr/SKILL.md) |

Issue tracker, triage labels, and domain docs: `docs/agents/issue-tracker.md`, `triage-labels.md`, `domain.md`.

## Planning and intake

1. **`/triage`** on GitHub issues ([`triage`](../../.agents/skills/triage/SKILL.md)).
2. **`/to-spec`** or **`/to-tickets`** for agent-ready work ([`to-spec`](../../.agents/skills/to-spec/SKILL.md), [`to-tickets`](../../.agents/skills/to-tickets/SKILL.md)).
3. Larger milestones: keep specs in `docs/specs/` and link them from the issue or PR.
4. Use [`GLOSSARY.md`](../../GLOSSARY.md) vocabulary; see [`domain.md`](domain.md).

Agree acceptance criteria once. Record product answers in the issue or spec. Do not change requirements to make review pass.

## Implementation loop (Matt Pocock skills)

Run Matt skills from `.agents/skills/` after [installing](#skills) them.

1. **Branch** — Task branch; reuse for the same task.
2. **`/implement`** or **`/implement-spec`** — [`implement`](../../.agents/skills/implement/SKILL.md), [`implement-spec`](../../.agents/skills/implement-spec/SKILL.md). Prefer **`/tdd`** ([`tdd`](../../.agents/skills/tdd/SKILL.md)) at agreed seams. Read [`CODING_STANDARDS.md`](../../CODING_STANDARDS.md) first.
3. **Checks** — Run [README](../../README.md) commands for every touched area. Report gaps honestly.
4. **`/code-review`** — Compare `main...HEAD` ([`code-review`](../../.agents/skills/code-review/SKILL.md)). Fix or defer findings; re-run after material changes.
5. **`/pr`** — PR body ([`pr`](../../.agents/skills/pr/SKILL.md)). Link the issue or spec. Update docs in the same PR when behavior or setup changes.
6. **Push** — Open or update the PR; CI (layer 2) runs on GitHub.
7. **`review-pr`** — On the open PR, run the committed [`review-pr`](../../.agents/skills/review-pr/SKILL.md) skill to post **Standards** and **Spec** reviews to GitHub (see [reviews.md](reviews.md)).

Honor narrower limits (no-commit, no-push) when given.

## Merge

Agents never merge, enable auto-merge, or push to `main`. The owner merges when:

- Layer 2 CI is green
- Layer 3 **[`review-pr`](../../.agents/skills/review-pr/SKILL.md)** has been run for the current head (required for feature work tied to a spec or issue; optional for trivial fixes — owner’s call)

Re-run **`review-pr`** after meaningful new commits.

## Skills

Matt Pocock skills are **not** vendored in git (except [`review-pr`](../../.agents/skills/review-pr/SKILL.md)). Install or refresh:

```sh
npx skills@latest add mattpocock/skills
```

Restore from the lockfile and environment setup: see [Skills in `AGENTS.md`](../../AGENTS.md#agent-skills).

Pin versions with [`skills-lock.json`](../../skills-lock.json) at the repo root.

## Concurrent work

Use separate worktrees for parallel implementation tasks.