# Add Clone Track Command

**Type:** Feature

## Summary

| Field         | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Intent        | CLONE TRACK duplicates the current track's pattern data into a new pattern   |
| Key decisions | Second-row button, clipboard-free copy path, fragment lands at the first row |
| Open risks    | none                                                                         |

## Description

A CLONE TRACK command button joins the second command row, placed between ADD TRACK and COPY TRACK.

The command composes the behaviour of COPY TRACK, ADD TRACK, and PASTE TRACK without touching the system clipboard.

- The copy step reads the pattern assigned to the active track at the current playlist position and always copies the whole track - matching the whole-track behaviour COPY TRACK follows. A fragment selection never limits the clone.
- The add step allocates a new unique pattern identifier and assigns the new pattern to the target track at the current playlist line, exactly as ADD TRACK does.
- The paste step writes the copied fragment into the new pattern starting at its first row, clipped at the pattern length - the same landing rule PASTE TRACK applies.

The copy is a direct pattern-to-pattern transfer. The clipboard is never read or written, and no paste-mode confirmation applies.

After the operation the new track section holds focus at the first row, matching the ADD TRACK focus behaviour. The pattern creation and the playlist assignment record as a single edit history entry.

## Use Cases

- The user focuses track A and presses CLONE TRACK - a new pattern carrying a copy of the current track data replaces the pattern assignment on the current line.
- The user selects rows in track A and presses CLONE TRACK - a new pattern carrying the whole track is assigned to the target track; the selection does not limit the clone.
- The current line has no pattern assigned on the target track - the command reports the same error COPY TRACK reports for a missing pattern.
- The user presses UNDO after cloning - the playlist assignment and the new pattern revert together.

## Hints

- `handleCreateNewTrack` in `usePlaylistOperations.ts` already performs the add step - pattern allocation, playlist assignment, section focus, and cursor reset - as a single `updateSong` call.
- `useTrackOperations.ts` resolves the copy source through `getActiveTrackId` and `getCurrentPatternForTrack` - `trackSelection` is not consulted, keeping the command aligned with COPY TRACK.
- The paste landing rule means the copied steps occupy the new pattern from its first row, clipped at `song.length` - the source row offsets are not preserved.
- `CommandPanel` gains an `onCloneTrack` prop; the panel's roving focus queries `.command-button`, so the new button joins the existing focus navigation for free.

## Out of Scope

- No keyboard shortcut is bound to CLONE TRACK.
- The command does not preserve source row offsets - the copied steps always land from the first row of the new pattern.
