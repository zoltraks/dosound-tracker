# Add Undo and Redo History

**Type:** Feature

## Summary

| Field         | Value                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Intent        | Give composers a way to reverse and re-apply edits instead of re-entering |
|               | lost work by hand                                                         |
| Key decisions | History semantics and the restore surface are defined in this record;     |
|               | the mechanism is resolved by the plan as state snapshots of the           |
|               | song-plus-instrument pair taken at the `useDataManagement` boundary;      |
|               | CTRL+Z undoes and CTRL+Y or CTRL+SHIFT+Z redoes                           |
| Open risks    | None open - restores travel the ordinary song setters, so an undo during  |
|               | playback re-syncs the sequencer like a normal edit; silent paths keep     |
|               | fix-ups and selection changes out of the history                          |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The application has no undo or redo history. Every edit - note entry,
instrument parameter changes, playlist edits, paste operations,
transpositions - applies directly to state and is irreversible without
manual re-entry or reloading a saved file. `ARCHITECTURE.md` records the
absence of a command pattern and history stack as a deliberate trade-off;
this record revises that decision.

The change introduces an edit history covering the composition data:
pattern steps, instrument parameters, playlist lines, and song
information fields. Undo steps the history backwards and redo re-applies
reverted steps. The history is session state - it does not travel with
the saved song file and does not need to survive a reload.

The mechanism is decided in the implementation plan: an encapsulated
command layer, or state snapshots taken at edit boundaries. Whichever is
chosen, it must respect the audio-critical principles in
`SPECIFICATION.md` - applying an undo while playback runs must not
re-create audio callbacks or re-render on the audio path.

## Use Cases

- When the user enters a wrong note and invokes undo, the previous step
  content returns.
- When the user undoes several edits and then makes a new edit, the redo
  branch is discarded.
- When the user pastes a track and undoes, the paste is reverted as one
  step rather than row by row.
- When the user reloads the application, the history starts empty.

## Hints

- Editing mutations flow through setter calls wired from `App.tsx` - the
  history boundary is where those setters run, not inside individual
  panels.
- Composite operations (paste, transpose, renumber, optimize) should
  record as single history entries. Verified against the tree: paste,
  transpose, renumber, and optimize already apply through one
  `updateSong`/`setCurrentSong` call each, but the playlist's
  create-pattern-at and new-track handlers run `createNewPattern` plus
  `updateSong` as two mutations and must merge into one call.
- Keyboard conventions: CTRL+Z for undo and CTRL+SHIFT+Z or CTRL+Y for
  redo; document the chosen bindings in `SPECIFICATION.md` input
  bindings. Verified: none of the three combinations is bound today,
  but two collisions need handling - the note-entry branch of
  `TrackPanel.handleKeyDown` ignores `ctrlKey`, so CTRL+Z inside a
  focused track currently enters a note, and `matchKeyboardShortcut`
  returns null for every CTRL+SHIFT combination, so CTRL+SHIFT+Z needs
  the matcher extended.
- `getCurrentPatternForTrack` lazily materializes a missing pattern
  through `updateSong` - an implicit fix-up rather than a user edit, so
  it needs a non-recording update path.
- `setCurrentInstrument` alone is a selection change, not a
  composition edit; the startup mirror restore and the
  instrument-sync effect also mutate outside user intent. None of
  these belong in the history.
- A bounded history depth avoids unbounded memory growth on long
  sessions.

## Out of Scope

- Persisting history across reloads or into the song file format.
- Undo for non-composition UI state (cursor position, open views,
  settings).
