# Expand the Synth and Worker Test Coverage Implementation Plan

## Summary

| Field         | Value                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Intent        | Close the recorded coverage gaps on the audio engine, the sequencer worker, and modal dialogs                          |
| Key decisions | Characterization tests pin current hardware-accurate behavior; `MidiModal` and `MarkdownModal` defer to a later window |
| Open risks    | Worker module state is shared per file - tests must reset via messages, never re-import                                |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.3/expand-synth-test-coverage.md`.

## Analysis

`test/synth/` carries a single file, `YM2149.test.ts`, which pins channel A register decode, batch writes, node updates, and the instrument helpers. Missing: the `YM_LOG_VOLUME_TABLE` contents, channels B and C decode, all six mixer bits, the 20 Hz clamp at 1 MHz, LFSR noise determinism and noise period/gain rules, the `shift` envelope, and edge clamps. `src/workers/sequencerWorker.ts` is untested - its message protocol, tick progression, loop wrap, and the `setParams` tick-interval reschedule are all pin-able by dispatching `MessageEvent`s under jsdom. `src/modals/` is untested beyond `FilePickerModal` (whose test lives in `test/components/`). `TESTING.md` records these exact gaps under Coverage Targets.

## Documentation Updates

- `TESTING.md` — the Coverage Targets gap list loses the `src/workers/` entry and the `src/modals/` entry narrows to the deferred modals.

## Step by Step Implementation

**Update the recorded gap list**

Rewrite the gap bullets in `TESTING.md` to reflect the state after this change: `src/workers/` gains protocol tests and `src/modals/` gains coverage for the selected dialogs.

File to modify: `docs/TESTING.md`.

**Pin the register and volume surfaces**

New file `test/synth/YM2149Registers.test.ts` reusing the `createAudioContextStub` pattern from `YM2149.test.ts`: exact `YM_LOG_VOLUME_TABLE` contents and monotonicity, channels B and C register decode (R2-R5, R9-R10, mixer bits 1-2 and 4-5), all six active-low mixer bits, the 20 Hz frequency clamp reachable at 1 MHz, period-0 and mixer-disabled silence, `silenceAll` preserving non-volume registers, and `getRegisters` copy isolation.

File to create: `test/synth/YM2149Registers.test.ts`.

**Pin the noise generator**

New file `test/synth/YM2149Noise.test.ts`: 17-bit LFSR determinism (first N samples pinned against a test-side reference LFSR with the same taps), `getEffectiveNoisePeriod` mapping 0 to 1, buffer length `ceil(sampleRate * 2)`, regeneration on R6 change, combined noise gain `* 0.4` including the multi-channel cap, and silence when no channel enables noise.

File to create: `test/synth/YM2149Noise.test.ts`.

**Pin the instrument-driven channel update**

New file `test/synth/YM2149Instrument.test.ts`: the `shift` envelope `2^(s/12)` semitone scaling, out-of-range periods clamping to 4095, undefined note data producing silence, envelope tick clamps, `volumeModifier` edges (0 silences, 15 is identity), noise envelope applied only while noise is active, and the 1 MHz clock halving the A-4 period to 142.

File to create: `test/synth/YM2149Instrument.test.ts`.

**Pin the sequencer worker protocol**

New file `test/workers/sequencerWorker.test.ts`: single top-level import of the worker module, `self.postMessage` spy, `MessageEvent` dispatch for `start`, `stop`, `update`, and `setParams`, `vi.useFakeTimers()` with an integer `tickInterval`. Pin the exact tick counts per `advanceTimersByTime`, tick-to-line-to-pattern progression, `ticksPerRow` and `patternLength` boundaries, song-mode playlist advance, `hasLoop` wrap to `loopIndex`, past-end increment, `patternLoop` staying put, the `stop` payload preserving line and pattern while resetting tick, the `update` echo, and the `setParams` `tickInterval` change while playing emitting no `stop` message. Shared module state resets between tests through messages - never `vi.resetModules()` re-import.

File to create: `test/workers/sequencerWorker.test.ts`.

**Pin the selected modal behaviors**

New directory `test/modals/` with one file per selected modal: `InstrumentDeleteModal` (count pluralization, `--` fallback, three callbacks), `ConfirmationModal` and `InformationModal` (literal `\n` splitting, labels, callbacks), `InstrumentTypeWarningModal` (message variants, `typeLabel` fallback, `ignoreFuture`), `ExportModal` (six format buttons to distinct handlers, radios), `PasteTrackModal` and `TransposeModal` (radio dispatch, amount adjustments), `InstrumentColorModal` (Escape/OK/CLEAR, seeded color), and `InstrumentMidiModal` (clamp normalization on save, CLEAR, Enter/Escape). `FilePickerModal.test.tsx` stays in `test/components/` - relocating it is out of scope.

Files to create: `test/modals/InstrumentDeleteModal.test.tsx`, `test/modals/ConfirmationModal.test.tsx`, `test/modals/InformationModal.test.tsx`, `test/modals/InstrumentTypeWarningModal.test.tsx`, `test/modals/ExportModal.test.tsx`, `test/modals/PasteTrackModal.test.tsx`, `test/modals/TransposeModal.test.tsx`, `test/modals/InstrumentColorModal.test.tsx`, `test/modals/InstrumentMidiModal.test.tsx`.

## Implementation Order

1. Update `TESTING.md`
2. Add the synth register tests
3. Add the noise tests
4. Add the instrument tests
5. Add the worker protocol tests
6. Add the modal tests
7. Run the verification loop

## Testing Strategy

This record is the test strategy. Conventions to honor: explicit-extension relative imports, `afterEach(() => cleanup())` in component tests, `console.log` only inside try-catch around assertions, `vi.stubGlobal` for fetch and clipboard, fresh plain-object localStorage spied on directly, integer fake-timer intervals, no `any` (tests typecheck under `tsconfig.app.json`).

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test` - all new suites pass alongside the existing 79 files
- Run `npm run test:coverage` - the enforced 80% thresholds still pass
