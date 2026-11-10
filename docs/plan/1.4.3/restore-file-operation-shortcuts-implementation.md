# Restore the File-Operation Keyboard Shortcuts Implementation Plan

## Summary

| Field         | Value                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| Intent        | Make CTRL+N, CTRL+O, CTRL+S, and CTRL+I perform the file operations they are bound to  |
| Key decisions | Restore the bindings through `setGlobalShortcut`; claim the keys with `preventDefault` |
| Open risks    | CTRL+S now shadows the browser Save Page dialog - deliberate: the app owns the key     |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.3/restore-file-operation-shortcuts.md`.

## Analysis

`KEYBOARD_SHORTCUTS` binds `newSong`, `loadSong`, `saveSong`, and `newInstrument`, and `executeShortcut` in `useKeyboardNavigation` dispatches to `globalCallbacksRef` first - but nothing ever calls `setGlobalShortcut` for these actions, so the bindings are dead. `useKeyboardShortcuts` registers only the four playback actions. `matchKeyboardShortcut` matches all four keys today with `preventDefault: false`, so CTRL+S currently opens the browser Save Page dialog while doing nothing in the app - restoring the binding must also claim the key. In the Electron shell there is no conflicting default to preserve; in the browser the shadowing is the intent.

The button command paths in `App.tsx` are `handleRequestNewSong` (NEW SONG, confirmation-modal path), `triggerFileLoad` (LOAD SONG), `saveSong` (SAVE SONG), and `createNewInstrument` (NEW INSTRUMENT) - all in scope before the `useKeyboardShortcuts` call at line 597.

## Documentation Updates

- `SPECIFICATION.md` — the input bindings gain a file-operation shortcut block listing the four bindings.
- `public/MANUAL.md` — the Keyboard Navigation block lists the file-operation shortcuts.

## Step by Step Implementation

**Record the restored bindings in the specification**

Add a file-operation shortcut block to the input bindings: CTRL+N new song, CTRL+O load song, CTRL+S save song, CTRL+I new instrument.

Files to modify: `docs/SPECIFICATION.md`, `public/MANUAL.md`.

**Claim the keys in the shortcut matcher**

Set `preventDefault` for CTRL+N, CTRL+O, CTRL+S, and CTRL+I so the browser defaults no longer fire - the app owns the keys now.

File to modify: `src/utils/keyboard/keyboardShortcutUtils.ts`.

```typescript
case 'N':
  shortcut = 'CTRL+N';
  preventDefault = true;
  break;
```

**Register the file-operation actions**

Extend `GlobalShortcutName` and the hook arguments with `newSong`, `loadSong`, `saveSong`, and `newInstrument`, and register each with `setGlobalShortcut` alongside the playback registrations.

File to modify: `src/hooks/keyboard/useKeyboardShortcuts.ts`.

**Wire the button command paths**

Pass the four handlers to `useKeyboardShortcuts` in `App.tsx`: `handleRequestNewSong`, `triggerFileLoad`, `saveSong`, `createNewInstrument`.

File to modify: `src/App.tsx`.

**Update and extend the shortcut tests**

Update the four `preventDefault: false` expectations in `keyboardShortcutUtils.test.ts` to `true`, and add a `useKeyboardNavigation` test that registers a global shortcut and proves a CTRL+S keydown dispatches the handler with `preventDefault` applied.

Files to modify: `test/utils/keyboard/keyboardShortcutUtils.test.ts`; new file `test/hooks/keyboard/useKeyboardNavigation.test.tsx` (or co-located per test layout conventions).

## Implementation Order

1. Update `SPECIFICATION.md` and `MANUAL.md`
2. Update `keyboardShortcutUtils.ts`
3. Update `useKeyboardShortcuts.ts`
4. Wire the handlers in `App.tsx`
5. Update and add the tests
6. Run the verification loop

## Testing Strategy

- Update the existing matcher expectations for the four keys.
- New hook test: `renderHook` the navigation hook, call `setGlobalShortcut('saveSong', spy)`, dispatch a `keydown` CTRL+S on `window`, and assert the spy fired and `defaultPrevented` is set.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test` targeted at the keyboard suites, then the full suite
- Manual check: CTRL+S saves the song instead of opening the browser dialog
