# Specification Audit - Restore the File-Operation Keyboard Shortcuts

## Document Information

|            |                                                                      |
| ---------- | -------------------------------------------------------------------- |
| Change     | `docs/change/1.4.3/restore-file-operation-shortcuts.md`              |
| Plan       | `docs/plan/1.4.3/restore-file-operation-shortcuts-implementation.md` |
| Audit Date | 2026-11-09                                                           |

## Completeness

| Requirement                                                          | Covering step                          |
| -------------------------------------------------------------------- | -------------------------------------- |
| Each shortcut invokes the same command path its button uses          | Wire the button command paths          |
| Handler registration joins the existing global-shortcut registrar    | Register the file-operation actions    |
| Decide whether the Electron shell needs the CTRL+S default preserved | Claim the keys in the shortcut matcher |
| Documentation reflects the restored bindings                         | Documentation updates step             |

No requirement lacks a covering step and no step lacks a requirement.

## Ambiguity

- "or decide to retire the bindings" - resolved in favor of restore: the record's stated intent is to make the shortcuts perform their operations.
- "the Electron shell needs the CTRL+S default preserved" - resolved: Electron has no Save Page default; in the browser the app claims the key deliberately, so `preventDefault` applies on both shells.

## Implementability

- `KEYBOARD_SHORTCUTS` binds the four actions and `executeShortcut` dispatches `globalCallbacksRef` first - verified in `useKeyboardNavigation.ts` lines 52-82.
- `setGlobalShortcut` is returned by the hook and consumed by `useKeyboardShortcuts` for playback actions - verified.
- All four handlers (`handleRequestNewSong`, `triggerFileLoad`, `saveSong`, `createNewInstrument`) are in scope in `App.tsx` before the `useKeyboardShortcuts` call at line 597 - verified.
- `matchKeyboardShortcut` returns `preventDefault: false` for the four keys today - verified; the existing test pins that expectation and is updated by the plan.
- `renderHook` is available and used by existing hook tests - verified.

No step fails the check.

## Fidelity

- Enumeration fidelity - all four bindings enumerated: CTRL+N `newSong`, CTRL+O `loadSong`, CTRL+S `saveSong`, CTRL+I `newInstrument`.
- Vocabulary freeze - action names reuse the `KEYBOARD_SHORTCUTS` vocabulary verbatim; no new action vocabulary invented.
- Cross-party parity - the matched shortcut and the registered action name agree through the shared constants module.
- Constants completeness - no numeric bounds touched.
- Boundary decisions - shortcuts dispatch while modals are open, matching the existing playback-shortcut semantics; editable-element guard behavior unchanged - decided, not implied.

## Findings Returned to Planning

none
