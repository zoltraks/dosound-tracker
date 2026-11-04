# Restore the Full Application View State on Reload

**Type:** Feature

## Summary

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Intent        | A page reload restores the exact view the user left - open modal,       |
|               | cursor line, channel mutes, and markdown scroll position                |
| Key decisions | View and configuration modals restore; destructive-confirmation dialogs |
|               | never do. Playback never auto-resumes. One `UI_STATE` snapshot key      |
|               | keeps the storage surface small                                         |
| Open risks    | Modal content reloads through existing open handlers - a restored modal |
|               | re-fetches its document rather than persisting the content itself       |

## Description

Song data and preferences already persist; the view itself does not. Being on
the MANUAL view and reloading loses the modal, the position, and the scroll.
`useModalState` holds ~30 transient flags, `useUiStore` holds the cursor
line and mutes, and none survive a reload.

## Implementation

- `StorageKeys.UI_STATE` - one JSON snapshot: `openModal`, `sharedCurrentLine`,
  `channelMutes`, `markdownScroll`.
- `src/utils/storage/uiState.ts` - `loadUiState`/`saveUiState` with
  fire-and-forget failure semantics matching `persistenceMirror.ts`.
- Restorable modals: `manual`, `changelog`, `about`, `download`, `debugInfo`,
  `midi`, `instrumentMidi`, `instrumentColor`, `export`. Confirmation and
  paste dialogs are excluded - reopening a pending destructive action is
  unsafe.
- `src/hooks/ui/useUiStatePersistence.ts` - writes the snapshot on state
  change; `App.tsx` re-opens the saved modal on mount through the existing
  open handlers so content reloads correctly.
- `useUiStore` hydrates `sharedCurrentLine` and `channelMutes` from the
  snapshot; octave and current instrument already persist elsewhere.
- `MarkdownModal` reports scroll changes and restores its scroll offset
  once the document has loaded (empty content would clamp the offset).
- The window scroll position is captured in the snapshot and restored.
- `useAppState` RESET clears `UI_STATE` with the other keys.
- Tests for the snapshot round-trip, boundary cases, and exclusion set.

## Outcome

- Verification loop clean (552 tests); reload during MANUAL view restores
  modal, content, and scroll offset - including the case where the document
  loads asynchronously after the modal opens.
- Follow-up fix inside the same record: scroll restore waits for loaded
  content, and `windowScroll` joined the snapshot.
