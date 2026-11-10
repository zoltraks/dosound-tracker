# Consolidate the Preview-Envelope Engine Implementation Plan

## Summary

| Field         | Value                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Intent        | Replace five divergent copies of the preview-envelope engine with one shared implementation            |
| Key decisions | a ref-driven `usePreviewEnvelope` hook in `src/hooks/playback/` with per-key voices, per-start options |
| Open risks    | audio timing must be preserved; reduced variants keep their reduced semantics through engine options   |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.9/consolidate-preview-envelope-engine.md`.

## Analysis

The canonical engine (TrackPanel, PianoKeyboard, and copy A of `useMidiActions`) is: sustain index resolution, step-0 apply, a `window.setInterval` driving `advancePreviewEnvelopeTick` and `getPreviewEnvelopeApplyStep`, sustain clamp and release tracking, and auto-stop on `released && step >= lastVolumeIndex && lastVolumeValue <= 0` writing `0x08 + channel = 0`.

Divergences found per call site:

- `TrackPanel.tsx` - canonical, monophonic single key, `onHardStopLivePreview` + `onPreviewMidiNoteOff` callbacks, `pressedNoteKeysRef` input tracking (stays in the component).
- `PianoKeyboard.tsx` - canonical, per-key state maps, `onPreviewMidiNoteOff` on stop.
- `HeaderPanel.tsx` - reduced variant: no sustain, no release, no catch-up, no auto-stop. Migrating with `honorSustain: false` reproduces it exactly.
- `useMidiActions.ts` - two copies (track-focused and unfocused). Copy B inlines the helper math instead of importing it. Velocity-derived `volumeModifier`, MIDI-out callbacks via `midiHelpersRef`, release matched through `lastMidiPreviewRef` (stays call-site). Auto-stop omits the MIDI noteOff - a real divergence deferred to its own record (`docs/change/1.4.0/send-midi-noteoff-on-preview-autostop.md`).
- `useInstrumentActions.ts` - half-engine: no sustain/release/catch-up, hard `step >= 64` cap. Migrating with `stopAfterStep: 64` and `honorSustain: false` reproduces it. The engine instance is created inside `useInstrumentActions` and its `stopInstrumentPreview` is returned to `App.tsx`, replacing the shared `playInstTimerRef`/`playInstStepRef` that `usePlaybackHandlers` clears today.

The record's localStorage claim does not hold: none of the five files performs direct `localStorage` I/O. The documented exception panels (`PlaylistPanel`, `ToneNoisePanel`, `EnvelopePanel`) are untouched.

## Best Practices

Follow `docs/standard/typescript-audio-development.md`: audio-rate state lives in refs, never React state - the tick path is allocation-free after start - no new re-renders on the audio path. `// REASON:` comments mark deliberate deviations. `docs/standard/typescript-react-development.md` applies for the hook shape and naming.

## Audio-Critical Requirements

- The engine is ref-driven: voices live in a `Map` inside a `useRef` - options are mirrored into a ref each render so callbacks never churn.
- `useCallback`/`useMemo` dependency arrays stay sparse by design - the returned methods are `useCallback` with empty dependency arrays reading `optionsRef`.
- State management pattern unchanged: no `useState` additions on the audio path.
- YM2149 emulator and SoundDriver untouched.
- Manual audio verification: play a preview note from each surface (track panel, piano keyboard, octave panel, MIDI input, instrument play button) and compare envelope behavior, sustain, and release against the baseline.

## Documentation Updates

Per project guidelines, the project specification update is the first implementation step.

- `SPECIFICATION.md` - add `src/hooks/playback/usePreviewEnvelope.ts` to the Shared Utilities convention list as the canonical preview-envelope engine.
- `ARCHITECTURE.md` - note the shared preview-envelope hook in the hooks module description.

## Type and State Updates

**Type definitions**

New types in the hook file: `PreviewEnvelopeOptions` (`ym2149`, `onAutoStop`), `PreviewEnvelopeStartOptions` (`channel`, `instrument`, `noteData`, `tickIntervalMs`, `volumeModifier?`, `honorSustain?`, `stopAfterStep?`), and the hook's result (`start`, `release`, `stop`, `hasState`).

**State store modifications**

None. `playInstTimerRef`/`playInstStepRef` in `App.tsx` are removed - `usePlaybackHandlers` receives `stopInstrumentPreview` instead.

## Step by Step Implementation

**Create the shared engine**

`src/hooks/playback/usePreviewEnvelope.ts`: voices `Map<string, PreviewVoice>` in a ref - `optionsRef` mirrored each render - methods `start`, `release` (returns true when the voice has sustain), `stop` (per keyId or all), `hasState`. `start` stops every existing voice first - all five surfaces are channel-monophonic. Auto-stop fires on the released-tail condition or `stopAfterStep`, writes `0x08 + channel = 0`, and invokes `onAutoStop`.

**Migrate `TrackPanel.tsx`**

Replace the seven engine refs and the `playPreviewNote`/`stopPreview` internals with the hook - keep `pressedNoteKeysRef`, `hasPreviewState`, `onRegisterStopPreview`, and the keyup release wiring. `stopPreview` = `preview.stop()` + `onHardStopLivePreview` + `onPreviewMidiNoteOff` + pressed-key clear. `onAutoStop` calls `onPreviewMidiNoteOff(channel)`.

**Migrate `PianoKeyboard.tsx`**

Replace the seven per-key maps and `playNote`/`stopNote` internals - keep `pressedKeys` state and key lifecycle. Stale-key guard becomes `preview.hasState(keyId)` - release becomes `preview.release(keyId)` else `preview.stop(keyId)`.

**Migrate `HeaderPanel.tsx`**

Replace `previewTimerRef`/`previewSubTickRef`/`previewEnvelopeStepRef` and the interval body - call `start` with `honorSustain: false` - `stopPreview` = `preview.stop()` + `onPreviewMidiNoteOff`. The `previewTimerRef.current !== null` guard becomes `preview.hasState()`.

**Migrate `useMidiActions.ts`**

Collapse both copies' engine portions onto one `start`/`release`/`stop` path. Velocity becomes `volumeModifier` at `start`. `handleHardStopLivePreview` becomes `preview.hasState()` guard + `preview.stop()` + MIDI noteOff + register write (engine writes it). `lastMidiPreviewRef` matching stays. Auto-stop keeps its current no-noteOff behavior - the divergence defers to `docs/change/1.4.0/send-midi-noteoff-on-preview-autostop.md`.

**Migrate `useInstrumentActions.ts` and `usePlaybackHandlers.ts`**

`useInstrumentActions` instantiates the hook, calls `start('play', ..., { honorSustain: false, stopAfterStep: 64 })`, and returns `stopInstrumentPreview`. `App.tsx` drops `playInstTimerRef`/`playInstStepRef` and passes `stopInstrumentPreview` to `usePlaybackHandlers`, which calls it instead of `clearIntervalRef(playInstTimerRef)`.

**Add engine tests**

`test/hooks/playback/usePreviewEnvelope.test.tsx` with `vi.useFakeTimers`: start applies step 0 and advances every 2 ticks - sustain clamps while unreleased - release advances past sustain and auto-stops at the tail writing the volume register - `stopAfterStep` stops at the cap - `stop()` clears and writes the register.

## Implementation Order

1. Update `SPECIFICATION.md` and `ARCHITECTURE.md` (first implementation step).
2. Create the engine hook and its unit tests.
3. Migrate call sites one at a time: `useInstrumentActions` (+ `usePlaybackHandlers` + `App.tsx`), `HeaderPanel`, `PianoKeyboard`, `TrackPanel`, `useMidiActions`.
4. Run the verification loop after each migration (targeted lint/typecheck), then the full loop.
5. Write the deferred change record for the MIDI auto-stop noteOff divergence.

## Testing Strategy

**Unit tests**

`test/hooks/playback/usePreviewEnvelope.test.tsx` - fake-timer driven assertions on `updateChannelWithInstrument` call order, sustain clamping, release/auto-stop, `stopAfterStep`, and register writes.

**Integration tests**

No new integration tests - existing suites cover the call-site surfaces - the engine contract is unit-tested.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, `npm test` after each migration - full loop at completion.
- Manual audio verification on all five surfaces per the audio-critical requirements.
