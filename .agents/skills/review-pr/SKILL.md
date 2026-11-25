---
name: review-pr
description: Review an open GitHub PR using Matt Pocock's Standards + Spec axes, then publish two separate GitHub pull request reviews with inline comments. Use for PR review, rechecks after new commits, and before merge. Not for uncommitted working-tree-only review.
---

# Review a PR on GitHub

Read `AGENTS.md`, `docs/agents/workflow.md`, and `docs/agents/reviews.md` at the PR head revision. This skill coordinates **analysis** (Matt `code-review` axes) and **publication** (GitHub). It does not authorize merging or editing the repo beyond posting reviews.

## 1. Pin the PR and diff

1. Resolve the PR (`gh pr view <number>` or the branch's open PR). Record **base** and **head** SHAs from `gh pr view <number> --json baseRefOid,headRefOid`.
2. Inspect `git diff <base>...<head>` (three-dot) and `git log <base>..<head> --oneline`. Use only **committed** changes; if the diff is empty, stop.
3. Collect CI status for the head (`gh pr checks <number>` or check runs). Note what was not verified.

## 2. Run Matt `code-review` (analysis only)

Follow the vendored [`code-review`](../code-review/SKILL.md) skill through its analysis steps (pin fixed point = PR base, identify spec source, identify standards sources, spawn **Standards** and **Spec** sub-agents in parallel with fresh contexts, aggregate under `## Standards` and `## Spec`).

Sub-agents must not see each other's reports or implementation chat. Reviewers are read-only (no project file edits).

If `code-review` is not installed, tell the user to run `npx skills@latest add mattpocock/skills`.

## 3. Prepare two GitHub review bodies

Keep reports separate:

| GitHub review title | Axis | Skill sub-agent |
| ------------------- | ---- | --------------- |
| **Standards** | Coding standards, smells, docs consistency | Standards |
| **Spec** | Issue / spec / PR acceptance criteria | Spec |

For each axis:

- Heading: axis name, scope, and short `base`/`head` SHAs.
- Summary ≤ ~60 words, or "No findings."
- One limitations line only for material verification gaps.
- Each finding: file path, line (on the **head** side of the diff), problem, consequence, cited rule or spec line.
- Distinguish defects from optional suggestions.

## 4. Publish to GitHub

Publish **two** pull request reviews on the same PR (Standards first, then Spec), per [reviews.md](../../../docs/agents/reviews.md#publish-to-github).

- Put actionable items on the **correct diff line** as review comments where possible.
- Put findings that cannot be anchored inline in that review's body.
- Choose `COMMENT`, `REQUEST_CHANGES`, or `APPROVE` per review based on findings (`APPROVE` only when that axis has no unresolved defects).
- If the token cannot post reviews, state the limitation in chat; do not claim they were published.

Never merge. Do not request auto-merge.

## 5. Follow-up

After new commits on the PR, repeat from step 1 with updated SHAs. Do not treat an old review as approval for new diff. Builders reply on threads with fix commits or deferral reasons; resolve threads per team practice.

Adapted from [Matt Pocock's code-review skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md).
