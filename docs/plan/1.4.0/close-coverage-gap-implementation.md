# Close the Coverage Gap Implementation Plan

## Summary

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Intent        | Lift branch coverage past the configured 80 percent gate                |
| Key decisions | characterization tests on `trackClipboard.ts`, the largest absolute gap |
| Open risks    | `none`                                                                  |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.4.0/close-coverage-gap.md`.

## Analysis

Baseline coverage: statements 88.68%, branches 77.9% (~74 branches short),
functions 92.22%, lines 88.95%. Only branches fail. The audit's feared gap
(35 hooks, 24 components, 13 modals) overstates the reportable gap - v8
coverage counts exercised files only. `trackClipboard.ts` at 5.1% branch is
the single largest deficit.

## Documentation Updates

- `TESTING.md` — the known-gap note is removed - the coverage-gaps list is
  updated to the post-change state.

## Step by Step Implementation

**Characterize the clipboard codec**

Extend `test/utils/track/trackClipboard.test.ts` across parse, generate,
and apply paths: malformed YAML, document-shape rejects, `step`/`steps`
aliases, wait/off/space run-length handling, volume clamping, instrument
defaults, and the three apply modes (replace, overwriteAll, overwriteEmpty).

**Update TESTING.md**

Drop the documented expected-failure note now that the gate passes.

## Testing Strategy

The change is tests-only - `npm run test:coverage` is the acceptance gate.

## Verification

- `npm run test:coverage` - all four thresholds pass
- `npm test` - suite stays green
- `npm run typecheck`, `npm run lint`
