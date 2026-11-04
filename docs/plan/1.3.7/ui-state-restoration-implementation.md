# UI State Restoration Implementation Plan

## Change Record Reference

Implements `docs/change/1.3.7/ui-state-restoration.md`.

## Steps

1. `storageKeys.ts`: add `UI_STATE`.
2. `src/utils/storage/uiState.ts`: typed snapshot, load/save, exclusion set.
3. `useUiStore.ts`: hydrate `sharedCurrentLine`/`channelMutes` from `UI_STATE`.
4. `src/hooks/ui/useUiStatePersistence.ts`: subscribe-and-save effect.
5. `MarkdownModal.tsx`/`ModalManager.tsx`: scroll reporting + restore.
6. `App.tsx`: mount-time reopen through existing handlers; wire the hook.
7. `useAppState.ts`: RESET clears `UI_STATE`.
8. Tests + verification loop.

## Acceptance Criteria

- Reload on MANUAL view restores the modal and its scroll position.
- Cursor line and channel mutes round-trip.
- Confirmation dialogs never reopen after reload.
- Loop clean, tests cover the snapshot module.
