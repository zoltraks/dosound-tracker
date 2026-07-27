# Play the line from its start with Ctrl+Enter in a track

**Type:** Feature

## Summary

When editing notes in a track, Enter plays the line from the current cursor position and toggles playback, restoring the original position when pressed again.
Add Ctrl+Enter to play the line from its start, the same as the PLAY LINE menu command, while keeping the restore-on-Enter behaviour.

## Description

A track already supports Enter as a play toggle.

- Pressing Enter plays the current playlist line starting from the cursor row.
- Pressing Enter again while playing stops playback and restores the cursor to its original position.

This change adds a second, complementary shortcut in a track.

- Pressing Ctrl+Enter plays the current playlist line from its start, exactly as the PLAY LINE menu command does. The pattern plays from its first row rather than from the cursor row.
- While the line plays, pressing Enter stops playback and restores the cursor to the position it had before playback started.
- Pressing Ctrl+Enter again while the line plays also stops playback and restores the original position, so both shortcuts toggle consistently.

The difference between the two shortcuts is only the start row. Enter starts from the cursor row. Ctrl+Enter starts from the first row of the pattern. Both remember the cursor position and restore it when playback stops.

## Use Cases

- When the cursor is on row 0x10 of a track and the user presses Ctrl+Enter, then the line plays from row 0x00 and the cursor return position is remembered as row 0x10.
- When the line is playing after Ctrl+Enter and the user presses Enter, then playback stops and the cursor returns to row 0x10.
- When the line is playing after Ctrl+Enter and the user presses Ctrl+Enter again, then playback stops and the cursor returns to row 0x10.

## Hints

- Enter is handled locally in `src/components/TrackPanel.tsx`. It calls `onToggleLineFromCursor(currentLine)`.
- The PLAY LINE menu command maps to `handleStartLinePlayback` in `App.tsx`, which starts the line loop from the first row. When started from a stopped state it does not record a cursor return position.
- The restore-on-stop behaviour reads the return position saved in `handleStartLineFromCurrentLine` and applied by `handleStopLinePlayback`. Ctrl+Enter must save the same return position so Enter can restore it.
- `Ctrl+Enter` is distinguished from `Enter` by the `ctrlKey` modifier on the same key event. There is no existing global binding for either.

## Out of Scope

- No change to the Enter shortcut behaviour, the PLAY LINE menu command, or any other playback shortcut.
- No change to song playback, the sequencer worker, or the YM2149 emulator.
- No change to any file format.
