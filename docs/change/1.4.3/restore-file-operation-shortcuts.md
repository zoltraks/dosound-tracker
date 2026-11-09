# Restore file-operation keyboard shortcuts

**Type:** Fix

**Source:** 1.4.3 documentation-reconciliation analysis

## Summary

| Field         | Value                                                                                 |
| ------------- | ------------------------------------------------------------------------------------- |
| Intent        | Make CTRL+N, CTRL+O, CTRL+S, and CTRL+I perform the file operations they are bound to |
| Key decisions | the binding table is live, the missing piece is handler registration                  |
| Open risks    | restoring CTRL+S may shadow a browser default the shell currently receives            |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`KEYBOARD_SHORTCUTS` in `src/constants/navigation.ts` binds `newSong`, `loadSong`, `saveSong`, and `newInstrument`, and `executeShortcut` in `src/hooks/keyboard/useKeyboardNavigation.ts` matches them - but no handler is ever registered for these actions, so the shortcuts are dead. File operations currently run only through command-panel buttons.

`public/MESSAGES.md` previously told users to press CTRL+S; the message was corrected in the reconciliation pass because the shortcut does nothing today.

Restore the bindings so each shortcut invokes the same command path its button uses, or decide to retire the bindings and document the retirement.

## Hints

- `useKeyboardShortcuts` registers playback callbacks only; file-operation handlers would join the same registration path or the navigation callback registrar.
- Decide whether the Electron shell needs the CTRL+S default preserved.

## Out of Scope

- New file-operation features - the buttons already implement them.
