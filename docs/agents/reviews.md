# Code reviews

Reviews are **layer 3** of the workflow: CI (layer 2) runs in GitHub Actions; **Matt `code-review`** plus this repo’s **[`review-pr`](../../.agents/skills/review-pr/SKILL.md)** skill record review history on the PR.

| When | Skill | Output |
| ---- | ----- | ------ |
| During implementation (pre-push) | [`code-review`](../../.agents/skills/code-review/SKILL.md) | Chat report; fix before opening the PR |
| Open PR, before merge / after fixes | [`review-pr`](../../.agents/skills/review-pr/SKILL.md) | **Two GitHub PR reviews** (Standards + Spec) |

## `/code-review` (Standards + Spec)

Matt Pocock’s skill runs **two parallel sub-agents** on `git diff main...HEAD` (or another pinned base):

| Axis | Question |
| ---- | -------- |
| **Standards** | Does the diff follow `CODING_STANDARDS.md` and repo conventions? |
| **Spec** | Does the diff match the linked issue, `docs/specs/`, or PR-agreed behavior? |

Run before opening a PR, after meaningful fixes, and whenever you need a report without publishing to GitHub.

## `review-pr` (publish to GitHub)

The committed [`review-pr`](../../.agents/skills/review-pr/SKILL.md) skill:

1. Pins the PR base and head SHAs.
2. Runs the same **Standards** and **Spec** analysis as `code-review`.
3. Posts **two separate GitHub pull request reviews** so humans and later agents can read history on the PR.

Required before merge for non-trivial work (issue or spec link), and after any push that addresses prior review comments.

### Publish to GitHub

Use the PR head **commit SHA** (`headRefOid` from `gh pr view`).

**Inspect the diff for line anchors**

```sh
gh pr diff <number>
# or
git diff <base-sha>...<head-sha>
```

**Submit one axis** (repeat for Standards, then Spec):

Prefer a single review submission per axis with inline comments. Example using the GitHub API (`gh`):

```sh
gh api \
  --method POST \
  repos/araskog/migraine-diary/pulls/<PR_NUMBER>/reviews \
  -f commit_id='<HEAD_SHA>' \
  -f event='COMMENT' \
  -f body='## Standards

<base-sha>..<head-sha>

Summary…' \
  -f 'comments[][path]=path/to/file.ts' \
  -f 'comments[][line]=42' \
  -f 'comments[][side]=RIGHT' \
  -f 'comments[][body]=Finding…'
```

Add one `comments[]` entry per inline finding (path, **line on the new file**, `side=RIGHT`, body). Findings without a stable line go in `body` only.

**Events**

- `COMMENT` — feedback without blocking
- `REQUEST_CHANGES` — unresolved defects on that axis
- `APPROVE` — only when that axis has no unresolved defects

If inline submission fails (permissions, line mismatch), fall back to `gh pr review <number> --comment --body-file <file>` for that axis and note missing inlines in the body.

**Check reviews on the PR**

```sh
gh pr view <number> --comments
gh api repos/araskog/migraine-diary/pulls/<PR_NUMBER>/reviews
```

## CI (layer 2)

GitHub Actions **Checks** is a hard gate (format, lint, test, build). Do not claim tests passed without CI or documented local runs in the PR.