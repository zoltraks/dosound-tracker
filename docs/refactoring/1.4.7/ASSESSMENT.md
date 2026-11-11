# 1.4.7 Refactoring Assessment

## Proposal Summary

`docs/refactoring/1.4.7/REFACTORING.md` proposed extracting the duplicated
register-file mechanics - mirror, bounds/mask/dedup, nested batching - from
`YM2149` and `AyumiEngine` into a shared `RegisterFile` class parameterized
on one `onFlush` callback per engine.

## Implementation Summary

Implemented as proposed.

- `src/synth/registerFile.ts` - new `RegisterFile` class: `write`, `force`,
  `beginBatch`, `endBatch`, `read`, `raw`, `snapshot`, `toArray`, `zero`.
- `YM2149.ts` - all register mechanics delegate; `onFlush` runs
  `updateState` + `updateAudioNodes`, `silenceAll` uses `force`, `reset`
  uses `zero`. Engine public API unchanged.
- `AyumiEngine.ts` - same delegations; `onFlush` posts `write` for one pair
  and `writes` otherwise, preserving both message shapes.
- `test/synth/registerFile.test.ts` - seven cases covering masking, bounds,
  dedup, batched ordering, nested depth, empty batches, `force`, and `zero`.

## Gap Analysis

One addition beyond the proposal: `RegisterFile.raw()` - a live-array view
required because `deriveYmState` consumes the register array directly;
without it `toArray` would allocate per flush on the audio path.

One constraint surfaced: `erasableSyntaxOnly` rejects TypeScript parameter
properties, so `onFlush` is an explicit field assignment - routed to the
tooling notes as a durable lesson.

## Verification Results

| Check               | Result | Evidence                   |
| ------------------- | ------ | -------------------------- |
| `npm run typecheck` | pass   | tsc -b, zero errors        |
| `npm run lint`      | pass   | zero errors, zero warnings |
| `npm run format`    | pass   | Prettier applied           |
| `npm run build`     | pass   | dist emitted               |
| `npm test`          | pass   | 109 files, 850 tests       |

## Metrics Comparison

- `YM2149.ts` - ~35 lines of register mechanics removed; `registers`,
  `batchDepth`, `pendingUpdate` fields collapsed to one `registerFile`.
- `AyumiEngine.ts` - ~30 lines removed; same field collapse.
- `registerFile.ts` - +78 lines, one tested home for both engines.

## Output Fidelity

The register mirror feeds Dump/EQ and export simulation reads only; write
semantics (mask, dedup, flush timing, message shapes) are unchanged, so
produced exports are byte-identical.

## Behaviour Smoke Check

All 850 tests pass, including the four existing `YM2149` suites, the
`AyumiEngine` suite, and the export-fixture assertions - unmodified.

## Conclusion

Pass. The extraction is exact; both engines keep their distinct flush
semantics behind identical batch mechanics.
