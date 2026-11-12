# Restore Honest Passing Coverage Implementation Plan

**Change Request Reference:** `docs/change/1.6.1/restore-passing-branch-coverage.md`

## Summary

| Field         | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Intent        | All four 80 percent gates green on the honest source denominator |
| Key decisions | Exclusions are per-file and justified in `vitest.config.ts`      |
|               | comments, not a blanket glob                                     |
| Open risks    | Widening the denominator may drop other measures under 80 -      |
|               | expect more branch tests than the single failing metric suggests |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Best Practices

Follow `docs/standard/typescript-react-development.md` testing sections:
behavior tests over implementation-detail tests; the coverage gate is
never satisfied by weakening the threshold.

## Documentation Updates

- `TESTING.md` - the coverage-denominator rule and the justified-
  exclusion convention, if not already stated.

## Type and State Updates

None.

## Step by Step Implementation

**Fix the denominator**

Include executable `src/**/*.{ts,tsx}` modules in the V8 coverage file
set; exclude type-only and entry files individually with a comment per
exclusion.

File to modify: `vitest.config.ts`.

**Cover the named failure paths first**

Branch tests for mirror-failure and reset-race paths against the landed
1.5.9 reset semantics - these are the audit's named targets and the
highest-value uncovered branches.

Files to create or update: `test/utils/storage/persistenceMirror.test.ts`
and the reset-flow suites.

**Close the remaining branch gap**

Measure, list the uncovered branches by file, and add behavior tests in
the existing per-domain suites until the gate passes without threshold
changes.

## Implementation Order

1. Update documentation.
2. Denominator fix and exclusions.
3. Named-path branch tests.
4. Remaining branch tests until green.
5. Verification loop.

## Testing Strategy

**Unit tests**

This record is the test work: per-domain suites gain branch coverage,
with `persistenceMirror` failure/abort paths and reset invalidation as
the named additions.

**Integration tests**

The coverage file-list comparison: source inventory versus
`coverage-final.json` keys - unmatched paths equal the justified
exclusions exactly.

## Verification

- `npm run test:coverage` exits 0 - all four thresholds pass.
- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`,
  `npm test` - all clean.
