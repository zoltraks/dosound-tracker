# Focus tracks and the piano with control shortcuts

**Type:** Feature

## Summary

| Field         | Value                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | CTRL+1/2/3 focus tracks A/B/C, CTRL+SPACE toggles focus between the piano and the previous section, and note-off moves to SHIFT+SPACE as a toggle |
| Key decisions | Ctrl means Ctrl or Cmd on every platform; piano toggle returns to the last non-piano section; SHIFT+SPACE clears an existing note-off             |
| Open risks    | none                                                                                                                                              |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Track and piano focus need direct shortcuts:

- CTRL+1 focuses track A, CTRL+2 focuses track B, CTRL+3 focuses track C.
- CTRL+SPACE focuses the on-screen piano. Pressed while the piano is active, it returns focus to the section that was active before the piano.
- Note-off moves from CTRL+SPACE to SHIFT+SPACE. SHIFT+SPACE on a position that already holds a note-off (`===`) clears the position.

"Ctrl" means the Ctrl key or the Cmd key - the existing shortcut matcher already treats them as equal, so the bindings work on macOS, Windows, and Linux.

## Use Cases

- With a track active, the user presses CTRL+SPACE - the piano becomes active and its keys preview notes; pressing CTRL+SPACE again returns to the track.
- With the playlist active, the user presses CTRL+2 - track B becomes active.
- With a track active, the user presses SHIFT+SPACE - the position holds `===`; pressing SHIFT+SPACE on the same position clears it.

## Hints

- `src/constants/navigation.ts` holds `KEYBOARD_SHORTCUTS`; `src/utils/keyboard/keyboardShortcutUtils.ts` matches key events to entries. Ctrl+1/2/3 match nothing today.
- `useKeyboardNavigation.executeShortcut` handles navigation actions internally; the piano toggle needs a ref that tracks the last non-piano section inside `setActiveSection`.
- Note-off is written locally in `src/components/TrackPanel.tsx` (`event.ctrlKey && key === ' '`); `createNoteOff()` produces `{ note: '===' }` and `updatePatternStep` exposes the existing step for the toggle check.

## Out of Scope

- Changing TAB and SHIFT+TAB cycling, the SPACE and BACKSPACE clear bindings, or playback shortcuts.
- Piano-local key handling other than receiving focus through `setActiveSection`.
