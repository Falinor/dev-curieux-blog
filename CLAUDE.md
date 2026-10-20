## Agent skills

### Issue tracker

Issues tracked in GitHub Issues on Falinor/dev-curieux-blog via `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.

## Design

Visual work follows `DESIGN.md`: the locked « Cartes postales » direction and the color tokens for both themes.

## Cloud session gotchas

- **Workflows**: cloud sessions can't push files under `.github/workflows/` (the GitHub app lacks the `workflow` scope). Hand workflow changes to the owner as a patch.
- **Library docs**: most docs sites are blocked by the network policy. Query Context7 instead: `NODE_USE_ENV_PROXY=1 NODE_NO_WARNINGS=1 npx ctx7 library <name> "<query>"`, then `npx ctx7 docs <libraryId> "<query>"` with the same variables.
