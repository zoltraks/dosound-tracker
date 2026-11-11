# Specification Audit - Restore Settings Session State

## Document Information

|            |                                                                  |
| ---------- | ---------------------------------------------------------------- |
| Change     | docs/change/1.5.0/restore-settings-session-state.md              |
| Plan       | docs/plan/1.5.0/restore-settings-session-state-implementation.md |
| Audit Date | 2026-11-10                                                       |

## Completeness

| Record requirement                                              | Covering plan step |
| --------------------------------------------------------------- | ------------------ |
| Snapshot records the focused control's element id               | Steps 1, 3, 5      |
| DOM focus restored into the dialog on reload                    | Steps 4, 5         |
| Pane scroll offset persisted and restored                       | Steps 1, 3, 5      |
| `confirmingReset` lifts to `useSettingsDialog` and is persisted | Steps 1, 3, 6      |
| ENTER confirms reset / ESC cancels it while the confirm shows   | Step 6             |
| Dialog itself takes focus when no element was recorded          | Steps 4, 5         |
| Older snapshots still load                                      | Step 2             |

No requirement lacks a covering step and no step lacks a stated
requirement.

## Ambiguity

- "Merge patch" is one interpretation of how focus/scroll reach the
  snapshot without clobbering category/draft - resolved: a
  `patchSettingsView` helper that reads, merges, and writes.
- Focus identity is "element id" - every focusable control carries a
  stable id, so no selector ambiguity exists.

## Implementability

- `updateSettingsView` exists and writes a whole `SettingsSession`;
  extending it with a merge sibling is a local change.
- `useSettingsDialog` already seeds and mirrors `{category, draft}` -
  the new members ride the same path.
- `MarkdownModal` already debounces scroll writes at 150 ms - the
  pattern exists.
- `DialogFrame` is the shared dialog shell; the new props are optional
  so other modals keep their behavior.
- `useModalManager` routes ENTER/ESCAPE to `handleConfirmSettings` /
  `handleCancelSettings` when `isSettingsOpen` - gating inside those
  handlers requires no pipeline change.

Every step's preconditions hold against the real codebase.

## Fidelity

- Enumeration fidelity - the session members named in the record
  (`focus`, `paneScroll`, `confirmingReset`) are exactly the three the
  plan adds; no other view state exists inside the modal.
- Vocabulary freeze - member names, element ids, and the
  `settingsView` key are stated identically in record, plan, and code.
- Cross-party parity - `loadUiState` normalization covers every member
  `useSettingsDialog` writes; the modal reads only what the hook seeds.

## Conclusion

The plan covers the record completely and implementably. Approved for
implementation.
