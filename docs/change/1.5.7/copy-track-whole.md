# Make COPY TRACK Always Copy the Whole Track

**Type:** Fix

## Summary

| Field         | Value                                                                             |
| ------------- | --------------------------------------------------------------------------------- |
| Intent        | COPY TRACK copies the whole current track even while a fragment selection exists  |
| Key decisions | The button and the CTRL+C shortcut split - the shortcut keeps selection semantics |
| Open risks    | none                                                                              |

## Description

While a fragment selection exists on a track, COPY TRACK currently copies only the selected row range - the same fragment CTRL+C produces. The button should always copy the whole current track, no matter whether a selection range is set.

The CTRL+C shortcut keeps its semantics: it copies the selected row range, and with no selection it copies the whole track - matching the documented "with no selection it copies the whole track like COPY TRACK" wording.

## Use Cases

- The user selects a row range and clicks COPY TRACK - the clipboard holds the whole track, not the fragment.
- The user selects a row range and presses CTRL+C - the clipboard holds only the fragment, as before.
- The user holds no selection and clicks COPY TRACK or presses CTRL+C - both write the whole track, as before.

## Hints

- `handleCopyTrack` in `useTrackOperations.ts` resolves `trackSelection` and passes the normalized range to `generateClipboardData` - both the button and the shortcut share that path today.
- `CommandPanel` binds `onCopyTrack` to the raw handler while `useKeyboardShortcuts` binds CTRL+C to `handleCopyTrackShortcut` - the split lands inside the hook, no wiring changes.
- The selection itself is not cleared by the copy - only the cut path drops it.
