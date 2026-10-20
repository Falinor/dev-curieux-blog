# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues on `Falinor/dev-curieux-blog`. Use the GitHub REST API through `gh api` for every operation: it works both locally and in Claude Code cloud sessions, where GraphQL-backed subcommands (`gh issue …`, `gh pr view`, `gh label list`) fail with HTTP 403. `R` below stands for `repos/Falinor/dev-curieux-blog`.

## Conventions

- **Create an issue**: write the body to a file, then `gh api $R/issues -f title="..." -F body=@body.md -f 'labels[]=<label>'`. The response's `number` is the `#number`; its `id` is the **database id** used by sub-issues and blocking.
- **Read an issue**: `gh api $R/issues/<n> --jq '{number, title, state, body, labels: [.labels[].name]}'`, plus comments with `gh api $R/issues/<n>/comments --jq '[.[].body]'`.
- **List issues**: `gh api "$R/issues?state=open&labels=<label>&per_page=100" --jq '[.[] | select(.pull_request | not) | {number, title, labels: [.labels[].name]}]'`. The issues endpoint also returns PRs, hence the `select`.
- **Make an issue a sub-issue of a parent**: `gh api --method POST $R/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>`. List children with `gh api $R/issues/<parent>/sub_issues`. Without sub-issues, put `Part of #<parent>` at the top of the child body.
- **Comment on an issue**: `gh api $R/issues/<n>/comments -F body=@comment.md`
- **Apply / remove labels**: `gh api $R/issues/<n>/labels -f 'labels[]=<label>'` / `gh api --method DELETE $R/issues/<n>/labels/<label>`
- **Close**: comment first, then `gh api --method PATCH $R/issues/<n> -f state=closed -f state_reason=completed`.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues:

- **Read a PR**: `gh api $R/pulls/<n>`, its comments with `gh api $R/issues/<n>/comments`, and the diff with `gh api $R/pulls/<n> -H 'Accept: application/vnd.github.diff'`.
- **List external PRs for triage**: `gh api --paginate "$R/pulls?state=open" --jq '.[] | select(.author_association | IN("OWNER","MEMBER","COLLABORATOR") | not) | {number, title, author: .user.login, author_association, labels: [.labels[].name]}'`.
- **Comment / label / close**: the issue endpoints above work on PR numbers too; close with `gh api --method PATCH $R/pulls/<n> -f state=closed`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: `gh api $R/issues/42` answers for both, and carries a `pull_request` key when it is a PR.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. Create it as in **Create an issue** with `-f 'labels[]=wayfinder:map'`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (see **Make an issue a sub-issue of a parent**). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh api --method POST $R/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api $R/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only, the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh api $R/issues/<map>/sub_issues --jq '[.[] | select(.state == "open") | {number, title, blocked: .issue_dependencies_summary.blocked_by, assignees: [.assignees[].login]}]'`), drop any with an open blocker (`blocked > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh api $R/issues/<n>/assignees -f 'assignees[]=<login>'`, the session's first write.
- **Resolve**: comment the answer (see **Comment on an issue**), close the ticket (see **Close**), then append a context pointer (gist + link) to the map's Decisions-so-far.
