# Specification Audit - Settings Modal

## Document Information

|            |                                                    |
| ---------- | -------------------------------------------------- |
| Change     | `docs/change/1.4.6/settings-modal.md`              |
| Plan       | `docs/plan/1.4.6/settings-modal-implementation.md` |
| Audit Date | 2026-11-10                                         |

## Completeness

Every requirement stated in the change record maps to a plan step.

| Requirement                                                  | Covering step                                                           |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Gear button after the theme toggle, outside navigation order | Add the header gear button                                              |
| Three-region layout: sidebar, property pane, footer          | Create the settings modal component - Style the modal                   |
| GENERAL: theme, track background, startup tone               | Type definitions - modal controls - commit wiring - startup gate        |
| EDITOR: restore cursor, restore view, paste mode             | Type definitions - modal controls - restore and cursor gates            |
| Draft commits on OK, discard on Cancel and ESC               | Settings modal component - Extend the modal state and keyboard pipeline |
| ENTER confirms like OK                                       | Extend the modal state and keyboard pipeline                            |
| RESET behind confirmation                                    | `confirmingReset` inline state in the settings modal                    |
| SAVE and LOAD `settings.yaml`                                | Create the settings YAML helpers - modal footer wiring                  |
| Stateful restore: open flag, category, draft                 | Extend the view-state snapshot - persistence and restore hooks          |
| Record the stateful convention in documentation              | Update project documentation                                            |
| New toggles default to current behaviour                     | Add the new storage keys - `DEFAULT_SETTINGS`                           |
| Full RESET clears the new keys                               | Verified `applicationStorage.ts` prefix sweep, no change needed         |

Requirements with no covering step: none. Steps with no stated requirement: none.

## Ambiguity

Wording that admitted more than one implementation, resolved.

- "Label and control rows" - resolved to the `MidiModal` row convention: fixed-width uppercase label left, control right, `.settings-row` and `.settings-label` classes.
- Paste mode option labels - resolved to the `PasteTrackModal` wording: "Replace track data entirely", "Overwrite all steps", "Overwrite only empty steps".
- "Footer action bar" - resolved to the `MidiModal` arrangement: `CANCEL` and `RESET` left, `LOAD`, `SAVE`, `OK` right. The change record named OK, RESET, SAVE, and LOAD - the draft commit model adds CANCEL as the visible discard path beside ESC.
- RESET semantics under the draft model - resolved: RESET replaces the draft with defaults after confirmation; the commit still waits for OK.
- `settings.yaml` member naming - resolved to camelCase mirroring `SettingsValues` (`trackBackground`, `startupTone`, `restoreCursor`, `restoreView`, `pasteTrackMode`), since no compound-key precedent exists in `FORMAT.md`.

## Implementability

Checked each step against the tree.

- `RestorableModal`, `UiState`, `loadUiState`, `saveUiState`, `updateMarkdownScroll`, `updateWindowScroll` exist in `src/utils/storage/uiState.ts` and follow the documented read-modify-write pattern.
- `useModalState`, `useNavigationSuspension`, `useModalManager`, `useUiStatePersistence`, `useStartupRestore`, `useEditorPersistence` exist at the referenced paths with the interfaces the plan extends.
- `TrackPasteMode` is exported from `src/utils/track/trackClipboard.ts` as `'replace' | 'overwriteAll' | 'overwriteEmpty'`.
- `useTrackFocus` owns `setTrackBackgroundEnabled` internally and persists through `useEditorPersistence`; exposing the setter is a one-line return addition.
- `usePasteTrackOptions` owns `setPasteTrackMode` internally with a persist effect already writing `PASTE_TRACK_MODE`; exposing it is a one-line return addition.
- `DialogFrame`, `.modal-backdrop`, `.modal-dialog`, `.modal-title`, `.modal-body`, `.modal-actions`, `.command-btn`, `.theme-toggle` all exist in `src/components/DialogFrame.tsx` and `src/App.css`.
- `applicationStorage.ts` clears every `dosound-tracker-` prefixed key except `THEME` and `DEBUG_MODE` - the new keys are swept with no change.
- `MAX_IMPORT_BYTES`, `downloadFile`, and the `MidiConfigurationFormatError` precedent exist for the YAML helpers.
- `js-yaml` is a declared dependency (`yaml` import in `midiConfiguration.ts`).

Steps that fail the check: none.

## Fidelity

- Enumeration fidelity - all six settings, both categories, and all five footer actions named by the change record appear in the plan. No element is deferred.
- Vocabulary freeze - the `settings.yaml` vocabulary is stated once here and once in `FORMAT.md`: root `settings`, `version: 1`, `general` and `editor` maps, camelCase members. The session snapshot vocabulary is `openModal: 'settings'` plus `settingsView: { category, draft }`.
- Cross-party parity - writer and reader are specified for every interchange: `buildSettingsYaml`/`parseSettingsFromYaml`, `updateSettingsView`/`loadUiState`, `saveUiState`/`loadUiState`, and the commit callback `onCommit`/`handleCommitSettings`.
- Constants completeness - `DEFAULT_SETTINGS`, `SETTINGS_CATEGORIES`, the three new storage keys, the `'on'`/`'off'` flag encoding, `MAX_IMPORT_BYTES`, and the 80vw/720px/80vh dialog bounds are all enumerated in the plan.
- Boundary decisions - the draft-versus-committed boundary is decided: keys are written only by OK, RESET touches the draft only, LOAD fills the draft only. The restore boundary is decided: `RESTORE_VIEW` gates the whole `restoreView` call including scroll restore, and `RESTORE_CURSOR` gates cursor application while cursor recording continues.
- Ordering decision - `handleCancelSettings` and `handleConfirmSettings` run first in their `useModalManager` chains, consistent with the existing convention that the most complex open modal answers first. An error modal raised by LOAD then waits for the next ESC, matching `MidiModal` behaviour.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    | -       | -                |
