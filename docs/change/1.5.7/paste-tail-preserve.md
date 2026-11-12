# Preserve Rows After a CTRL+V Fragment Paste

**Type:** Fix

## Summary

| Field         | Value                                                                             |
| ------------- | --------------------------------------------------------------------------------- |
| Intent        | CTRL+V overwrites only the pasted fragment's span instead of clearing the tail    |
| Key decisions | PASTE TRACK keeps its whole-track replace; a tail flag splits the two paste paths |
| Open risks    | none                                                                              |

## Description

CTRL+V pastes the clipboard fragment starting at the cursor row. When the cursor sits on the first row, the paste currently clears every row after the fragment - the same whole-track replace PASTE TRACK performs - so a short fragment pasted at the top wipes the rest of the pattern.

The keyboard paste must overwrite only the rows the fragment covers. A fragment of eight rows pasted at the cursor replaces exactly those eight rows - every row after the fragment keeps its notes and volumes.

PASTE TRACK keeps its current behaviour: it pastes the fragment from the first row and clears the rows after it, remaining the whole-track replace.

## Use Cases

- The user copies an eight-row fragment, places the cursor on the first row, and presses CTRL+V - the first eight rows are replaced and all rows after row eight keep their data.
- The user pastes the same fragment mid-pattern - the rows before and after the pasted span are untouched.
- The user presses PASTE TRACK - the fragment lands on the first row and the rows after the fragment are cleared, as before.

## Hints

- `applyClipboardToLines` in `src/utils/track/trackClipboard.ts` clears rows after the fragment under `replace` mode whenever `startOffset` is zero - the two paste paths converge there.
- `handlePasteTrackFromStart` (PASTE TRACK) and `handlePasteTrackAtCursor` (CTRL+V) both call `handlePasteTrack` inside `useTrackOperations.ts` - a flag threaded from the wrapper to `applyClipboardToLines` splits the tail behaviour.
- Existing `applyClipboardToLines` callers and tests rely on the offset-zero clear - the default must preserve it.
