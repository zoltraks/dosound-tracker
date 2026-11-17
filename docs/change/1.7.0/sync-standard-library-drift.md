# Reconcile the vendored standard library with the canonical compass library

**Type:** Chore

## Summary

| Field         | Value                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Intent        | Restore the `docs/standard/` vendoring contract: canonical content plus an optional `## Project Conventions` section, verified against the pinned compass checkout |
| Key decisions | Stale files re-vendor verbatim and re-apply project conventions; locally-ahead files get a per-file keep-or-overwrite decision backed by evidence                  |
| Open risks    | Locally-ahead files may encode deliberate project conventions placed in the body instead of `## Project Conventions` - each needs verification before overwrite    |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

A housekeeping sweep on 2026-11-17 compared every `docs/standard/*-development.md`
file against the canonical library at
`astra-skills/skills/compass-skill/references/standard/` (submodule pin `eb06522`,
clean checkout) using `diff -w -B` with the trailing `## Project Conventions`
section stripped. The vendored copies drift in both directions.

Stale vendored copies - canonical is newer:

- `html-vanilla-development.md` - vendored `0.1.3` (2026-11-08), canonical `0.1.4` (2026-11-14)
- `merge-conflict-development.md` - vendored `0.1.1` (2026-11-08), canonical `0.1.2` (2026-11-14)
- `standard-template-development.md` - vendored `0.1.8` (2026-11-08), canonical `0.1.9` (2026-11-14)

Locally-ahead vendored copies - vendored version exceeds canonical:

- `css-general-development.md` - vendored `0.1.7` (2026-11-12), canonical `0.1.6` (2026-11-08)
- `performance-budgets-development.md` - vendored `0.1.5` (2026-11-10), canonical `0.1.4` (2026-11-08)
- `typescript-react-development.md` - vendored `0.1.6` (2026-11-12), canonical `0.1.5` (2026-11-08)

In-body differences survive the whitespace-insensitive diff and are not
formatting noise:

- `css-general-development.md` - vendored body carries a scroll-debugging
  section absent from canonical and renames the example class
  `.command-btn` to `.command-button`.
- `typescript-refactoring-development.md` - vendored uses `_might_` underscore
  emphasis where canonical uses `*might*`.
- `merge-conflict-development.md` - vendored wording `docs/standard/ holds
*-development.md` differs from canonical `A resolved standards directory
holds *-development.md`.

The remaining diff volume is the documented format-sweep noise: spaced table
separators and code-block reflows that `diff -w -B` cannot fully absorb.

The change re-vendors the stale files verbatim from canonical, re-applies each
file's `## Project Conventions` section, and resolves each locally-ahead file
by evidence: deliberate project conventions move into `## Project Conventions`
or a project document, everything else reverts to canonical. Version headers
follow the vendored file's own convention after reconciliation.

## Use Cases

- When the next standard-library sync runs, every vendored file diffs clean
  against canonical outside `## Project Conventions`.
- When a reviewer checks standard drift, version headers and in-body content
  agree with the pinned canonical checkout instead of mixing local edits.

## Hints

- The sync procedure lives in the `standards-synchronization` extension and
  `docs/standard/README.md` under Bidirectional Synchronization.
- Earlier sync records exist under `docs/archive/change/` (for example the
  1.3.5 and 1.3.6 windows) as precedent for scope and verification.
- The canonical checkout is a pinned submodule - the sync target is fixed at
  the recorded pin unless the collection itself updates first.

## Out of Scope

- Syncing `docs/template/` against `references/template/` - the template
  directory shows no version drift; only adoption choices differ.
- Upstreaming project conventions back into the canonical library - that is a
  compass-skill change, not a dosound-tracker one.
