# Close the coverage gap to the 80 percent threshold

**Type:** Chore

**Source:** AUDIT-1.4 REC-022 (FND-CQY-007)

## Summary

| Field         | Value                                                                           |
| ------------- | ------------------------------------------------------------------------------- |
| Intent        | Make the configured coverage gate passable and verifiable                       |
| Key decisions | tests grow on the highest-risk untested paths first                             |
| Open risks    | the gap spans many modules; sequencing inside the window is decided in the plan |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`vitest.config.ts` enforces 80 percent thresholds on all metrics while `docs/TESTING.md` documents `test:coverage` as an expected failure. The untested surface includes `sequencerWorker`, about 35 of 49 hooks, 24 of 28 components, and 13 of 14 modals - a large interaction surface with no verification.

The change grows tests on the highest-risk untested paths - the sequencer worker, playback hooks, and modals first - until `npm run test:coverage` passes all four 80 percent metrics and the gate becomes enforceable.

## Hints

- The audit notes critical domains (synth, exports, parsers) already carry coverage; the growth targets the interaction layer.
- Characterization tests precede any testability refactoring on modules that can only be exercised through the UI.

## Out of Scope

- Raising the threshold beyond the configured 80 percent.
- Coverage for e2e paths, measured separately.
