# Development Workflow

## Scope and Planning

Agree on the task and acceptance criteria once. Unless explicitly limited, delivery approval covers implementation, checks, commits, push, PR creation, review comments, and in-scope corrections. Ask about material scope changes, not routine implementation choices. Unrelated installations, deployment, and spending require separate agreement.

For small changes, put agreed requirements in the PR description. For larger features, maintain a specification in `docs/specs/` and link the relevant criteria from each PR. Ask product questions in chat and record the agreed answers. Do not change requirements to make an implementation pass review.

Agree on important test boundaries per feature. Use a short plan for bounded tasks; a detailed execution plan is useful only when complexity warrants it. Concurrent implementation tasks use separate worktrees to avoid overwriting each other's work.

## Delivery

1. Work on a task branch. Reuse the branch for its existing task.
2. One implementation agent reads the coding standards before writing code, implements only the approved increment, runs required checks, reports results, and stops when that increment is complete.
3. Prefer small, focused commits, each representing one coherent change, so reviewers can follow the work. Keep related code and tests together and avoid mixing unrelated changes. Use Conventional Commits, push, and open a PR. Describe the problem, behavior changes, requirements or spec link, checks, and local testing steps. Include screenshots for UI changes.
4. Run the two independent reviews below against the committed PR changes. Give both reviewers the same base and head commit IDs and the source documents for that revision.
5. Publish findings as PR comments, identifying the review role and revision. Address findings, rerun affected checks, push corrections, and have reviewers recheck affected findings and changes. Record reasons for rejecting or deferring findings; refer unresolved disagreements to the owner.
6. Present checks and both review reports. The owner decides and performs the merge. Agents never merge, enable auto-merge, bypass branch protections, or push directly to `main`.

Honor narrower task limits, including no-commit or no-push instructions.

## Independent Review

Use two separate agents with fresh contexts, without inherited implementation discussion or the other reviewer's conclusions. Provide source material rather than the implementer's conclusions.

| Reviewer | Responsibility |
|---|---|
| Standards | Check correctness, security, maintainability, test quality, repository rules, and applicable official guidance. |
| Requirements | Check the PR requirements or linked specification for missing behavior, incorrect behavior, and scope expansion. |

Both reviewers read and compare the changes against the same committed coding standards. They receive the committed diff, relevant surrounding code, repository instructions, applicable requirements, and check evidence. They do not edit project files.

Review scope and simplicity: check for duplicate documentation, unnecessary configuration, and implementation notes that belong in the PR rather than stable specifications.

Keep reports separate. Each identifies the reviewed commits, sources checked, and verification gaps. Findings include a file location, evidence, consequence, and applicable rule or requirement. Distinguish defects from questions and optional suggestions; do not invent findings to meet a quota. Missing evidence is a gap, not a pass.

## Sources

Adapted from [Matt Pocock's code-review skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md): separate Standards and Requirements reviews with fresh contexts. Our delivery process adds post-push PR comments and owner-only merges.

See [OpenAI subagent guidance](https://learn.chatgpt.com/docs/agent-configuration/subagents) for delegation. This workflow describes the agreed process; no review automation is configured yet.
