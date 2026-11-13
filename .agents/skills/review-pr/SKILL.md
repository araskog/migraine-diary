---
name: review-pr
description: Review committed Migraine Diary PR changes using independent Code Reviewer Agent and Quality Reviewer Agent reports. Use for PR reviews and rechecks; not for reviewing uncommitted work.
---

# Review a PR

Read `AGENTS.md` and `docs/agents/workflow.md` from the reviewed revision. Their scope, attribution, and delivery rules apply. This skill coordinates review; it does not authorize implementation, publication, or merging beyond the agreed task.

## Prepare a fixed review

1. Obtain the PR and resolve its base and head commit IDs. Alternatively, accept explicit committed base/head IDs for a local review. Record both IDs and inspect the three-dot diff and commit log. If commits are unavailable or the diff is empty, stop and explain; never substitute working-tree changes.
2. Identify the agreed requirements in the PR description or linked specification. Read applicable repository instructions, `CODING_STANDARDS.md`, and relevant surrounding code at the head revision. Identify applicable official guidance. Missing requirements or inaccessible sources are explicit gaps; ask for clarification where they prevent a useful review.
3. Collect check evidence for this head. Label supplied results as Builder evidence; distinguish them from checks a reviewer actually runs. Old results do not verify newer commits.

## Delegate two independent reviews

Start two separate agents with fresh contexts (`fork_turns: none`). Give each the same commit IDs, repository access, diff, surrounding code, instructions, applicable source documents, and check evidence. Do not pass implementation discussion, the Builder's conclusions, or the other reviewer's report. Reviewers must not edit project files. Safe checks may run in disposable copies; avoid changing shared databases or services.

- **Code Reviewer Agent:** check correctness, architecture, maintainability, code quality, security, test quality, and repository conventions against committed coding standards and applicable official guidance. Investigate concrete bugs, authorization mistakes, unnecessary configuration, duplicated documentation, and implementation notes that belong in PRs rather than stable specifications. Use naming, duplication, coupling, speculative abstractions, and unnecessary indirection as questions to investigate, not automatic refactoring requirements. Inspect automated-check coverage and results rather than repeating formatter output. Check affected documentation against the final diff and report stale, contradictory, or unsupported claims as findings.
- **Quality Reviewer Agent:** check agreed PR requirements or the linked specification, acceptance criteria, scope, test coverage, and verification evidence. Evaluate security, reliability, and edge cases; report unresolved risks. Map agreed behavior to implementation and meaningful tests. Look for missing acceptance criteria, incorrect behavior, scope expansion, isolation failures, date boundaries, failure paths, and unsupported verification claims as applicable. Do not conduct a second style review or invent product requirements.

## Report and follow up

Keep reports separate and concise. Use the exact reviewer role as the heading, followed by the review scope (code/standards or requirements) and short base/head commit IDs. State findings, or “No findings.” Target 60 words for the summary; put actionable details in inline comments. Add one short limitations line only for material unresolved verification gaps. Do not list routine sources, repeat CI results, or narrate the review process; still perform the required source and evidence checks.

Each finding gives a file/line, concrete problem and consequence, with the relevant rule or requirement where needed. Distinguish defects from questions or optional suggestions and prioritize by actual impact. Missing required checks are findings; other unverified behavior is not proof of a bug. Do not invent findings to meet a quota.

Submit each report as a GitHub review, with actionable findings as inline comments on the relevant diff lines. If a finding cannot be attached inline, include it in the review summary. Use the review outcome supported by the findings; if account restrictions prevent that outcome, report the limitation.

The Builder addresses findings in focused commits and replies directly to each specific comment with the fix commit and verification, or a reason for deferring or rejecting it. Resolve an inline thread only after reviewer confirmation. For summary findings without a reply thread, post a linked Builder response. On corrections or changed base/head, record the new IDs, inspect the updated diff, rerun affected checks, and request rechecks of findings and newly affected behavior. Do not carry approval forward to unreviewed changes. Record reasons for rejecting or deferring findings and escalate unresolved disagreements to the owner; never merge.

Adapted from [Matt Pocock's code-review skill](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/code-review/SKILL.md).
