# Restore Settings Session State Implementation Plan

## Summary

| Field         | Value                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------- |
| Intent        | Complete the settings modal's session snapshot with focus, pane scroll, and the reset-confirm view |
| Key decisions | `confirmingReset` lifts into `useSettingsDialog`; focus/scroll write via a merge patch, not state  |
| Open risks    | none                                                                                               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.0/restore-settings-session-state.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`.

## Audio-Critical Requirements

- React render timing: focus/scroll writes bypass React state (merge patch straight to the snapshot) so high-frequency events add no renders.
- No `useCallback`/`useMemo` dependency changes on audio paths.
- No state-management changes in audio paths.
- Does not modify the YM2149 emulator or SoundDriver.
- Manual audio test not required - no audio-path code moves.

## Documentation Updates

- `PROJECT.md` — F-17's restore paragraph names the restored members: open flag, active category, draft, focused control, pane scroll, reset confirmation.
- `SPECIFICATION.md` — the `settingsView` description lists the new members; the Modal Working State section notes the settings modal now conforms (reset-confirm state lives in the hook).
- `ARCHITECTURE.md`, `FORMAT.md` — no changes.

## Implementation Steps

1. `src/types/settings.ts` — extend `SettingsSession` with
   `focus: string | null`, `paneScroll: number`, `confirmingReset: boolean`.
2. `src/utils/storage/uiState.ts` — `loadUiState` normalizes the new
   members (missing → `null`/`0`/`false`); add `patchSettingsView(partial)`
   that merges into the existing session without clearing siblings.
3. `src/hooks/modal/useSettingsDialog.ts` — own `confirmingReset` state;
   seed category/draft/confirmingReset from the session; keep
   `focus`/`paneScroll` in refs seeded once, and mirror the full session
   on every change; expose `recordFocus(id)` and `recordPaneScroll(top)`
   that update the refs and patch the session without React state churn;
   expose `sessionFocus`/`sessionPaneScroll` seed values for the modal.
4. `src/components/DialogFrame.tsx` — add optional `dialogRef` and
   `onFocus` props; the dialog div gets `tabIndex={-1}` so it can take
   programmatic focus.
5. `src/modals/SettingsModal.tsx` — accept `confirmingReset`,
   `onConfirmingResetChange`, `sessionFocus`, `sessionPaneScroll`,
   `onSessionFocus`, `onSessionPaneScroll` props; drop the internal
   `useState`; give every focusable element a stable `id`
   (`settings-category-*`, `settings-action-*`); report focus via
   `onFocus` on the dialog; report pane scroll via `onScroll` with the
   150 ms debounce the markdown modal uses; on mount focus the recorded
   element (fall back to the dialog) and restore `paneRef.scrollTop`.
6. `src/App.tsx` — pass the new props through `useAppModals` /
   `ModalContainer`; gate `handleCommitSettings` and
   `handleCancelSettings` on `confirmingReset` so ENTER confirms the
   reset and ESC cancels it, matching the Modal Working State rule.
7. Tests — update `test/utils/storage/uiState.test.ts` for the new
   session members; update `test/modals/SettingsModal.test.tsx` props;
   add coverage for the session mirror (focus/scroll/confirm) in the
   settings-dialog test file.
8. Verification loop + headless probe asserting the focused element and
   scroll offset survive a reload.

## Verification Approach

- Unit tests for session normalization and the dialog wiring.
- Headless reload probe: focus SOUND select → reload → assert
  `document.activeElement.id === 'settings-sound-engine'`; scroll pane →
  reload → assert scrollTop restored; open reset confirm → reload →
  assert confirm view shown.
