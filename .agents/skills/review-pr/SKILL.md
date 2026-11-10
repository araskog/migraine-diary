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

- **Code Reviewer Agent:** follow the Standards role in the workflow. Compare implementation with committed coding standards and relevant official guidance. Investigate concrete bugs, authorization mistakes, maintainability problems, unnecessary configuration, and duplicated documentation. Use naming, duplication, coupling, speculative abstractions, and unnecessary indirection as questions to investigate, not automatic refactoring requirements. Inspect automated-check coverage and results rather than repeating formatter output.
- **Quality Reviewer Agent:** follow the Requirements role. Map agreed behavior to implementation and meaningful tests. Look for missing acceptance criteria, incorrect behavior, scope expansion, isolation failures, date boundaries, failure paths, and unsupported verification claims as applicable. Do not conduct a second style review or invent product requirements.

## Report and follow up

Keep reports separate, headed with the exact role name. Each includes reviewed commit IDs, sources actually checked, findings, and verification gaps. A finding gives a file/line, evidence, consequence, and applicable rule or requirement. Distinguish defects, clarification questions, and optional suggestions. Prioritize by actual impact. Missing agreed checks or regression coverage required by repository standards are actionable findings; other unverified behavior is a gap, not proof of a bug. There is no finding quota: report no findings when justified, without hiding gaps or claiming perfection.

Publish reports only within the agreed task authorization, disclosing coordinator publication as required by the workflow. The Builder addresses findings in focused commits. On corrections or changed base/head, record the new IDs, inspect the updated diff, rerun affected checks, and request rechecks of findings and newly affected behavior. Do not carry approval forward to unreviewed changes. Escalate unresolved disagreements to the owner; never merge.

## Source

Adapted from [Matt Pocock's code-review skill](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/code-review/SKILL.md). We use GitHub PR requirements instead of his issue-tracker setup and retain this repository's roles and delivery rules.
