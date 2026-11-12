# Clear the Non-Writing Format Gate Implementation Plan

**Change Request Reference:** `docs/change/1.6.1/clear-non-writing-format-gate.md`

## Summary

| Field         | Value                                                          |
| ------------- | -------------------------------------------------------------- |
| Intent        | Nine measured files formatted; zero-warning check on the final |
|               | tree                                                           |
| Key decisions | Scoped `--write` on the named files only                       |
| Open risks    | Files edited between audit and fix may need a second pass      |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Best Practices

Follow `docs/standard/typescript-react-development.md` formatting
section: Prettier output is accepted as-is; no hand-tuning after.

## Documentation Updates

None beyond the formatting itself - no behavioral or contractual change.

## Type and State Updates

None.

## Step by Step Implementation

**Format the measured set**

Run Prettier `--write` scoped to the nine files the audit named:
`docs/refactoring/1.5.9/ASSESSMENT.md`,
`docs/refactoring/1.5.9/REFACTORING.md`, the three modal/piano sources,
the two modal sources, and the two test files.

**Recheck the whole tree non-writing**

Run `prettier --check .` on the final intended tree - including the
report surface the audit snapshot excluded - and format any new rejects
the same way.

## Implementation Order

1. Scoped format pass.
2. Full `--check` recheck.
3. Verification loop.

## Testing Strategy

**Unit tests**

None - formatting produces no behavior change.

**Integration tests**

None - `npm test` staying green is the check.

## Verification

- `prettier --check .` exits 0 with zero warnings.
- `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` - all
  clean after the whitespace-only diffs.
