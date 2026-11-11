# Development Workflow

## Scope and Planning

Agree on the task and acceptance criteria once. Unless explicitly limited, delivery approval covers implementation, checks, commits, push, PR creation, review comments, and in-scope corrections. Ask about material scope changes, not routine implementation choices. Unrelated installations, deployment, and spending require separate agreement.

For small changes, put agreed requirements in the PR description. For larger features, maintain a specification in `docs/specs/` and link the relevant criteria from each PR. Ask product questions in chat and record the agreed answers. Do not change requirements to make an implementation pass review.

Agree on important test boundaries per feature. Use a short plan for bounded tasks; a detailed execution plan is useful only when complexity warrants it. Concurrent implementation tasks use separate worktrees to avoid overwriting each other's work.

## Delivery

1. Work on a task branch. Reuse the branch for its existing task.
2. One implementation agent reads the coding standards before writing code, implements only the approved increment, runs required checks, reports results, and stops when that increment is complete.
3. Prefer small, focused commits, each representing one coherent change, so reviewers can follow the work. Keep related code and tests together and avoid mixing unrelated changes. Use Conventional Commits, push, and open a PR. The PR description covers the problem, final behavior, scope, and requirements or spec link. Put test results and review follow-ups in commit messages and review comments. Attach screenshots to the PR for UI changes; do not commit screenshot files. Verify attachments render in the PR and report any missing attachment as incomplete.
4. Use the [review-pr skill](../../.agents/skills/review-pr/SKILL.md) for the two independent reviews, PR comments, and correction rechecks.
5. Present checks and both review reports. The owner decides and performs the merge. Agents never merge, enable auto-merge, bypass branch protections, or push directly to `main`.

Honor narrower task limits, including no-commit or no-push instructions.

## Agent Roles

### Builder Agent

Implements approved changes, writes and updates tests, follows repository conventions and coding standards, and runs required checks. Documents changes and verification in commit messages and review comments, keeping the PR description focused on final behavior and scope. Addresses review findings and stops after the approved increment.

### Reviewers

The [review-pr skill](../../.agents/skills/review-pr/SKILL.md) defines the Code Reviewer Agent and Quality Reviewer Agent responsibilities and review procedure.

## Attribution

Builder commits use the Git name `Builder Agent` and the repository's existing commit email, applied per commit. Do not change global Git settings or rewrite earlier commits. Reviewers remain read-only and do not create commits.

Git author metadata does not change the account authenticating pushes or GitHub comments. With the current connection, those actions use the owner's GitHub account. Head review reports with the exact reviewer role name and identify when the coordinating agent publishes another agent's report. Distinct GitHub actors require separately authorized accounts or a GitHub App; do not claim that role labels create separate accounts.
