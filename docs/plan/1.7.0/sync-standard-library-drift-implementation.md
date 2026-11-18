# Sync the Vendored Standard Library Implementation Plan

## Summary

| Field         | Value                                                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Re-vendor all fifteen `docs/standard/*-development.md` files from the canonical compass library at the current submodule pin and re-attach project conventions. |
| Key decisions | Canonical body always wins; `## Project Conventions` sections re-attach verbatim; `## Contents` line numbers reconcile to the formatted vendored layout.        |
| Open risks    | The vendored css scroll-debugging block is generic knowledge absent from canonical - it reverts per contract and is recorded as a to-library feed candidate.    |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.7.0/sync-standard-library-drift.md`.

## Fresh Analysis (supersedes the record's pin-`eb06522` sweep)

The compass-skill submodule moved to `6f9fe6c` (library version 1.1.0,
2026-11-18) after the record's analysis. Version 1.1.0 added
Contents-based lazy loading - every canonical standard now carries a
`## Contents` section whose table maps each `##` heading to a line number.

Re-measured against the new pin with the token-stream comparison from
`compass-skill/process/synchronization-library.md`:

- All fifteen vendored files diverge from canonical (token ratios
  0.88-0.99). Thirteen are canon-newer by version; three are
  same-version re-dated (`css-general` 0.1.7, `performance-budgets` 0.1.5,
  `typescript-react` 0.1.6 - canonical re-dated 2026-11-18).
- No vendored file is locally ahead anymore - the record's three
  locally-ahead cases are resolved by canonical catching up.
- Vendored-only substantive content is limited to one block: the
  scroll-debugging rules in `css-general-development.md` (scrollHeight
  measurement, integer scroll height, no scroll-snap repair, margin-not-
  padding for scrollbar spacing). The material is generic engineering
  knowledge, not project-specific, and absent from canonical.
- Remaining vendored-only lines are adoption boilerplate canonical
  removed, project-path wording canonical generalized, and format-sweep
  noise - all revert per the sync contract.
- Thirty-six canonical-only files exist; none match this project's stack.
  `javascript-general-development.md` is the only arguable addition and
  stays out of scope (see Decision Points).

## Best Practices

Follow the sync procedure in `compass-skill/process/standards.md`,
"Syncing A Standard Set", and the vendoring contract in
`docs/standard/README.md`:

- The canonical body always replaces the vendored body - drift repair
  runs one way.
- `## Project Conventions` is project-owned and re-attaches verbatim,
  slimmed only where canonical now covers the item.
- The repository's format sweep (prettier) re-applies to vendored files;
  drift checks compare content, never raw bytes.

## Documentation Updates

- `docs/standard/README.md` - no update required; the adopted file list
  is unchanged.
- `docs/change/1.7.0/sync-standard-library-drift.md` - a Refinements
  note records the pin movement, the re-measured drift, the css
  scroll-block reversion, and the `javascript-general` exclusion.
- `SPECIFICATION.md`, `PROJECT.md`, `ARCHITECTURE.md`, `FORMAT.md` -
  unaffected.

## Type and State Updates

None.

## Step by Step Implementation

**Re-vendor the fifteen files**

For each `docs/standard/*-development.md` file, copy the canonical
counterpart from
`astra-skills/skills/compass-skill/references/standard/` verbatim over the
vendored file. The canonical `<!-- Version: ... | Date: ... -->` header
travels with the copy.

Files: all fifteen `*-development.md` under `docs/standard/` (the
`README.md` index is project-owned and stays).

**Re-attach project conventions**

Append each file's existing `## Project Conventions` section verbatim at
the end of the re-vendored file - including the "No project-specific
conventions are recorded" placeholders and the css conventions added in
this session. The four files that carry no section
(`clean-code-general`, `javascript-inline`, `merge-conflict`,
`typescript-conflict`) stay without one.

**Re-apply the format sweep**

Run `npm run format` so prettier restyles the vendored files to the
repository's table and prose conventions, exactly as prior sweeps did.

**Reconcile `## Contents` line numbers**

Prettier reflows code blocks and tables, so the canonical `## Contents`
line numbers no longer match the vendored file's actual heading
positions. For each re-vendored file, recompute every Contents row's
Line value against the formatted file's real `## ` heading lines and
rewrite the table. This is positional metadata reconciliation, not a
content change - the section names and read triggers stay canonical.
`## Project Conventions` gets no Contents row; it is a project appendix
outside the canonical map.

**Record the refinement**

Add a Refinements note to the change record covering: the pin moved to
`6f9fe6c` (library 1.1.0), all fifteen files re-vendored, the css
scroll-debugging block reverted as generic material (candidate for a
future `to-library` feed into compass-skill - upstreaming is a
compass-skill change outside this record's scope), and
`javascript-general-development.md` excluded from adoption.

## Implementation Order

1. Re-vendor the fifteen files and re-attach conventions.
2. Run `npm run format`.
3. Reconcile `## Contents` line numbers per file; re-run format check.
4. Write the change-record Refinements note.
5. Run the drift re-check and verification.

## Testing Strategy

**Unit tests**

None - documentation-only change; the suite does not cover standard files.

**Integration tests**

None required - no source, configuration, or test file changes; the
verification loop is not triggered for documentation-only work per
`TESTING.md`.

## Verification

- Re-run the token-stream comparison: every vendored file's canonical
  body matches its canonical counterpart; only `## Project Conventions`
  and reconciled Contents line numbers differ.
- Verify every `## Contents` Line value equals the real heading line in
  the formatted file (scripted check across all fifteen files).
- Run `npm run format` - clean.
- Run `scripts/release-check.sh` if present - the stale-figure sweep
  covers standard-version drift.
- Spot-check `git diff --stat` - only `docs/standard/` files and the
  change record change.

## Decision Points

- `javascript-general-development.md` adoption - the owner chose adoption
  at the gate; the file is vendored canonical-verbatim with a
  no-conventions placeholder and indexed in `docs/standard/README.md`.
- css scroll-debugging block - reverted per the sync contract and
  recorded below as a to-library feed candidate rather than preserved in
  `## Project Conventions` (the material is generic, not project-owned).

## Refinements

Recorded when the implementation landed, per the workflow's refinement
rule.

- **Pin moved.** The record's sweep ran against submodule pin `eb06522`;
  the collection updated to `6f9fe6c` (library 1.1.0) before implementation.
  The drift picture was re-measured: all fifteen files diverged, the
  record's three locally-ahead cases were resolved by canonical catching
  up, and the dominant canonical change is the new `## Contents`
  lazy-loading map.
- **Contents line numbers reconciled.** Canonical `## Contents` tables
  carry positional line numbers that prettier reflow invalidates in the
  vendored layout; each row's Line value was recomputed against the
  formatted file (90 corrections across seven files, zero mismatches on
  re-check). `## Project Conventions` carries no Contents row.
- **css scroll-debugging block reverted.** The vendored
  `css-general-development.md` body carried scroll-measurement rules
  absent from canonical; the body re-vendored per contract. The material
  is generic engineering knowledge - a candidate for a future
  `to-library` feed into compass-skill, which is a compass-skill change
  outside this record's scope.
- **`javascript-general-development.md` adopted** at the owner's gate
  decision, expanding the vendored set to sixteen files.
- **Verification loop not run** - documentation-only change per
  `TESTING.md`; format, token-drift, and Contents checks substitute.
