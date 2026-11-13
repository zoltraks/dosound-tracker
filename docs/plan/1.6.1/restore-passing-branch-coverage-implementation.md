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

## Current Baseline

The existing suite reports about 80.03% branch coverage, with the
other three metrics above the threshold. The report omits executable
modules such as `App.tsx`, `ModalManager.tsx`, and
`useStartupRestore.ts`. Measure the gap again after including the
full executable source inventory.

The persistence mirror suite already covers transaction abort and
writes and deletes invalidated by reset. Preserve those cases and
inspect their measured branches before adding tests. Prioritize gaps
observable through the public behavior of the newly included modules.

## Verification Evidence

The expanded inventory matches the coverage report. The only absent
TypeScript paths are the browser bootstrap and the type-only Electron
preload API declaration. The configuration documents both exclusions.

The coverage run passed all four 80% gates. It measured 86.53%
statements, 80.07% branches, 84.84% functions, and 86.83% lines. All
1,527 tests passed. Added behavior tests cover startup restore, sequencer
and MIDI playback, track edits, instrument and modal flows, and recovery
after a persistence mirror transaction error.
