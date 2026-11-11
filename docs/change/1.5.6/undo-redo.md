# Add Undo and Redo Commands with Persistent Edit History

**Type:** Feature

## Summary

| Field         | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Intent        | UNDO and REDO command buttons plus an edit history that survives reload    |
| Key decisions | Third-row buttons, bounded persisted stacks, lifecycle operations clear it |
| Open risks    | Persisted depth versus storage quota - resolved in the plan                |

## Description

Two command buttons join the third command row, placed before ADD INST: UNDO and REDO.

UNDO is enabled while the undo stack holds at least one recorded modification. REDO is enabled while the redo stack holds entries - a redo branch exists only after an undo, and any newly recorded edit clears it.

Undoable subjects are the recorded composition edits.

- Note changes in any track - entry, deletion, volume and instrument cells, cut, paste, and track operations that write pattern data.
- Song information changes - title and the other song info fields - coalesced so a continuous typing burst produces one history entry.
- Instrument changes - envelope edits and the instrument base octave.

Non-subjects stay outside the history.

- The track selection range.
- The current octave in the header bar.

Each snapshot also records the live editor position alongside the song and instrument pair - the playlist line from the sequencer index and the track row from the shared cursor - so undo and redo return the cursor to the row the edit started from: ADD LINE, DELETE LINE, and the other playlist operations that move the position land back where they began, and an undone note, note-off, or volume entry lands back on the edited row instead of where the edit step advanced the cursor.

The edit history persists across page reload. Reloading restores both stacks, so undo and redo remain available on the restored song.

Lifecycle operations destroy the history instead of recording it.

- NEW SONG clears both stacks.
- LOAD SONG clears both stacks, including the pending-import confirmation path.
- DEMO SONG clears both stacks - it loads through the same path as LOAD SONG.
- RESET clears both stacks with the rest of the application storage.

Keyboard bindings stay as recorded: CTRL+Z undoes, CTRL+Y redoes on macOS, Linux, and Windows, and CMD+SHIFT+Z redoes on macOS. The matcher folds the meta modifier into ctrl, so CTRL+SHIFT+Z remains a redo alias.

## Use Cases

- The user edits three notes and presses UNDO - the last edit reverts and REDO enables.
- The user types a song title character by character - a single undo entry restores the previous title.
- The user undoes a change and then edits a note - the redo branch clears and REDO disables.
- The user edits notes, reloads the page, and presses UNDO - the edit made before the reload reverts.
- The user confirms NEW SONG - both stacks are empty and both buttons disable.
- The user loads a song file or picks a demo song - both stacks are empty and both buttons disable.

## Hints

- `src/utils/song/editHistory.ts` already provides bounded stacks and coalescing; `useDataManagement` records every composition mutation and already returns `canUndo` and `canRedo` - nothing consumes them yet.
- `createNewSong` and `applyParsedSong` in `useDataManagement.ts` currently call `recordHistory()` - replace the recording with a stack clear so lifecycle operations destroy history instead of becoming undoable.
- `handlePickDemoSong` loads through `loadSongFromText` - clearing inside `applyParsedSong` covers DEMO SONG with no extra wiring.
- `clearApplicationStorage` in `src/utils/storage/applicationStorage.ts` wipes every `dosound-tracker-*` key outside `PRESERVED_KEYS` - a new `StorageKeys` member for the persisted history is cleared by RESET for free and must not join `PRESERVED_KEYS`.
- The persisted shape serializes `EditHistory<EditSnapshot>`; full song snapshots at the in-memory depth can approach the local storage quota, so the persisted depth is a plan-level decision.
- `CommandPanel` gains `onUndo`, `onRedo`, `canUndo`, and `canRedo` props; the panel's roving focus queries `.command-button`, so the new buttons join the existing focus navigation for free.
- Buttons follow the `command-button` convention with a disabled state.

## Out of Scope

- Undo and redo entries in the mobile-collapsed command row.
- Splitting Command and Ctrl matching - the modifier fold keeps CMD+Z undoing on macOS.
- Undo entries for selection or other session-only state beyond the recorded exclusions - the sequencer cursor position is in scope and restored from each snapshot.
