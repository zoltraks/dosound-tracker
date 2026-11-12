# Adopt Engineering Standards Implementation Plan

## Summary

| Field         | Value                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| Intent        | Land the four scope-confirmed canonical standards in `docs/standard/` and index them       |
| Key decisions | Files arrive canonical with no `## Project Conventions` section; documentation-only change |
| Open risks    | none                                                                                       |

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.7/standard-library-adoption.md`.

## Best Practices

No source code changes - the TypeScript and React engineering standards of `docs/standard/typescript-react-development.md` are not exercised. Documentation style follows `STYLE.md`, and the adopted-file index rows follow the recorded statuses of `docs/standard/README.md`.

## Documentation Updates

- `docs/standard/` — four adopted canonical files
- `docs/standard/README.md` — four index rows

No `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, or `FORMAT.md` changes are required.

## Step by Step Implementation

**Copy the canonical files**

Copy the four scope-confirmed documents verbatim from the compass library into the project standards directory.

Source directory: `references/standard/` of the compass-skill checkout. Destination: `docs/standard/`.

- `clean-code-general-development.md`
- `merge-conflict-development.md`
- `typescript-conflict-development.md`
- `javascript-inline-development.md`

**Restyle the adopted files**

Run the repository formatter on the new files so they match the vendored-set convention (spaced table separators, code reflows) that `docs/standard/README.md` records.

```bash
npx prettier --write docs/standard/clean-code-general-development.md docs/standard/javascript-inline-development.md docs/standard/merge-conflict-development.md docs/standard/typescript-conflict-development.md
```

**Index the adopted files**

Add one row per adopted file to the file list of `docs/standard/README.md`, each marked `Canonical` since no project deltas are authored at adoption.

- `clean-code-general-development.md` — Clean code, general. Canonical.
- `javascript-inline-development.md` — JavaScript, inline scripts. Canonical.
- `merge-conflict-development.md` — Merge-conflict resolution, cross-stack. Canonical.
- `typescript-conflict-development.md` — TypeScript, merge-conflict resolution. Canonical.

**Verify the drift baseline**

Confirm each adopted file's version comment matches the canonical copy and that a normalized `diff -w -B` (ignoring the formatting deltas the sweep introduces) reports no content drift. Confirm `docs/standard/README.md` lists exactly the adopted set.

## Implementation Order

Execute the steps above in this sequence.

1. Copy the canonical files into `docs/standard/`.
2. Restyle the adopted files with Prettier.
3. Index the adopted files in `docs/standard/README.md`.
4. Verify the drift baseline and the formatter check.

## Testing Strategy

Documentation-only change - the verification loop is bypassed per `TESTING.md`. No unit, component, or integration tests apply.

## Verification

- `npx prettier --check` passes on every touched file, including both generated records.
- Normalized `diff -w -B` of each adopted file against `references/standard/` reports formatting-only differences.
- `docs/standard/README.md` index rows match the adopted set.
