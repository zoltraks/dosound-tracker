# Implement Replay Rate and Chip Clock Audio Support Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.2.7/replay-rate-clock-audio.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Props interface named with `Props` suffix
- Destructure props in function signature
- Maintain accessibility with proper ARIA attributes
- Keep components focused on single responsibility
- No abbreviations in identifiers (use full words)

## Audio-Critical Requirements

This change directly affects audio playback, timing, the sequencer, and the YM2149 emulator. The following questions must be addressed:

- **Does this change affect React render timing?** Yes. The `useSequencer` hook receives a new `frameRate` parameter that drives the worker tick interval. The `useSequencerIntegration` hook receives `frameRate` and `chipClock` that flow into the YM2149 instance. These must be threaded through using the existing prop-mirroring and sparse-dependency-array patterns.
- **Does this modify `useCallback` or `useMemo` dependencies?** Minimally. The `calculateTickInterval` callback in `useSequencer` must use the frame rate. Per `GUIDELINES.md`, sparse dependency arrays are intentional in audio paths; only the frame rate ref should be added.
- **Does this change state management patterns in audio paths?** No new state domains. The frame rate and chip clock are read from `currentSong` and passed as parameters, mirroring how `songSpeed` and `patternLength` are already handled.
- **Does this modify the YM2149 emulator or SoundDriver?** Yes. The `YM2149` class gains a `clock` instance property. The `SoundDriver.VBLANK_RATE` constant remains as a default but is no longer used directly in the playback path.
- **Must audio playback be manually tested after the change?** Yes. Playback at 50 Hz / 2 MHz must be identical to before. Playback at 60 Hz must tick faster. Playback at 1 MHz must produce the same pitch with halved period values.

Consult `GUIDELINES.md` for the audio-critical development principles before making any changes to audio-related code.

**Audio impact assessment**

The change touches the innermost timing loop (worker tick interval) and the innermost synthesis path (YM2149 clock). The risk is high. Mitigations:

- The worker already accepts `tickInterval` via `setParams`; we only change how the value is computed.
- The YM2149 clock is used in three places inside the class (tone frequency, noise frequency, period-from-frequency). All three switch to the instance property.
- The preview timers already accept `tickIntervalMs` in `previewEnvelopeTiming.ts`; we only change what callers pass.

**Timing stability verification**

- Run the full verification loop (typecheck, lint, build, test) before and after.
- Verify that 50 Hz / 2 MHz playback is byte-identical to the pre-change baseline by comparing export outputs (VGM, MAX, WAV) of a fixture song before and after.
- Verify that 60 Hz exports produce the correct sample counts (735 per tick instead of 882).
- Verify that 1 MHz exports produce halved period values in the register stream.

**Linting exception documentation**

No new linting exceptions are introduced. The existing audio-critical exceptions in `useSequencer` and `useSequencerIntegration` (sparse dependency arrays, setState in effect) remain unchanged.

**Playback simulation**

The `simulateSong` function in `playbackSimulation.ts` is the core of all export paths. It must accept the clock value and use it in `applyInstrumentToRegisters`. The existing tests in `test/synth/SequencerEngine.test.ts` and the export tests serve as regression coverage.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

- `PROJECT.md` — update F-14 to reflect that audio playback and export support is now implemented (not just UI controls).
- `ARCHITECTURE.md` — update the Audio Synthesis Pipeline section to document that the YM2149 clock and sequencer frame rate are configurable per song.
- `SPECIFICATION.md` — update the YM2149 Register Mapping section (clock is configurable), the Sequencer Timing section (frame rate is configurable, tick interval derived from song.frame), and the Export Formats section (VGM and MAX write the configured clock and frame rate).
- `FORMAT.md` — no save format changes (frame and clock fields already documented). Update the EXPORT VGM and EXPORT MAX sections to document that the chip clock and frame rate are read from the song.

## Type and State Updates

**Type definitions**

No new types needed. The `Song` interface already has `frame?: number` and `clock?: number`.

**State store modifications**

No store changes. The frame rate and chip clock are read from `currentSong` in `App.tsx` and passed as parameters to hooks, mirroring the existing `songSpeed` and `patternLength` flow.

## Step by Step Implementation

**Add clock parameter to YM2149 class**

Add a `clock` property to the `YM2149` class, set via constructor parameter with default `YM_CLOCK`. Replace all internal uses of the `YM_CLOCK` constant with `this.clock`.

File to modify: `src/synth/YM2149.ts`.

```typescript
export class YM2149 {
  private clock: number;
  // ...
  constructor(audioContext: AudioContext, clock: number = YM_CLOCK) {
    this.audioContext = audioContext;
    this.clock = clock;
    // ...
  }
  // Replace YM_CLOCK with this.clock in:
  // - updateChannel frequency calculation (line ~195)
  // - noise frequency calculation (line ~259)
  // - updateChannelWithInstrument period calculation (line ~428)
}
```

**Add frame rate parameter to useSequencer**

Add a `frameRate` parameter to `useSequencer`. Store it in a ref. Use it in `calculateTickInterval` instead of the hardcoded `VBLANK_RATE`. Post the updated tick interval to the worker when the frame rate changes.

File to modify: `src/hooks/useSequencer.ts`.

```typescript
export const useSequencer = (
  songSpeed: number = 6,
  patternLength: number = 64,
  frameRate: number = DEFAULT_SONG_FRAME
) => {
  const frameRateRef = useRef(frameRate);
  // ...
  const calculateTickInterval = useCallback(() => {
    const baseInterval = 1000 / frameRateRef.current;
    return baseInterval;
  }, []);
  // ...
  // Add effect to update frameRateRef and re-post tickInterval when frameRate changes
};
```

**Pass frameRate from usePlaybackControls to useSequencer**

Add `currentSong.frame` to the `useSequencer` call in `usePlaybackControls`.

File to modify: `src/hooks/usePlaybackControls.ts`.

```typescript
} = useSequencer(
  currentSong.speed,
  currentSong.length || PATTERN_LENGTH,
  currentSong.frame ?? DEFAULT_SONG_FRAME
);
```

**Add an updateFrameRate function to useSequencer**

Add a function that updates the frame rate ref and re-posts the tick interval to the worker, mirroring `updateSpeed` and `updatePatternLength`.

File to modify: `src/hooks/useSequencer.ts`.

```typescript
const updateFrameRate = useCallback((rate: number) => {
  frameRateRef.current = rate;
  if (workerRef.current) {
    workerRef.current.postMessage({
      type: 'setParams',
      data: { tickInterval: calculateTickInterval() }
    });
  }
}, [calculateTickInterval]);
```

**Wire frameRate update from usePlaybackControls**

Add an effect in `usePlaybackControls` that calls `updateFrameRate` when `currentSong.frame` changes, mirroring the existing `updateSpeed` effect.

File to modify: `src/hooks/usePlaybackControls.ts`.

```typescript
useEffect(() => {
  updateFrameRate(currentSong.frame ?? DEFAULT_SONG_FRAME);
}, [currentSong.frame, updateFrameRate]);
```

**Pass chipClock to useAudioSetup and YM2149**

Add a `chipClock` parameter to `useAudioSetup`. Pass it to the `YM2149` constructor. Store it in a ref so the YM2149 instance can be updated when the clock changes. Since the YM2149 instance is created once in a `useEffect`, add a method to `YM2149` to update the clock at runtime, or recreate the instance when the clock changes.

The simplest approach that preserves audio stability: add a `setClock` method to `YM2149` that updates the `clock` property. Call it from `useAudioSetup` when the `chipClock` prop changes.

File to modify: `src/hooks/useAudioSetup.ts`.

```typescript
export function useAudioSetup(chipClock: number = DEFAULT_SONG_CLOCK): UseAudioSetupResult {
  // ...
  const ymInstance = new YM2149(audioContext, chipClock);
  // ...
  // Add effect to update clock when chipClock changes
  useEffect(() => {
    if (ym2149Ref.current) {
      ym2149Ref.current.setClock(chipClock);
    }
  }, [chipClock]);
}
```

File to modify: `src/synth/YM2149.ts`.

```typescript
public setClock(clock: number): void {
  this.clock = clock;
}
```

**Pass chipClock from App.tsx to useAudioSetup**

File to modify: `src/App.tsx`.

```typescript
const { audioContext, ym2149Ref, ym2149 } = useAudioSetup(
  currentSong.clock ?? DEFAULT_SONG_CLOCK
);
```

**Update useAudioSetup test tone to use the passed clock**

Replace the hardcoded `2000000` in the test tone calculation with the passed clock value.

File to modify: `src/hooks/useAudioSetup.ts`.

```typescript
const testPeriod = Math.floor(chipClock / (16 * testFrequency));
```

**Update preview envelope timers to use dynamic tick interval**

The preview timers in PianoKeyboard, TrackPanel, HeaderPanel, useMidiActions, and useInstrumentActions currently hardcode `TICK_INTERVAL_MS = 20` or `}, 20)`. These must use the song's frame rate to compute `1000 / frameRate`.

The cleanest approach: thread `frameRate` from `currentSong` through to these components and hooks. Each caller computes `tickIntervalMs = 1000 / (frameRate ?? DEFAULT_SONG_FRAME)` and passes it to `advancePreviewEnvelopeTick` or uses it in its timer setup.

Files to modify:

- `src/components/PianoKeyboard.tsx` — replace hardcoded `TICK_INTERVAL_MS = 20` with a prop `tickIntervalMs`.
- `src/components/TrackPanel.tsx` — same.
- `src/components/HeaderPanel.tsx` — same.
- `src/hooks/useMidiActions.ts` — replace hardcoded `TICK_INTERVAL_MS = 20` with a parameter from the song's frame rate.
- `src/hooks/useInstrumentActions.ts` — replace hardcoded `}, 20)` with the dynamic interval.
- `src/utils/previewEnvelopeTiming.ts` — the default `tickIntervalMs = 20` stays as a fallback; callers pass the dynamic value.

**Update playbackSimulation to use dynamic clock**

The `simulateSong` function and `applyInstrumentToRegisters` in `playbackSimulation.ts` use the hardcoded `YM_CLOCK`. Add a `clock` option to `simulateSong` and `applyInstrumentToRegisters`, defaulting to `YM_CLOCK`. Pass it through to the period calculation.

File to modify: `src/utils/playbackSimulation.ts`.

```typescript
export interface SimulationOptions {
  retriggerBehavior?: 'always' | 'never';
  clock?: number;
}

export function simulateSong(song: Song, callback: PlaybackCallback, options: SimulationOptions = {}): void {
  const { retriggerBehavior = 'always', clock = YM_CLOCK } = options;
  // Pass clock to applyInstrumentToRegisters calls
}

export function applyInstrumentToRegisters(
  regs: { [register: number]: number },
  channel: number,
  note: { note: string; octave: number },
  instrument: Instrument,
  envelopeStep: number,
  isNewNote: boolean,
  volumeModifier?: number | null,
  clock: number = YM_CLOCK
): void {
  // ...
  let period = Math.floor(clock / (16 * frequency)) & 0x0FFF;
  // ...
}
```

**Update normalizeSongForExport to include frame and clock defaults**

File to modify: `src/exports/core.ts`.

```typescript
import { DEFAULT_SONG_FRAME, DEFAULT_SONG_CLOCK } from '../constants/song';

export function normalizeSongForExport(song: Song): Song {
  return {
    ...song,
    length: song.length ?? PATTERN_LENGTH,
    line: song.line ?? [],
    pattern: song.pattern ?? [],
    instrument: song.instrument ?? [],
    frame: song.frame ?? DEFAULT_SONG_FRAME,
    clock: song.clock ?? DEFAULT_SONG_CLOCK,
  };
}
```

**Update frequencyToPeriod in exports/core.ts**

Add a `clock` parameter to `frequencyToPeriod`, defaulting to `YM_CLOCK`.

File to modify: `src/exports/core.ts`.

```typescript
export function frequencyToPeriod(frequency: number, clock: number = YM_CLOCK): number {
  return Math.floor(clock / (16 * frequency));
}
```

**Update VGM export for dynamic frame rate and clock**

Replace hardcoded `VBLANK_RATE` and `YM_CLOCK` with values from the normalized song. Select the VGM wait command based on frame rate: `0x63` for 50 Hz, `0x62` for 60 Hz. For other frame rates, use `0x61` with explicit sample counts. Update the delay merging logic to handle both `0x62` and `0x63`.

File to modify: `src/exports/vgm.ts`.

```typescript
export function exportSongToVgm(song: Song, strategy: ExportStrategy = 'simple'): VgmExportResult {
  const normalizedSong = normalizeSongForExport(song);
  const frameRate = normalizedSong.frame ?? DEFAULT_SONG_FRAME;
  const chipClock = normalizedSong.clock ?? DEFAULT_SONG_CLOCK;
  const SAMPLES_PER_TICK = Math.round(44100 / frameRate);
  const waitCommand = frameRate === 50 ? 0x63 : frameRate === 60 ? 0x62 : 0x61;
  // ...
  // In the simulation callback:
  if (waitCommand === 0x61) {
    commands.push(0x61, SAMPLES_PER_TICK & 0xff, (SAMPLES_PER_TICK >>> 8) & 0xff);
  } else {
    commands.push(waitCommand);
  }
  totalSamples += SAMPLES_PER_TICK;
  // ...
  // In the header:
  writeUint32LE(0x24, frameRate);
  writeUint32LE(0x74, chipClock);
}
```

Update `mergeVgmDelaySequence` to handle both `0x62` and `0x63`:

```typescript
function mergeVgmDelaySequence(commands: number[]): number[] {
  // ...
  const SAMPLES_PER_TICK = 882; // This must be passed in or computed from the frame rate
  // Handle both 0x62 (1/60s) and 0x63 (1/50s) merge runs
  if (cmd === 0x62 || cmd === 0x63) {
    let run = 0;
    const firstCmd = cmd;
    while (i < len && commands[i] === firstCmd) {
      run++;
      i++;
    }
    // Merge into 0x61 if run >= 4
    // ...
  }
}
```

The `mergeVgmDelaySequence` function needs to receive `samplesPerTick` and the wait command as parameters, or be refactored to accept them.

**Update MAX export for dynamic frame rate and clock**

Replace hardcoded `VBLANK_RATE` and `YM_CLOCK` with values from the normalized song in the chip setup chunk.

File to modify: `src/exports/max.ts`.

```typescript
const frameRate = normalizedSong.frame ?? DEFAULT_SONG_FRAME;
const chipClock = normalizedSong.clock ?? DEFAULT_SONG_CLOCK;
// ...
chipData.push((frameRate >>> 8) & 0xff, frameRate & 0xff);
chipData.push((chipClock >>> 24) & 0xff, (chipClock >>> 16) & 0xff, (chipClock >>> 8) & 0xff, chipClock & 0xff);
```

Also pass the clock to `simulateSong` in `captureMaxFrames`.

**Update WAV export for dynamic frame rate and clock**

Replace hardcoded `VBLANK_RATE` with the normalized song's frame rate. Replace hardcoded `YM_CLOCK` with the normalized song's clock in the inline synthesizer.

File to modify: `src/exports/wav.ts`.

```typescript
const frameRate = normalizedSong.frame ?? DEFAULT_SONG_FRAME;
const chipClock = normalizedSong.clock ?? DEFAULT_SONG_CLOCK;
const samplesPerTick = Math.max(1, Math.round(WAV_SAMPLE_RATE / frameRate));
// Pass chipClock to synthTickSamples
```

`synthTickSamples` needs a `clock` parameter.

**Update ASM export for dynamic clock**

Replace hardcoded `YM_CLOCK` with the normalized song's clock in `periodToNoteAndPitch`. Pass the clock to `simulateSong`.

File to modify: `src/exports/asm.ts`.

```typescript
const chipClock = normalizedSong.clock ?? DEFAULT_SONG_CLOCK;
// Pass chipClock to simulateSong
simulateSong(normalizedSong, (frame) => { ... }, { clock: chipClock });
// In periodToNoteAndPitch, accept a clock parameter
function periodToNoteAndPitch(period: number, clock: number = YM_CLOCK): { ... } {
  const targetFrequency = clock / (16 * period);
  // ...
  const idealPeriod = Math.floor(clock / (16 * freq));
  // ...
}
```

**Update SoundDriver getNotePeriod for dynamic clock**

The `getNotePeriod` method in `SoundDriver.ts` uses a hardcoded `AY_CLOCK_HZ = 1773400`. This is inconsistent with the rest of the codebase. Replace it with the configured clock. Since `SoundDriver` is a class, add a `clock` property set via constructor or setter.

File to modify: `src/synth/SoundDriver.ts`.

```typescript
export class SoundDriver {
  private clock: number;
  // ...
  constructor(clock: number = YM_CLOCK) {
    this.clock = clock;
  }
  // In getNotePeriod:
  const divider = Math.max(1, Math.round(this.clock / (16 * frequency)));
}
```

Note: `getNotePeriod` is used in `processPattern` for DOSOUND export. Verify whether `SoundDriver` is instantiated for export or only for live playback. If only for live playback, the export path uses `playbackSimulation.ts` instead.

**Update comments referencing hardcoded timing**

Update comments throughout the codebase that reference "20ms", "40ms", "50Hz" to reflect that these values are now dynamic. The comments should describe the relationship (e.g. "tick interval = 1000 / frameRate") rather than hardcoding specific values.

Files to modify: all files with such comments (useSequencer.ts, useSequencerIntegration.ts, PianoKeyboard.tsx, TrackPanel.tsx, HeaderPanel.tsx, useMidiActions.ts, useInstrumentActions.ts, asm.ts, playbackSimulation.ts).

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation (PROJECT.md, ARCHITECTURE.md, SPECIFICATION.md, FORMAT.md)
2. Add clock parameter to YM2149 class
3. Update playbackSimulation to accept dynamic clock
4. Update normalizeSongForExport and frequencyToPeriod in exports/core.ts
5. Update VGM export for dynamic frame rate and clock
6. Update MAX export for dynamic frame rate and clock
7. Update WAV export for dynamic frame rate and clock
8. Update ASM export for dynamic clock
9. Update SoundDriver getNotePeriod for dynamic clock
10. Add frame rate parameter to useSequencer and usePlaybackControls
11. Pass chipClock to useAudioSetup and App.tsx
12. Update preview envelope timers for dynamic tick interval
13. Add or update tests
14. Run verification loop

The export path (steps 3-8) is independent of the live playback path (steps 10-12) and can be verified separately. The YM2149 clock change (step 2) is shared by both paths and must come first.

## Testing Strategy

**Unit tests**

Add tests for the dynamic clock and frame rate in the simulation and export modules.

Test files to create or update:

- `test/utils/exportVgm.test.ts` — add test that a 60 Hz song produces `0x62` wait commands and 735 samples per tick. Add test that a 1 MHz song writes 1000000 to the clock header field and produces halved period values.
- `test/utils/exportMax.test.ts` — add test that a 60 Hz song writes 60 to the chip setup chunk speed field. Add test that a 1 MHz song writes 1000000 to the clock field.
- `test/utils/exportWav.test.ts` — add test that a 60 Hz song produces the correct duration (based on 735 samples per tick instead of 882).
- `test/utils/exportAssemblyOptimized.test.ts` — verify that period values are halved for 1 MHz songs.
- `test/synth/SequencerEngine.test.ts` — no changes needed (SequencerEngine does not use clock or frame rate directly).

```typescript
// exportVgm.test.ts: 60 Hz produces 0x62 wait commands
it('uses 0x62 wait commands for 60 Hz frame rate', () => {
  const song = { ...baseSong, frame: 60 };
  const { buffer } = exportSongToVgm(song);
  const bytes = new Uint8Array(buffer);
  // Find at least one 0x62 command in the data stream
  // ...
});

// exportVgm.test.ts: 1 MHz writes correct clock header
it('writes 1000000 to the AY clock header for 1 MHz songs', () => {
  const song = { ...baseSong, clock: 1000000 };
  const { buffer } = exportSongToVgm(song);
  const view = new DataView(buffer);
  expect(view.getUint32(0x74, true)).toBe(1000000);
});
```

**Integration tests**

No new integration tests needed. The existing component and hook tests verify that the UI and hooks continue to function. The export tests cover the integration of the simulation with the export formats.

**Regression verification**

Compare export outputs (VGM, MAX, WAV) of a fixture song at 50 Hz / 2 MHz before and after the change. The outputs must be byte-identical, confirming no regression for the default case.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Manually verify 50 Hz / 2 MHz playback is unchanged
- Manually verify 60 Hz playback ticks faster
- Manually verify 1 MHz playback produces the same pitch
- Verify export outputs for 50 Hz / 2 MHz are byte-identical to pre-change baseline
