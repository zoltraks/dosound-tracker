# Add Ayumi Sound Engine as Selectable Alternative Implementation Plan

## Summary

| Field         | Value                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| Intent        | Introduce a `SoundEngine` contract, port the Ayumi YM2149 core to TypeScript, and render it in a worklet    |
| Key decisions | `internal`/`ayumi` engine ids; `?worker&url` bundling for the worklet; register mirror on the main thread   |
| Open risks    | `?worker&url` emission under the rolldown build needs verification; a plain-JS worklet file is the fallback |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.6/ayumi-sound-engine.md`.

## Best Practices

Follow TypeScript and React engineering standards from `standard/typescript-react-development.md` and `standard/typescript-audio-development.md`:

- Functional components only with proper TypeScript interfaces.
- TypeScript strict mode with no `any` types.
- Tick handlers and audio-path code stay allocation-light - reuse buffers and keep per-message work bounded.
- Metronome-critical rendering runs off the main thread - sample synthesis lives inside `AudioWorkletProcessor`.
- Worker and worklet modules are constructed through `new URL` or query-suffixed specifiers treated as import specifiers in every move or rename.
- No abbreviations in identifiers.

## Audio-Critical Requirements

- Does this change affect React render timing? No. The engine swap touches `useAudioSetup` only - hook count and dependency arrays in App.tsx stay unchanged. The intentional `eslint-disable` headers and sparse dependency arrays on audio paths are preserved.
- Does this modify `useCallback` or `useMemo` dependencies? No. Sequencer callback dependencies are untouched.
- Does this change state management patterns in audio paths? No. Register writes keep flowing through `ym2149Ref`, retyped to the `SoundEngine` interface.
- Does this modify the YM2149 emulator or SoundDriver? The `YM2149` class gains an `implements` clause and its instrument helpers delegate to a shared module - observable behaviour is unchanged. `SoundDriver.ts` is untouched.
- Must audio playback be manually tested after the change? Yes. Manual audio verification is the final gate per `standard/typescript-audio-development.md`.

Consult `SPECIFICATION.md` for the audio-critical development principles before making any changes to audio-related code.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

- `ARCHITECTURE.md` - the `synth` module holds two engines behind the `SoundEngine` contract plus the worklet renderer. The playback pipeline step names the selected engine.
- `SPECIFICATION.md` - the sound-engine vocabulary (`internal`, `ayumi`), the `SoundEngine` contract surface, the Ayumi register mapping, the persisted engine-selection key, and the mono output decision.
- `COPYRIGHTS.md` - third-party code entry for the Ayumi port: Peter Sovietov and Alexander Kovalenko, MIT license, source repositories recorded.
- `PROJECT.md` - F-05 and F-06 wording keeps the emulation requirement while noting the selectable engines.
- `FORMAT.md` - no changes. No file format changes.

## Type and State Updates

**Type definitions**

New file `src/constants/sound.ts` carries the engine vocabulary beside the other domain constants.

```typescript
export const SOUND_ENGINE_IDS = ['internal', 'ayumi'] as const;
export type SoundEngineId = (typeof SOUND_ENGINE_IDS)[number];
export const DEFAULT_SOUND_ENGINE_ID: SoundEngineId = 'internal';
export const SOUND_ENGINE_LABELS: Record<SoundEngineId, string> = {
  internal: 'Internal',
  ayumi: 'Ayumi',
};
```

New file `src/synth/soundEngine.ts` carries the contract and factory.

```typescript
export interface SoundEngine {
  writeRegister(register: number, value: number): void;
  beginBatch(): void;
  endBatch(): void;
  updateChannelWithInstrument(
    channel: number,
    instrument: Instrument,
    noteData?: { note: string; octave: number },
    envelopeTick?: number,
    volumeModifier?: number | null,
  ): void;
  silenceAll(): void;
  reset(): void;
  setClock(clock: number): void;
  getClock(): number;
  getRegisters(): YMRegisters;
  getRegistersArray(): number[];
  getState(): YMState;
  dispose(): void;
}
```

**State store modifications**

No changes to `src/hooks/ui/useUiStore.ts`. The engine id is persisted through a local-storage key, matching the existing settings persistence pattern, and is not part of the saved song format.

## Step by Step Implementation

**Extract the shared channel-instrument logic**

The five helpers inside `YM2149` (`updateChannelWithInstrument`, `getModeValueForTick`, `getToneNoiseState`, `updateMixerForChannel`, `applyNoiseEnvelopeValue`) translate instrument envelopes into register writes. Move them into a new module operating on a minimal write surface so both engines share the identical logic.

File to create: `src/synth/channelInstrument.ts`.

```typescript
export interface RegisterWriter {
  writeRegister(register: number, value: number): void;
  beginBatch(): void;
  endBatch(): void;
}
```

File to modify: `src/synth/YM2149.ts` - the public method delegates to the shared implementation. The public signatures stay identical, so the four `test/synth/` suites keep passing unchanged.

**Define the engine contract and vocabulary**

Create the `SoundEngine` interface and a factory that resolves an id to a constructor. `YM2149` declares `implements SoundEngine` - no behavioural change.

File to create: `src/constants/sound.ts` and `src/synth/soundEngine.ts`.

```typescript
export async function createSoundEngine(
  id: SoundEngineId,
  audioContext: AudioContext,
  clock: number,
): Promise<SoundEngine> {
  return id === 'ayumi' ? AyumiEngine.create(audioContext, clock) : new YM2149(audioContext, clock);
}
```

**Add the persisted engine-selection reader**

The settings surface binds to this contract. A reader validates the stored value against `SOUND_ENGINE_IDS` and falls back to `internal`.

File to create: `src/utils/storage/soundEngine.ts`.

```typescript
export const SOUND_ENGINE_KEY = 'dosound-tracker-sound-engine';
export function loadSoundEngineId(): SoundEngineId;
```

File to modify: `src/utils/storage/storageKeys.ts` - add `SOUND_ENGINE` to the `StorageKeys` map and have the reader use it.

**Vendor the Ayumi core**

TypeScript port of `ayumi.js` (Peter Sovietov, MIT; JS port by Alexander Kovalenko, MIT). Pure DSP with no Web Audio dependency, so it runs in the worklet, in tests under Node, and later in offline renderers. The MIT notice stays in the file header per `COPYRIGHTS.md` and the `zx0.ts` precedent.

File to create: `src/synth/ayumiCore.ts`.

```typescript
export class AyumiCore {
  configure(isYm: boolean, clockRate: number, sampleRate: number): void;
  setPan(channel: number, pan: number, isEqp: boolean): void;
  setTone(channel: number, period: number): void;
  setNoise(period: number): void;
  setMixer(channel: number, tOff: number, nOff: number, eOn: number): void;
  setVolume(channel: number, volume: number): void;
  setEnvelope(period: number): void;
  setEnvelopeShape(shape: number): void;
  process(): void; // advances one output sample into left/right
  removeDc(): void;
  left: number;
  right: number;
}
```

**Build the worklet processor**

`AudioWorkletProcessor` that owns an `AyumiCore` configured `isYm = true` at the context sample rate, all channels panned centre. It applies register messages by replaying them through a translation table, keeps its own 14-register mirror for clock-change resync, and renders each output block by looping `process()` plus `removeDc()` into channel 0.

File to create: `src/workers/ayumiWorklet.ts`.

```typescript
// Register to setter mapping inside the worklet.
// R0-R5 -> setTone(channel, 12-bit period)
// R6    -> setNoise(period & 0x1f)
// R7    -> setMixer(channel, toneOff, noiseOff, envOn) per channel
// R8-R10-> setVolume(channel, value & 0x0f) + envOn bit into setMixer
// R11-12-> setEnvelope(16-bit period)
// R13   -> setEnvelopeShape(shape & 0x0f)
```

Messages are `{ type: 'write', register, value }`, `{ type: 'writes', pairs }`, `{ type: 'clock', clock }`, and `{ type: 'reset' }`. A clock change reconfigures the core and replays the mirrored registers because `configure` resets tone and envelope state.

**Implement the AyumiEngine facade**

Main-thread class implementing `SoundEngine`. `AyumiEngine.create` awaits `audioContext.audioWorklet.addModule(url)`, constructs an `AudioWorkletNode` with `outputChannelCount: [1]`, connects it to `audioContext.destination`, and returns the facade. `writeRegister` updates the main-thread mirror and posts a `write` message; `endBatch` coalesces a pending batch into one `writes` message. `getState` derives `YMState` from the mirror through a shared `deriveYmState` helper extracted in the first step. `dispose` disconnects the node and closes the port.

File to create: `src/synth/AyumiEngine.ts`.

```typescript
import workletUrl from '../workers/ayumiWorklet.ts?worker&url';

static async create(audioContext: AudioContext, clock: number): Promise<AyumiEngine> {
  await audioContext.audioWorklet.addModule(workletUrl);
  const node = new AudioWorkletNode(audioContext, 'ayumi-processor', {
    outputChannelCount: [1],
  });
  node.connect(audioContext.destination);
  return new AyumiEngine(node, clock);
}
```

`?worker&url` emits a self-contained ES bundle, so `ayumiCore` inlines into the worklet file and the CSP `script-src 'self'` stays satisfied. If the query fails under the current Vite build, the fallback is a self-contained plain-JS worklet under `public/` loaded via `addModule('ayumi-worklet.js')` - the fallback is verified only if the primary route fails.

**Rewire the audio setup**

`useAudioSetup` gains an `engineId` parameter defaulting to the persisted selection. Engine creation moves behind `createSoundEngine`, which resolves asynchronously for `ayumi`. The effect tracks the requested id, disposes the previous engine, and guards against a stale async resolve landing after a newer request.

File to modify: `src/hooks/audio/useAudioSetup.ts`.

```typescript
useEffect(() => {
  let cancelled = false;
  void createSoundEngine(engineId, audioContext, chipClock).then((engine) => {
    if (cancelled) {
      engine.dispose();
      return;
    }
    ym2149Ref.current = engine;
    setYm2149(engine);
  });
  return () => {
    cancelled = true;
    ym2149Ref.current?.dispose();
    ym2149Ref.current = null;
  };
}, [audioContext, engineId]);
```

The existing test-tone oscillator, resume handler, and `window.ym2149` debug exposure are unchanged - the debug handle becomes a `SoundEngine`.

**Retype the consumer surface**

Every consumer holding `YM2149` by type moves to the `SoundEngine` interface with no runtime change: `src/utils/playback/playbackUtils.ts`, `src/hooks/playback/usePlaybackSimulation.ts`, `src/hooks/playback/usePlaybackBridge.ts`, `src/hooks/playback/usePreviewEnvelope.ts`, `src/hooks/sequencer/useSequencerIntegration.ts`, `src/hooks/midi/useMidiActions.ts`, `src/hooks/instrument/useInstrumentActions.ts`, `src/hooks/audio/useAudioSetup.ts`, `src/components/DumpPanel.tsx`, `src/components/EQPanel.tsx`, `src/components/PianoKeyboard.tsx`, `src/components/TrackPanel.tsx`, `src/components/TrackerSection.tsx`, `src/components/SongSection.tsx`, `src/components/HeaderPanel.tsx`, and `src/App.tsx`. `YM_CLOCK` and `YM_LOG_VOLUME_TABLE` stay exported from `src/synth/YM2149.ts`.

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation (`ARCHITECTURE.md`, `SPECIFICATION.md`, `COPYRIGHTS.md`, `PROJECT.md`).
2. Extract `src/synth/channelInstrument.ts` and delegate from `YM2149`.
3. Create `src/constants/sound.ts`, `src/synth/soundEngine.ts`, and `src/utils/storage/soundEngine.ts`.
4. Vendor `src/synth/ayumiCore.ts` and add `test/synth/ayumiCore.test.ts`.
5. Create `src/workers/ayumiWorklet.ts` and verify the `?worker&url` build emits the bundle.
6. Create `src/synth/AyumiEngine.ts`.
7. Rewire `src/hooks/audio/useAudioSetup.ts` and retype consumers.
8. Add remaining tests.
9. Run verification loop.

## Testing Strategy

**Unit tests**

`ayumiCore` runs under Node with no DOM. Deterministic DSP assertions: register-level silence produces zero output, a tone write produces periodic nonzero output, a higher tone period lowers the measured fundamental, noise-only output is non-periodic, envelope shapes move through their segments, and volume steps follow the YM DAC table ordering. `AyumiEngine` tests use a mocked worklet node: mirror contents, batch coalescing into a single `writes` message, `silenceAll` and `reset` semantics, and `dispose` behaviour. Factory tests cover id resolution and the invalid-id fallback.

Test file to create: `test/synth/ayumiCore.test.ts`.

```typescript
const core = new AyumiCore();
core.configure(true, 2_000_000, 44100);
core.setMixer(0, 0, 1, 0);
core.setVolume(0, 15);
core.setTone(0, 284);
const samples = render(core, 4410);
expect(samples.some((v) => v !== 0)).toBe(true);
```

Test file to create: `test/synth/AyumiEngine.test.ts` and `test/utils/storage/soundEngine.test.ts`.

```typescript
expect(readStoredEngine('ayumi')).toBe('ayumi');
expect(readStoredEngine('bogus')).toBe('internal');
```

**Integration tests**

The existing `test/synth/` YM2149 suites are the regression net for the `internal` path and must pass unchanged. A selection test covers `createSoundEngine` returning the right class per id. Manual verification covers piano preview, song playback, and engine switching with audible output on both engines.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build` - confirm the emitted worklet bundle lands in `dist/js/`
- Run `npm test`
- Manually verify engine selection, piano preview, song playback, and Dump/EQ display on both engines
- For audio-related changes, manually verify playback timing and audio stability
