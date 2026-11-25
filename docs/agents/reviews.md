# Code reviews

Reviews are **layer 3** of the workflow: deterministic CI (layer 2) catches format, lint, and tests; **`/code-review`** catches standards and spec fit.

## `/code-review` (Standards + Spec)

The Matt Pocock [`code-review`](../../.agents/skills/code-review/SKILL.md) skill runs **two parallel sub-agents** on `git diff main...HEAD` (or another fixed point you pin):

| Axis | Question |
| ---- | -------- |
| **Standards** | Does the diff follow `CODING_STANDARDS.md` and repo conventions? |
| **Spec** | Does the diff match the linked issue, `docs/specs/`, or PR-agreed behavior? |

**When to run**

- **Before opening a PR** — `/implement` ends by calling `/code-review`; do this in the implementation agent session.
- **Before merge on non-trivial work** — any PR with an issue or spec link.
- **After fixes** — re-run when the diff meaningfully changes.

Post findings in the PR (summary or inline comments). Separate **Standards** and **Spec** sections in the report so merge decisions stay clear.

## CI (layer 2)

GitHub Actions **`Checks`** is not a review; it is a hard gate (format, lint, test, build). Do not claim tests passed without CI or documented local runs in the PR.
