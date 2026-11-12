# Specification Audit - Enhance Assembly Export Optimization

## Document Information

|            |                                                                    |
| ---------- | ------------------------------------------------------------------ |
| Change     | `docs/change/1.5.2/enhanced-assembly-optimization.md`              |
| Plan       | `docs/plan/1.5.2/enhanced-assembly-optimization-implementation.md` |
| Audit Date | 2026-11-11                                                         |

## Completeness

- Shrink DOSOUND assembly output further - covered by the `compact`
  strategy and its five emission tightenings in `src/exports/asm.ts`.
- Custom register mappings candidate - realized as byte-level tone
  dedup and audible-keyed mixer dedup, the only packing the DOSOUND
  command vocabulary admits.
- Pattern data compression candidate - declined in the amended record:
  the stream carries register pairs, `$FF,N` delays, and `$FF,0` stop,
  with no subroutine or pointer command to reference a body.
- Instrument sharing candidate - declined for the same reason; the
  stream has no shared-data construct.
- Selectable strategy surface - `compact` joins `ExportStrategy`, the
  persisted-strategy reader, and the export modal radio group.
- Existing exports stay byte-identical - `simple`, `complex`, and
  `optimized` paths keep their emission code; the regression assertions
  lock their bytes on the fixture song.
- Replay equivalence gate - the plan's decode-and-compare test simulates
  the emitted commands per frame and asserts the same audible register
  state as `complex`.
- Delay-count overflow - the merged-delay chunking covers runs beyond
  the 256-frame single-command maximum, a latent defect in the
  unbounded `optimized` merge, which is left byte-identical by decision.

## Ambiguity

- "Custom register mappings" - resolved as the two dedup tightenings
  the stream contract admits; arbitrary reordering of register pairs is
  possible but yields no byte savings and is not implemented.
- "Audible" for mixer dedup - resolved as a non-zero volume nibble on
  the same frame, matching the existing silent-channel tone skip.
- "Last written volume" for the END block - resolved as the final
  simulated frame's volume registers, which equal the last emitted
  values because every change is emitted.
- `compact` for VGM and MAX - resolved as mapping onto each format's
  existing optimized reduction; no new stream encoding is introduced
  there.

## Implementability

- `formatFramesToAssembly` in `src/exports/asm.ts` already branches on
  `strategy === 'complex' || strategy === 'optimized'` and holds
  `lastRegs` plus per-frame volumes - the compact flags slot into the
  existing loop without restructuring.
- `combineDelayLines` in `src/exports/asm.ts` accumulates pending frame
  counts and emits through `formatDelayLine` - chunking is a local
  change to its flush.
- `exportSongToVgm` at `src/exports/vgm.ts` already gates
  `optimizeVgmDelays` on `strategy === 'optimized'` - verified.
- `buildMaxStream` at `src/exports/max.ts` already gates
  `optimizeReg7Delays` on `strategy === 'optimized'` - verified.
- `useAppState` at `src/hooks/app/useAppState.ts` validates the stored
  strategy through an explicit membership check - one added literal.
- `ExportModal` renders the strategy radios inline - one added label
  block; `test/modals/ExportModal.test.tsx` asserts the radio count and
  dispatch order and is updated.
- `exportInstrumentToAssembly` takes no strategy and stays unchanged;
  `exportToBinary` forwards the strategy and needs no edit.

## Fidelity

- Strategy vocabulary stated once: `simple | complex | optimized |
compact` in `src/constants/export.ts`; the modal, the persisted
  reader, and the format dispatchers read the same union.
- Delay bound stated once: 256 frames per command, derived from the
  DOSOUND off-by-one (`$FF,N` delays N+1 frames, N one byte).
- Mixer mask stated once: `0x09 << ch` per-channel enable bits plus the
  `0xC0` I/O bits compared always.
- Cross-party parity: `compact` selects the optimized reduction in VGM
  and MAX so the four formats agree that `compact` is at least as
  reduced as `optimized`.
- Boundary decisions recorded: pattern referencing and instrument
  sharing declined; `optimized` keeps its unbounded merge for byte
  identity; playlist markers stay as comments but stop forcing tone
  rewrites under `compact`.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
