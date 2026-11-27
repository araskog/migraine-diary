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

#### Cloud Agents (`gh` 403)

On Cursor Cloud Agent VMs, shell `gh` uses a restricted GitHub App installation token. Calls such as `gh api …/pulls/…/reviews`, `gh pr review`, and `gh pr comment` often return **403** (`Resource not accessible by integration`). That is expected; do not treat it as a misconfigured repo.

Publish layer-3 reviews with the agent **ManagePullRequest** tool instead (`post_comment` on the open PR):

1. Post **two** top-level comments on the PR — first **Standards**, then **Spec** — each with the axis heading, short `base`..`head` SHAs, summary, limitations, and the intended review event (`COMMENT`, `REQUEST_CHANGES`, or note “no blocking findings”).
2. For inline findings, call `post_comment` with `path`, `line`, and `side=RIGHT` (line on the **head** side of the diff). That creates review comments under the Cursor GitHub App.

Local runs with your own `gh` auth (personal OAuth) may still use the `gh api` flow below.

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

If inline submission fails (line mismatch) locally, fall back to `gh pr review <number> --comment --body-file <file>` for that axis and note missing inlines in the body.

On Cloud Agents, when `gh` returns **403** for review APIs, use **ManagePullRequest** `post_comment` as described above — do not claim reviews were published until those comments exist on the PR.

**Check reviews on the PR**

```sh
gh pr view <number> --comments
gh api repos/araskog/migraine-diary/pulls/<PR_NUMBER>/reviews
```

## CI (layer 2)

GitHub Actions **Checks** is a hard gate (format, lint, test, build). Do not claim tests passed without CI or documented local runs in the PR.