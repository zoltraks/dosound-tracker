# Wire the quit-confirm modal into the Electron close path

**Type:** Fix

**Source:** AUDIT-1.5 REC-001 (FND-CQY-001)

## Summary

| Field         | Value                                                                           |
| ------------- | ------------------------------------------------------------------------------- |
| Intent        | Make the advertised unsaved-changes quit confirmation reachable on window close |
| Key decisions | Wire the existing modal instead of removing it - the audit allows either path   |
| Open risks    | Whether the prompt gates on unsaved changes or appears on every close           |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The Electron close handshake exists but never reaches the user. `electron/main.cjs`
intercepts the window `close` event, prevents it, and sends `app-close-requested`
to the renderer. `useElectronCloseGuard` answers that request by calling
`confirmAppClose()` unconditionally, so the application quits without ever asking.

The quit confirmation is fully built but unreachable. `src/constants/modal.ts`
carries the unsaved-changes quit text, `useModalState` holds `isQuitConfirmOpen`,
the modal renders through `ModalManager` and `ModalContainer`, and
`useAppInfoDialogs` already provides `handleConfirmQuit` and `handleCancelQuit`.
Nothing in `src/` calls `setIsQuitConfirmOpen(true)`.

When the user closes the desktop window, the application must present the quit
confirmation instead of quitting directly. Confirming approves the close and
calls `confirmAppClose()`. Cancelling calls `cancelAppClose()` and leaves the
application running. The close-guard comment describes the guard as asking
whether to quit when the song is dirty, so prompting is expected to respect the
unsaved-changes state.

## Use Cases

- When the user closes the Electron window with unsaved changes, then the quit
  confirmation modal appears instead of the application exiting.
- When the user confirms the quit modal, then the window closes.
- When the user cancels the quit modal, then the modal closes and the
  application keeps running.
- When the application runs in a plain browser without the Electron API, then
  no close handshake is involved and behavior is unchanged.

## Hints

- `useAppInfoDialogs` already owns both modal outcomes - the close path needs
  to open the modal rather than confirm immediately.
- The song dirty state used by the autosave lifecycle is the natural gate
  signal; planning resolves whether a clean song still prompts.
- The finding was re-verified on 2026-11-10: no `setIsQuitConfirmOpen(true)`
  call exists and the close handler still confirms unconditionally.
