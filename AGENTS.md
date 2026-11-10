# Repository Guidelines

## Project and Navigation

Migraine Diary tracks migraine days. The runnable local foundation lives in `frontend/` (React/TypeScript/Vite) and `backend/` (Django REST Framework/PostgreSQL). See [README](README.md) for verified setup and checks. Account access is implemented; password recovery and diary recording are not implemented yet.

- Before starting work, read the [workflow](docs/agents/workflow.md) for agent roles, attribution, scope, delivery, and review rules. For committed PR reviews, use the [review-pr skill](.agents/skills/review-pr/SKILL.md).
- For structure, dependency, or interface design decisions, read the [architecture](docs/architecture.md).
- When writing or reviewing code, read the [coding standards](CODING_STANDARDS.md).
- When defining behavior or tests, read the relevant specification and [glossary](GLOSSARY.md).
- The initial milestone is [First Usable Diary](docs/specs/first-usable-diary.md).

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
- [Matt Pocock: writing for agents](https://github.com/mattpocock/skills/blob/main/skills/productivity/writing-for-agents/SKILL.md)
