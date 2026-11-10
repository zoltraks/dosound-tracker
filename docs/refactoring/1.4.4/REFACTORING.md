# Refactoring Proposal - 1.4.4

## Problem

Two residual items survived the 1.4.4 request iteration.

**Synth test stub duplication.** All four `test/synth/` suites carry a byte-identical `createAudioContextStub` (~55 lines) plus its `ParamStub`/`createParam` prelude - a Rule-of-Three violation that forces every future AudioContext surface change to be edited four times.

**Orphaned `Math.pow` call sites.** The `trim-audio-path-allocations` record introduced `POW2_OCTAVE_SCALE`/`POW2_SEMITONE_SCALE` and routed the YM2149 and simulation sites, but `src/exports/asm.ts` still calls `Math.pow` at three sites (`periodToNoteAndPitch`, the instrument base-frequency, and the shift-scaling inside the instrument exporter) - the same work the tables now cover.

## Goal

One canonical AudioContext stub module imported by the four synth suites; every `Math.pow` call in `src/` routed through the shared helpers, keeping outputs bit-identical.

## Plan

**Extract the shared stub**

Create `test/synth/audioContextStub.ts` exporting `createAudioContextStub` (with `ParamStub`/`createParam` internal), delete the per-file copies, and add the import to each suite. Tidy only - no behavior change.

**Route the asm pow sites**

Replace the three `Math.pow` calls in `asm.ts` with `pow2Octave`/`pow2Semitone`. The octave loop domain (0-8 -> exponents -4..4) and the `semitone | 0` truncation sit inside the table domain; tables are `Math.pow`-built so results are bit-identical.

## Risk

- The stub return shape must stay identical - consumers destructure `context`, `createdGains`, `createdOscillators`, and `buffers`. Guarded by the four suites themselves.
- A pow route that fell outside the table domain would silently change output - guarded by `exportDump.test.ts`'s exact-string register comparison and `exportInstrument.test.ts`'s `dc.b` block equality.

## Acceptance Criteria

- `npm test` green with zero output changes - `test/synth/` and `test/exports/` suites pass verbatim.
- Export fixtures produce byte-identical output.
- No `Math.pow` remains in `src/` outside `constants/music.ts`.
- Zero errors, zero warnings across the verification loop.
