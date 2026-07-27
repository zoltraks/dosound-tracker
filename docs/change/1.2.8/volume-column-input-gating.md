# Gate track note entry to the note column

**Type:** Fix

## Summary

When the track cursor is on the volume column, only volume values may be entered.
Note keys must be inert in the volume column and must not enter, change, or preview a note.
Note entry is allowed only when the note column of the track is focused.

## Description

Each track cursor has two columns, `note` and `volume`.
The volume column accepts a single hexadecimal nibble per line, `0` through `F`.
The note column accepts piano note keys mapped from the computer keyboard.

The current behaviour is inconsistent in the volume column.

- Hex nibble keys (`0` to `9`, `A` to `F`) correctly set the per-line volume modifier.
- Note keys that are not hex nibbles (for example `G`, `B`, `Z`, `X`, `V`) still enter and preview a note.

The keys `A` to `F` only appear to behave correctly because they are consumed as hex volume input before the note handler is reached.
Any other note key falls through to note entry.

The desired behaviour is a strict separation by column.

- Volume column focused: accept only hex nibbles `0` to `F`. Ignore every key that would enter, change, or preview a note. Ignoring means the key produces no note edit and no audible preview.
- Note column focused: accept piano note keys exactly as today.

Navigation, clearing, note-off, instrument selection, and playback shortcuts are unaffected in both columns.

## Use Cases

- When the cursor is on the volume column and the user presses `G`, then nothing happens: no note is written and no preview sounds.
- When the cursor is on the volume column and the user presses `C`, then the per-line volume nibble is set to `0x0C`, because `C` is a valid hex value.
- When the cursor is on the volume column and the user presses `Z`, then nothing happens.
- When the cursor is on the note column and the user presses `G`, then the mapped note is entered and previewed as before.

## Hints

- The relevant handler is `handleKeyDown` in `src/components/TrackPanel.tsx`.
- The volume nibble branch already gates on `currentColumn === 'volume'`.
- The final note-entry branch runs for any unhandled key without checking the active column. This is the fault.
- The matching `handleKeyUp` handler previews and cleans up note keys without checking the column. Confirm it stays consistent once note entry is blocked in the volume column, so no preview is left ringing.
- This is an input-routing fix. It does not alter the sequencer, the SoundDriver, or the YM2149 emulator. The implementation plan must still record the audio-critical assessment showing render timing and hook dependencies are unaffected.

## Out of Scope

- No change to the set of keys mapped to notes.
- No change to volume nibble parsing or the volume value range.
- No change to column navigation with the arrow keys.
- No change to any export format or save file format.
