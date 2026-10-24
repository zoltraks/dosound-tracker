# Close the Coverage Gap Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.1/close-coverage-gap.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`:

- One test file per module under `test/`, named `<module>.test.ts` or `.test.tsx`.
- Cover happy paths, edge cases, and error conditions.
- Mock external dependencies and browser APIs.
- `console.log` in tests only inside try-catch around assertions, per `TESTING.md`.
- No `any` types in spec code.

## Audio-Critical Requirements

- **Audio impact assessment**: the change adds test files only. No production code, render timing, dependency arrays, or audio-path state management is modified.
- **Timing stability verification**: not applicable - no runtime code changes.
- **Linting exception documentation**: no new linting exceptions.
- **Playback simulation**: sequencer and driver tests exercise `SoundDriver`, `SequencerEngine`, and the export simulation synchronously; YM2149 tests substitute a stub `AudioContext` factory so no real audio device is touched.

## Documentation Updates

- `TESTING.md` — update the coverage-gap note once `npm run test:coverage` passes, and record any per-file gaps that stay below threshold per the change record's second acceptance clause.

No changes to `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, or `FORMAT.md` are required.

## Type and State Updates

**Type definitions**

No application type changes.

**State store modifications**

No store changes.

## Step by Step Implementation

The baseline is 60.41% statements, 50.23% branches, 67.03% functions, 60.57% lines over the imported set. The change record names parsing, export, and sequencer paths as the highest-risk targets, so the steps order from the largest uncovered pools in the counted set outward.

**Cover the synth core**

`SoundDriver.ts` (3.77% lines) and `YM2149.ts` (1.27% lines) hold the largest uncovered pools. `SequencerEngine.ts` is already at 92.85% and `EventOptimizer.ts` at 8.33%.

File to create: `test/synth/SoundDriver.test.ts`.

- Song/Pattern/Instrument model helpers, `setPlaybackSpeed` clamping to even values with `MIN_DELAY_CYCLES`, register-write and delay event generation per frame, DOSOUND marker constants.

File to create: `test/synth/YM2149.test.ts`.

- Stub `AudioContext` (oscillator, gain, noise buffer, envelope gain nodes) so the class instantiates under jsdom. Cover the register file R0-R13, batch writes, logarithmic volume table mapping, clock selection (1 MHz vs 2 MHz period math), and mixer active-low semantics.

File to create: `test/synth/EventOptimizer.test.ts`.

- Redundant register-write removal and delay coalescing over a small synthetic event stream.

**Raise export coverage**

`core.ts` (53%), `asm.ts` (66%), and `bin.ts` (76%) finish the export set.

File to update: `test/utils/exportCore.test.ts` or a new `test/exports/` file matching the module under test.

- `normalizeSongForExport` defaults, `parseBaseKeyForExport` variants, `formatPitchDelta`, `exportInstrumentWith`, `downloadFile` re-export.
- `asm.ts` simple/complex/optimized strategies and the silenced-channel data exclusion.
- `bin.ts` `dc.b` parsing edge cases.

**Close utility gaps**

Uncovered pools in `src/utils/`: `pianoUtils.ts` (0%), `playbackUtils.ts` (39%), `midiUtils.ts` (15%), `songParser.ts` (69%), `songIO.ts` (71%), `instrumentIO.ts` (71%), `envelopeUtils.ts` (61%), `trackUtils.ts` (80%), `validation.ts` (59%), `envelopeTypes.ts` (39%), `envelopeTiming.ts` (0%), `instrumentSelection.ts` (33%), `instrumentOperations.ts` (0%).

File to create or update: one `test/utils/<module>.test.ts` per module.

- Parsing paths: `parseSongFromYaml` loader rules, clamping, run expansion, invalid input fallbacks.
- Pure utilities: direct input/output assertions.

**Cover hooks**

Uncovered pools in `src/hooks/`: `useInstrumentManagement` (0%), `useSongManagement` (0%), `useMidiMessageProcessing` (11%), `useMidiActions` (33%), `useMidiDeviceManagement` (0%), `useDataManagement` (47%), `useStorage` (33%), plus partial files.

File to create or update: `test/hooks/<hook>.test.tsx` via `renderHook`.

- Hook-level state transitions with jsdom and the existing localStorage setup.
- MIDI processing with synthetic `Uint8Array` messages; Web MIDI API stubbed.

**Cover counted components and modals**

`TrackPanel.tsx` (48%), `TrackLine.tsx` (63%), `ColorPicker.tsx` (81%), and `FilePickerModal.tsx` (52%) are already in the denominator.

File to update: `test/components/TrackPanel.test.tsx`, `test/components/FilePickerModal.test.tsx`, `test/components/ColorPicker.test.tsx`.

- Rendering, click handlers, cursor movement, and modal open/close behaviour through testing-library.

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation
2. Synth core tests
3. Export tests
4. Utility tests
5. Hook tests
6. Component and modal tests
7. Run verification loop

## Testing Strategy

**Unit tests**

The deliverable is the test suite itself. Every new file asserts real behaviour - no trivial smoke tests written only to move counters.

**Integration tests**

Hook tests run through `renderHook` with the real store and localStorage setup, exercising cross-module behaviour rather than mocks of the code under test.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Run `npm run test:coverage` until all four metrics meet 80 percent
