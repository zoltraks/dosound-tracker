# Specification Audit - Wire the quit-confirm modal

## Document Information

|            |                                                             |
| ---------- | ----------------------------------------------------------- |
| Change     | `docs/change/1.4.5/wire-quit-confirm-modal.md`              |
| Plan       | `docs/plan/1.4.5/wire-quit-confirm-modal-implementation.md` |
| Audit Date | 2026-11-10                                                  |

## Completeness

| Requirement (record)                       | Plan step                                                                        |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| Close with unsaved changes opens the modal | Gate the close handler on the dirty flag                                         |
| Confirm closes the window                  | Already wired - `handleConfirmQuit` → `confirmAppClose`; call-site step keeps it |
| Cancel keeps the app running               | Already wired - `handleCancelQuit` → `cancelAppClose`; no change needed          |
| Browser without Electron API unchanged     | Guard's existing `!api` early return preserved                                   |

No uncovered requirements; no orphan steps.

## Ambiguity

The record's open risk - "whether the prompt gates on unsaved changes or
appears on every close" - is resolved by the recorded decision: gate on
`isSongDirty`, matching the guard's own comment and the record's Use Cases.

## Implementability

- `src/hooks/app/useElectronCloseGuard.ts` exists with the described handler.
- `setIsQuitConfirmOpen` is destructured in `App.tsx` before the hook call
  site (line ~92 vs ~281).
- `isSongDirty` is destructured from `useDataManagement` before the call site.
- `CONFIRM_MODAL_TEXT.quit` exists; `isQuitConfirmOpen` renders through
  `ModalContainer` → confirm modal; `handleConfirmQuit`/`handleCancelQuit`
  exist in `useAppInfoDialogs`.
- Preload surface `onAppCloseRequested`/`confirmAppClose`/`cancelAppClose`
  confirmed in `electron/preload.cjs`; `ipcMain` handlers for
  `app-close-confirmed`/`app-close-cancelled` exist in `electron/main.cjs`.

## Fidelity

- Vocabulary: modal open uses `setIsQuitConfirmOpen(true)`; close approval
  uses `confirmAppClose()`; cancel uses `cancelAppClose()` - consistent with
  the existing preload IPC names.
- Boundary: a second close event while the modal is open re-invokes
  `onQuitRequested(true)` - a no-op state write, recorded as acceptable.
- Constants: none introduced.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
