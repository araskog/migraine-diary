# Development Workflow

## Scope and Planning

Agree on the task and acceptance criteria once. Unless explicitly limited, delivery approval covers implementation, checks, commits, push, PR creation, review comments, and in-scope corrections. Ask about material scope changes, not routine implementation choices. Unrelated installations, deployment, and spending require separate agreement.

For small changes, put agreed requirements in the PR description. For larger features, maintain a specification in `docs/specs/` and link the relevant criteria from each PR. Ask product questions in chat and record the agreed answers. Do not change requirements to make an implementation pass review.

Agree on important test boundaries per feature. Use a short plan for bounded tasks; a detailed execution plan is useful only when complexity warrants it. Concurrent implementation tasks use separate worktrees to avoid overwriting each other's work.

## Delivery

1. Work on a task branch. Reuse the branch for its existing task.
2. One implementation agent reads the coding standards before writing code, implements only the approved increment, runs required checks, reports results, and stops when that increment is complete.
3. Prefer small, focused commits, each representing one coherent change, so reviewers can follow the work. Keep related code and tests together and avoid mixing unrelated changes. Use Conventional Commits, push, and open a PR. The PR description covers the problem, final behavior, scope, and requirements or spec link. Put test results and review follow-ups in commit messages and review comments. Include screenshots for UI changes.
4. Run the two independent reviews below against the committed PR changes. Give both reviewers the same base and head commit IDs and the source documents for that revision.
5. Publish findings as PR comments, identifying the review role and revision. Address findings, rerun affected checks, push corrections, and have reviewers recheck affected findings and changes. Record reasons for rejecting or deferring findings; refer unresolved disagreements to the owner.
6. Present checks and both review reports. The owner decides and performs the merge. Agents never merge, enable auto-merge, bypass branch protections, or push directly to `main`.

Honor narrower task limits, including no-commit or no-push instructions.

## Agent Roles

### Builder Agent

Implements approved changes, writes and updates tests, follows repository conventions and coding standards, and runs required checks. Documents changes and verification in commit messages and review comments, keeping the PR description focused on final behavior and scope. Addresses review findings and stops after the approved increment.

### Code Reviewer Agent

The Standards role: independently checks implementation correctness, architecture, maintainability, code quality, security, test quality, repository conventions, and applicable official guidance. Compares changes against the committed coding standards and identifies bugs and justified improvements.

### Quality Reviewer Agent

The Requirements role: independently checks agreed PR requirements or the linked specification, acceptance criteria, missing or incorrect behavior, and scope expansion. Reviews test coverage and verification evidence, evaluates security, reliability and edge cases, and reports unresolved risks for the owner's decision. Coding-convention compliance belongs to the Code Reviewer Agent.

### Independent Review

Use two separate agents with fresh contexts, without inherited implementation discussion or the other reviewer's conclusions. Provide source material rather than the implementer's conclusions.

Both receive the committed diff, relevant surrounding code, repository instructions, their applicable source documents, and check evidence. They do not edit project files.

Review scope and simplicity: check for duplicate documentation, unnecessary configuration, and implementation notes that belong in the PR rather than stable specifications.

Keep reports separate. Each identifies the reviewed commits, sources checked, and verification gaps. Findings include a file location, evidence, consequence, and applicable rule or requirement. Distinguish defects from questions and optional suggestions; do not invent findings to meet a quota. Missing evidence is a gap, not a pass.

## Attribution

Builder commits use the Git name `Builder Agent` and the repository's existing commit email, applied per commit. Do not change global Git settings or rewrite earlier commits. Reviewers remain read-only and do not create commits.

Git author metadata does not change the account authenticating pushes or GitHub comments. With the current connection, those actions use the owner's GitHub account. Head review reports with the exact reviewer role name and identify when the coordinating agent publishes another agent's report. Distinct GitHub actors require separately authorized accounts or a GitHub App; do not claim that role labels create separate accounts.

## Sources

Adapted from [Matt Pocock's code-review skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md): separate Standards and Requirements reviews with fresh contexts, named Code Reviewer Agent and Quality Reviewer Agent here. Our delivery process adds post-push PR comments and owner-only merges.

See [OpenAI subagent guidance](https://learn.chatgpt.com/docs/agent-configuration/subagents) for delegation. This workflow describes the agreed process; no review automation is configured yet.
