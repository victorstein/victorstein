# Contributing rules

## Always use a PR — never merge to `main` directly

All changes land on `main` through a pull request. Do **not** push commits straight
to `main`, and do **not** merge a PR yourself (no `gh pr merge`, no fast-forward to
`main`). Open the PR and leave it for review/merge by the repo owner.

- Branch off `main`, commit there, and `gh pr create`.
- Stop after the PR is open. Report the PR URL; do not merge it.
- This applies to every change, including one-line fixes and workflow/CI edits.
