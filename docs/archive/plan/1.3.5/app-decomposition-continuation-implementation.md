# Continue App.tsx Decomposition Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.5/app-decomposition-continuation.md`.

## Best Practices

Follow the React engineering standard from `docs/standard/typescript-react-development.md`:

- A hook extracted out of an orchestrating component is called before the earliest consumer of its returned values - the `TS2448` block-scoped error is the symptom of a too-late call.
- Extraction parameters are typed to the source's real signatures, never a guessed shape.
- Hooks must name what they do, not how, per `REFACTORING.md` custom hook extraction.
- Audio-critical constraints from `GUIDELINES.md` are preserved: sparse dependency arrays, prop mirroring, and direct setState calls in hot paths are intentional and stay as they are.
- Every extraction keeps behaviour identical - same memoization boundaries, same dependency arrays, same call order.

## Documentation Updates

Update `ARCHITECTURE.md` and `SPECIFICATION.md` before or alongside the code moves:

- `ARCHITECTURE.md` names the orchestration hooks extracted from `App.tsx` - add the new hooks to that list and refresh the `App.tsx` line count once the moves land.
- `SPECIFICATION.md` repeats the `~1390 lines` figure in Known Limitations - refresh it in the same pass.

## Type and State Updates

No types or stores change. Local `useState` moves with the clusters that own it (`instrumentOctaves`, `trackBackgroundEnabled`, `lastTrackId`, `currentTrackColumn`, `trackFocusRevision`, `instrumentPanelFocusRevision`).

## Step by Step Implementation

**Move note-key helpers into the song format utility**

`formatNoteKey` and `parseBaseKeyString` are module-level functions in `App.tsx` passed into `useTrackOperations`, `useInstrumentActions`, and `useMidiActions` through their injected seams. Move both verbatim into `src/utils/song/songFormat.ts` beside `parseBaseKey` and import them in `App.tsx`.

File to create: none - extend `src/utils/song/songFormat.ts`. File to modify: `src/App.tsx`.

**Extract the song import warning hook**

`configurationWarningMessage`, `handleConfirmSongConfigurationWarning`, and `handleCancelSongConfigurationWarning` form one cluster around `pendingSongImport`. Extract into `src/hooks/song/useSongImportWarning.ts`, which accepts `{ pendingSongImport, confirmPendingSongImport, cancelPendingSongImport }` and returns `{ configurationWarningMessage, handleConfirmSongConfigurationWarning, handleCancelSongConfigurationWarning }`. Called directly after `useDataManagement`.

File to create: `src/hooks/song/useSongImportWarning.ts`. File to modify: `src/App.tsx`.

**Extract the instrument octave hook**

`instrumentOctaves` state, the instrument-octave sync effect, and `handleOctaveChange` form one cluster. Extract into `src/hooks/instrument/useInstrumentOctaves.ts`, which accepts `{ currentInstrument, setCurrentOctave, updateInstrument }` and returns `{ instrumentOctaves, handleOctaveChange }`. Called before `useEditorPersistence`, which reads `instrumentOctaves`.

File to create: `src/hooks/instrument/useInstrumentOctaves.ts`. File to modify: `src/App.tsx`.

**Extract the track focus hook**

`lastTrackId`, `currentTrackColumn`, `trackFocusRevision`, `instrumentPanelFocusRevision`, the `activeSection` to `lastTrackId` sync effect, `targetTrackId`, `trackBackgroundEnabled`, `handleToggleTrackBackground`, and `previewChannel` form one cluster. Extract into `src/hooks/ui/useTrackFocus.ts`, which accepts `{ activeSection }` and returns the state set, the two computed values, and `handleToggleTrackBackground`. Called after `useKeyboardNavigation` and before `useEditorPersistence`.

File to create: `src/hooks/ui/useTrackFocus.ts`. File to modify: `src/App.tsx`.

**Extract the audio context resume helper**

`ensureAudioContextResumed` is a self-contained audio-domain callback. Extract into `src/hooks/audio/useAudioContextResume.ts`, which accepts `{ audioContext }` and returns the callback. Called after `useAudioSetup`.

File to create: `src/hooks/audio/useAudioContextResume.ts`. File to modify: `src/App.tsx`.

**Extract the Electron close guard**

The window-close interception effect is self-contained and Electron-specific. Extract into `src/hooks/app/useElectronCloseGuard.ts`, a no-parameter effect hook. Called once near the top of the component.

File to create: `src/hooks/app/useElectronCloseGuard.ts`. File to modify: `src/App.tsx`.

**Fold the MIDI bridge refs into useMidiHandling**

`midiHelpersRef` and `midiConfigurationRef` keep declarations before `usePlaybackSimulation` because consumers need them earlier than `useMidiHandling` can run. Keep the declarations, but move the two sync effects into `useMidiHandling`, which accepts optional `midiHelpersRef` and `midiConfigurationRef` parameters and syncs them internally.

File to modify: `src/hooks/midi/useMidiHandling.ts`, `src/App.tsx`.

**Extract the track pattern hook**

`getCurrentPatternForTrack` and `handlePatternChange` are song-pattern domain callbacks feeding `useTrackOperations` and `useMidiActions`. Extract into `src/hooks/song/useTrackPattern.ts`, which accepts `{ currentSong, sequencerPatternIndex, updateSong }` and returns `{ getCurrentPatternForTrack, handlePatternChange }`. Called where `getCurrentPatternForTrack` sits today, after `usePlaylistOperations` and before `useTrackOperations`.

File to create: `src/hooks/song/useTrackPattern.ts`. File to modify: `src/App.tsx`.

## Implementation Order

1. Update `ARCHITECTURE.md` and `SPECIFICATION.md` hook inventory and line counts.
2. Extract helpers and hooks in the step order above, running the targeted verification loop after each extraction.
3. Run the full verification loop.

## Testing Strategy

No new tests - the change is a pure move of existing logic behind the same interfaces. The existing hook tests (`test/hooks/`) and the component suite verify behaviour is unchanged. A broken extraction surfaces as a typecheck or test failure in the same step.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
