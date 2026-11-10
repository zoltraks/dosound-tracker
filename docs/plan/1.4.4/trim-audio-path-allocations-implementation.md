# Trim the Audio-Path Allocations Implementation Plan

## Summary

| Field         | Value                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Intent        | Remove per-batch array churn from `updateAudioNodes` and per-tick `Math.pow` calls from both pow sites |
| Key decisions | One accumulating loop for noise gain; `Math.pow`-built lookup tables in `constants/music.ts`           |
| Open risks    | none - bit-identical outputs are pinned by `test/synth/` and `test/exports/`                           |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.4/trim-audio-path-allocations.md`.

## Analysis

`YM2149.updateAudioNodes` allocates two arrays per `endBatch` while noise is active: a `.filter().map()` pair feeding `.reduce()`, fronted by a `.some()` scan - roughly 150 small allocations per second at 50 Hz. A single accumulating loop over `this.state.channels` produces the same sum in the same order, so the combined level, the `Math.min(1, ...)` cap, and the `* 0.4` boost stay bit-identical. The `anyNoiseActive` flag folds into the accumulation: a zero sum reaches the same `setValueAtTime(0)` the original `else` produced, because a channel can only contribute `YM_LOG_VOLUME_TABLE[level]` with `level >= 1` when its volume is positive - and table entries at level >= 1 are all positive, so a positive sum implies an active channel and vice versa.

Four `Math.pow(2, x)` sites run per channel-tick: octave scaling and shift scaling in `YM2149.updateChannelWithInstrument`, and the same pair in `playbackSimulation.applyInstrumentToRegisters`. The octave exponent `note.octave - NOTE_BASE_OCTAVE` is an integer over a small domain (0-7 octaves -> -4..+3). The shift domains differ: the emulator truncates `shiftValue | 0` to an integer while the simulation keeps the raw envelope value, which may be fractional. The tables therefore cover the integer domain generously (octave exponents -8..+8, semitones -48..+48 spanning the -24..+24 editor range) and each helper falls back to `Math.pow` for out-of-range or non-integer input - the simulation's fractional shift then resolves identically to today.

Every table entry is computed by `Math.pow` at module load, so table and fallback return the identical double for any covered input. `asm.ts` carries three further `Math.pow` sites outside this record's scope - the tables are exported so a later window can route them.

## Documentation Updates

- `SPECIFICATION.md` — extend the `music.ts` constants bullet with the pow2 scale tables and their integer-domain/fallback contract.

## Audio-Critical Requirements

- No React render timing, hook, or state-management changes - the touched code is the Web Audio node update path and the offline simulation.
- The allocation trim changes the mechanism but not the arithmetic: same accumulation order, same cap, same boost - `test/synth/YM2149Noise.test.ts` pins the noise-gain formula bit-exactly.
- The pow tables return `Math.pow`-computed doubles - `test/synth/YM2149Instrument.test.ts` pins exact periods for shift +-12 and `test/exports/` pins the register stream.
- Playback verification: a song with noise and shift envelopes sounds identical.

## Step by Step Implementation

**Record the tables**

Extend the `music.ts` bullet in `SPECIFICATION.md` under Constants with the pow2 lookup tables and fallback contract.

File to modify: `docs/SPECIFICATION.md`.

**Add the lookup tables**

In `src/constants/music.ts` add `POW2_OCTAVE_SCALE` (integer exponents -8..+8) and `POW2_SEMITONE_SCALE` (integer semitones -48..+48), each `Array.from` built through `Math.pow`, plus `pow2Octave(exponent)` and `pow2Semitone(semitones)` helpers that return the table entry for in-domain integers and `Math.pow` otherwise.

File to modify: `src/constants/music.ts`.

**Accumulate the noise gain in one loop**

Replace the `.some()` + `.filter().map().reduce()` chain in `updateAudioNodes` with one `for` loop accumulating the log-table sum; keep `Math.min(1, sum) * 0.4` and the `else` silence branch - a zero sum drives `setValueAtTime(0)` exactly as before.

File to modify: `src/synth/YM2149.ts`.

**Route the emulator pow sites**

Replace `Math.pow(2, noteData.octave - NOTE_BASE_OCTAVE)` with `pow2Octave(noteData.octave - NOTE_BASE_OCTAVE)` and `Math.pow(2, shiftSemitones / 12)` with `pow2Semitone(shiftSemitones)` in `updateChannelWithInstrument`.

File to modify: `src/synth/YM2149.ts`.

**Route the simulation pow sites**

Replace `Math.pow(2, note.octave - NOTE_BASE_OCTAVE)` with `pow2Octave(note.octave - NOTE_BASE_OCTAVE)` and `Math.pow(2, shift / 12)` with `pow2Semitone(shift)` in `applyInstrumentToRegisters`.

File to modify: `src/utils/playback/playbackSimulation.ts`.

## Implementation Order

1. Update documentation
2. Add tables and helpers to `music.ts`
3. Rewrite the noise-gain accumulation
4. Route the four pow sites
5. Add unit tests for the helpers
6. Run verification loop

## Testing Strategy

**Unit tests**

Create `test/constants/music.test.ts` asserting `pow2Octave` and `pow2Semitone` equal `Math.pow` at every covered integer in domain, at the boundaries, for non-integer input, and beyond the table bounds.

Test file to create: `test/constants/music.test.ts`.

**Integration tests**

`test/synth/YM2149Noise.test.ts` pins the combined noise-gain formula and cap; `test/synth/YM2149Instrument.test.ts` pins exact shift +-12 periods; `test/exports/` pins the register stream byte-exactly.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Manually verify a song with noise and shift envelopes sounds identical
