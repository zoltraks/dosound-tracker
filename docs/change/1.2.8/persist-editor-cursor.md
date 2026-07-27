# Remember the editor cursor across reloads

**Type:** Fix

## Summary

The application restores the working song on reload, but the editor cursor always resets.
The focused section, the track editing position, the selected instrument, and the internal cursor of each panel must persist across reloads and be restored to where the user last was.

## Description

The editor cursor describes where the user is working. It spans the focused section and the internal position within each panel.

The top-level cursor covers the section focus and the track editing position.

- The focused section, the currently active panel in the navigation order. This can be a track or a non-track section such as the volume envelope, the song playlist, or the instrument list.
- The selected track, one of the three tracks A, B, or C. It stays meaningful even when a non-track section is focused, because track-targeted operations act on it.
- The playlist line, the highlighted playlist entry.
- The track row, the highlighted row inside the pattern.
- The track column, either note or volume.

Each panel also has an internal cursor that must be remembered.

- The envelope panels volume, arpeggio, pitch, noise, and mode each have a step cursor, the highlighted envelope step. This step cursor is remembered per panel and is independent of the selected instrument. Changing the instrument does not move it.
- The song information panel has a focused field, one of title, author, year, speed, length, or loop.
- The song playlist panel has a selected track column, one of A, B, or C.
- The octave selection has a current octave.
- The instrument list highlights the selected instrument, which follows the application's current instrument selection.

Today the working song is autosaved to local storage and restored on the next launch, so notes, patterns, instruments, and song metadata all survive a reload.
None of the cursor state is persisted, so every reload resets the focus, the track position, the selected instrument, and every panel's internal position.

The desired behaviour is that the whole editor cursor, including each panel's internal position, is remembered.

- When the user leaves the cursor anywhere in the interface and reloads the application, the focus, track position, selected instrument, and each panel's internal position are restored.
- The focused section is any section in the navigation order, whether a track or a non-track section.
- The restored top-level cursor is clamped to the restored song. The playlist line is clamped to the playlist bounds, with an empty playlist selecting index 0. The track row is clamped to the current pattern length.
- The restored track is one of A, B, or C. If no track was selected at save time, the most recently selected track is restored.
- The restored column is either note or volume. If no valid column was stored, it defaults to note.
- Each envelope step cursor is restored per panel and clamped to the envelope length. It does not change when the instrument changes.
- The restored song information field, playlist track column, octave, and selected instrument fall back to safe defaults when no valid value was stored.

Creating a new song or loading a different song resets the cursor as it does today, and the remembered values update accordingly.

## Use Cases

- When the user focuses the volume envelope and moves its step cursor to step 0x0C, then reloads, then the volume envelope is focused with the step cursor at 0x0C. Switching the selected instrument does not move it.
- When the user selects instrument 0x0A, then reloads, then instrument 0x0A is selected again and highlighted in the instrument list.
- When the user focuses the song information panel on the author field, then reloads, then the author field is focused.
- When the user sets the playlist track column to C and the octave to 5, then reloads, then the playlist track column is C and the octave is 5.
- When the stored playlist line is 0x08 but the restored song has only 4 playlist lines, then the selection falls back to the last valid line.
- When the user creates a new song, then the cursor resets and that reset is remembered.

## Hints

- The focused section is `activeSection` in `src/hooks/useKeyboardNavigation.ts`. The valid sections are listed in `NAVIGATION_ORDER` in `src/constants/navigation.ts`.
- The selected track is derived in `App.tsx` as `targetTrackId`, backed by the `lastTrackId` state that remembers the most recent track when a non-track section is focused.
- The playlist line is `sequencerState.currentPattern` in `src/hooks/useSequencer.ts`, applied through `setPosition`.
- The track row is `sharedCurrentLine` in `src/stores/uiStore.ts`.
- The track column is `currentTrackColumn` in `App.tsx`, passed to the track panels as `currentColumn`.
- The envelope step cursor is `currentPosition`, component-local in `src/components/EnvelopePanel.tsx` and `src/components/ToneNoisePanel.tsx`. It is persisted per panel and does not depend on the instrument, so no instrument id needs to be passed in.
- The song information focused field is `lastFocusedField`, component-local in `src/components/InformationPanel.tsx`.
- The playlist track column is `currentTrack`, component-local in `src/components/PlaylistPanel.tsx`. The playlist row cursor there follows the top-level playlist line and must not be persisted separately, to avoid a second source of truth.
- The instrument list index in `src/components/InstrumentSection.tsx` follows the application's current instrument selection. Persist the current instrument selection, not the derived list index, to avoid a second source of truth.
- The octave is `currentOctave` in `src/stores/uiStore.ts`.
- The canonical local-storage state hook is `useLocalStorageState` in `src/hooks/useLocalStorageState.ts`. Local storage keys are centralised in `src/utils/storageKeys.ts`.
- The `EnvelopePanel` and `ToneNoisePanel` hold audio-critical prop-mirrored state. Only the step cursor changes; the mirrored envelope data must not be altered.

## Out of Scope

- The command panel and the piano keyboard have no internal cursor to persist. Only their focus, via the top-level focused section, is remembered.
- The saved and exported song file formats do not change. This is session state stored only in local storage.
- No change to playback behaviour, the sequencer worker, or the YM2149 emulator.
