# 1.5.2 Refactoring Assessment

## Proposal Summary

`refactoring/1.5.2/REFACTORING.md` proposed two extractions at the
Rule-of-Three threshold: a shared `isPatternTrackId` predicate and a
first-wins `buildPatternLookup` for the three identical sites in
`playbackSimulation.ts`, `midi.ts`, and `mod.ts`, plus a shared
`resolveExportTiming` prologue helper for the five simulating
exporters.

| Item                   | Proposed | Achieved |
| ---------------------- | -------- | -------- |
| `isPatternTrackId`     | 3 sites  | 3 sites  |
| `buildPatternLookup`   | 3 sites  | 3 sites  |
| `resolveExportTiming`  | 5 sites  | 5 sites  |
| New `songLookup` tests | yes      | yes      |
| Byte-identical exports | required | proven   |

## Implementation Summary

Implemented as proposed, in plan order.

- `src/utils/song/songLookup.ts` - new module holding
  `isPatternTrackId` and `buildPatternLookup` with the exact original
  semantics (untrimmed `--` comparison, skip falsy, first-wins).
- `test/utils/song/songLookup.test.ts` - six cases covering marker
  and blank rejection, untrimmed acceptance, duplicate-id first-wins,
  falsy entries, and the empty-id key.
- `playbackSimulation.ts`, `midi.ts`, `mod.ts` - map blocks and
  predicates replaced; orphaned `Pattern` type imports removed.
- `src/exports/core.ts` - `resolveExportTiming` added; `midi.ts`,
  `mod.ts`, `vgm.ts`, `wav.ts`, and `max.ts` destructure only the
  fields they use. `asm.ts` untouched.

## Gap Analysis

No deviations. Every below-threshold candidate recorded in the
proposal stayed out: the instrument-id map (two identical sites, one
deliberately divergent), the warnings-result shape, the loop clamp,
and the test-fixture loaders (export suites must pass unmodified).
`usePlaybackBridge.ts` keeps its last-wins map and `useSongManagement.ts`
its normalized-key map - neither could adopt the helper without a
semantics change.

## Verification Results

| Check               | Result | Evidence                      |
| ------------------- | ------ | ----------------------------- |
| `npm run typecheck` | pass   | tsc -b, zero errors           |
| `npm run lint`      | pass   | zero errors, zero warnings    |
| `npm run format`    | pass   | Prettier applied, no rewrites |
| `npm run build`     | pass   | dist emitted                  |
| `npm test`          | pass   | 130 files, 1171 tests         |

Baseline was 129 files and 1165 tests; the delta is the new
`songLookup` suite only - no existing test was modified.

## Metrics Comparison

- `playbackSimulation.ts` - 8 lines of map and predicate replaced by
  two helper calls.
- `midi.ts`, `mod.ts` - 8 lines each replaced by the same calls plus
  a one-line timing destructure.
- `vgm.ts`, `wav.ts`, `max.ts` - 2-line timing prologues collapsed to
  one destructure each.
- `songLookup.ts` - +26 lines, one tested home; `core.ts` +11 lines
  for `resolveExportTiming`.

## Output Fidelity

SHA-256 manifests of all 75 fixture exports (three fixtures across
asm, bin, vgm, wav, max, mod, midi, every strategy, plus every
instrument export) are byte-identical before and after.

## Behaviour Smoke Check

All 1171 tests pass, including the simulation suite, every export
suite, and the playback hook integration suites - unmodified.

## Conclusion

Pass. The extraction is exact, the winner semantics are documented in
the module header, and the divergent lookalike sites were left alone
on purpose.
