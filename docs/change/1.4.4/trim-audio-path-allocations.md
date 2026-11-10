# Trim the audio-path allocations

**Type:** Enhancement

**Source:** 1.4.4 self-healing optimization survey

## Summary

| Field         | Value                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| Intent        | Remove per-batch array churn and per-tick `Math.pow` calls from the 50 Hz and export paths |
| Key decisions | Single accumulating loop for noise gains; precomputed lookup tables for the pow domains    |
| Open risks    | Lookup tables must hold `Math.pow` results, not literals, to keep output bit-identical     |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Two small hot-path costs survive in the audio engine and its simulation twin. `YM2149.updateAudioNodes` (`src/synth/YM2149.ts` ~lines 239-251) allocates two or three arrays per `endBatch` while noise is active - a `.some()` followed by `.filter().map().reduce()` - roughly 150 small allocations per second during playback. And `Math.pow` runs per channel-tick for octave and shift scaling in both `YM2149.ts` (~lines 436, 449) and `playbackSimulation.ts` (~lines 374, 377), over domains small enough to precompute.

## Hints

- Replace the chain with one accumulating loop - identical sums, no intermediate arrays.
- Table values must come from `Math.pow` itself, never decimal literals - export byte-identity and audio pitch depend on exact doubles.
- Verify with the synth suites and `test/exports/` - no tolerance drift allowed.

## Out of Scope

- Any change to the register simulation, volume table, or noise algorithm - those surfaces are frozen.
