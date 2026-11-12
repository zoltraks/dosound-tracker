# Track Fragment Selection Implementation Plan

## Summary

| Field         | Value                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| Intent        | Select a row range inside a track and copy, cut, and paste fragments through the clipboard |
| Key decisions | Selection state in `useTrackOperations`, silent paste gated by a committed settings toggle |
| Open risks    | none                                                                                       |

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.6/track-fragment-selection.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`. Selection is ordinary editor state - it uses React state, the per-key storage convention, and the shared `updateSong` mutation path. No audio-rate state, refs, or sequencer callbacks are touched.

## Documentation Updates

- `PROJECT.md` gains requirement F-21 describing the selection model and the clipboard bindings.
- `SPECIFICATION.md` gains the selection and clipboard shortcut list, the `TRACK_SELECTION` session-persistence entry, and the `PASTE_CONFIRM` settings key.
- `FORMAT.md` documents the `editor.confirmPaste` member of `settings.yaml`.
- `public/MANUAL.md` lists the new shortcuts and the new EDITOR setting.

## Type and State Updates

- `src/utils/track/trackSelection.ts` (new): the `TrackSelection` type `{ trackId, anchor, head }`, `normalizeTrackSelection`, `clampSelectionRow`, `extendTrackSelection`, `selectionRangeForTrack`, and the `readTrackSelection`/`writeTrackSelection` storage pair under `StorageKeys.TRACK_SELECTION`.
- `StorageKeys` gains `TRACK_SELECTION` and `PASTE_CONFIRM`.
- `SettingsValues.editor` gains `confirmPaste: boolean`, default `false`, normalized, loaded, written, and emitted to `settings.yaml`.
- `usePasteTrackOptions` owns the committed `confirmPaste` flag; `getPasteTrackMode` resolves the stored mode silently when the flag is off and opens the confirmation modal when it is on.
- `useTrackOperations` owns the selection state, persists it on change, restores it clamped through `readTrackSelection`, and exposes `handleExtendSelection` plus selection-aware copy, cut, and paste handlers.

## Step by Step Implementation

**Clipboard range and offset support**

`generateClipboardData` accepts an optional `{ start, end }` row range and serializes only those rows; `applyClipboardToLines` accepts a `startOffset` so pasted steps land at the cursor row and rows outside the fragment window keep their base content - the offset-0 path preserves the previous whole-pattern replace semantics. Files: `src/utils/track/trackClipboard.ts`.

**Selection state and persistence**

`useTrackOperations` holds `trackSelection` as lazy state restored through `readTrackSelection(song.length)`, writes it through `writeTrackSelection` on change, and exposes `handleExtendSelection(trackId, delta)` which extends the anchor/head pair and moves `sharedCurrentLine` to the new head. SHIFT+ARROWUP/SHIFT+ARROWDOWN in `TrackPanel` call `onExtendSelection` instead of plain cursor movement. Files: `src/hooks/song/useTrackOperations.ts`, `src/components/TrackPanel.tsx`, `src/components/TrackerSection.tsx`, `src/App.tsx`.

**Keyboard clipboard actions**

`KEYBOARD_SHORTCUTS` maps `CTRL+C`/`CTRL+X`/`CTRL+V` to `copyTrack`/`cutTrack`/`pasteTrack`; `matchKeyboardShortcut` produces them with `preventDefault`. They are registered as global shortcuts in `useKeyboardShortcuts` and gated on an active track section inside `useTrackOperations`. Copy serializes the normalized selection range, or the whole track when the selection is absent or on another track. Cut copies the range, clears the covered note and volume cells through `updateSong`, and drops the selection. Paste anchors at the cursor row. Files: `src/constants/navigation.ts`, `src/utils/keyboard/keyboardShortcutUtils.ts`, `src/hooks/keyboard/useKeyboardShortcuts.ts`, `src/hooks/song/useTrackOperations.ts`, `src/App.tsx`.

**Paste confirmation setting**

`editor.confirmPaste` (default off) rides the settings draft through `SettingsModal`, `useSettingsSession`, `settingsState`, and `settingsYaml`; `usePasteTrackOptions` persists it under `PASTE_CONFIRM` and returns the stored paste mode without opening the modal while it is off. The existing paste window check now scans only the pasted rows. Files: `src/types/settings.ts`, `src/utils/settings/settingsState.ts`, `src/utils/settings/settingsYaml.ts`, `src/modals/SettingsModal.tsx`, `src/hooks/modal/useSettingsSession.ts`, `src/hooks/modal/usePasteTrackOptions.ts`.

**Selection rendering**

`TrackLine` accepts `isSelected` and appends the `selected` class; `TrackPanel` computes it per row from the range passed down by `TrackerSection`, which maps `selectionRangeForTrack(trackSelection, trackId, patternLength)`. `App.css` gains `--track-selection-bg` per theme and the `.track-line.selected` rules, including the instrument-color tint mix. Files: `src/components/TrackLine.tsx`, `src/components/TrackPanel.tsx`, `src/components/TrackerSection.tsx`, `src/App.css`.

## Implementation Order

Documentation first, then utilities (`trackSelection.ts`, `StorageKeys`, `trackClipboard.ts`), then keyboard constants and matching, then the `useTrackOperations` orchestration, then settings plumbing, then rendering and styles, then tests, then the verification loop.

## Refinements

Decisions made during implementation that refined the approved plan, recorded for future review:

- **Clipboard actions follow the selection's track.** `CTRL+C` and `CTRL+X` operate on the track the selection belongs to, not the focused track - the selection is the operand. `CTRL+C` falls back to the whole active track only when no selection exists.
- **The confirmation gate applies to all clipboard pastes.** `getPasteTrackMode` resolves the stored paste mode silently while `confirmPaste` is off, so the PASTE TRACK command pastes silently as well - the modal returns only when the setting is enabled. The change record's "fragment pastes" phrasing narrowed to all pastes at the shared gate.
- **The overwrite check scans the paste window only.** `hasExistingData` is computed over the pasted rows at the anchor instead of the whole pattern, so a fragment paste does not prompt on data it cannot touch.
- **Extension requires the cursor on the moving edge.** `extendTrackSelection` continues an existing range only when the cursor row equals the head - Shift+Arrow from any other position anchors a fresh selection at the cursor. The approved plan's "extend the head" phrasing covered the continuing case; the fresh-anchor behavior is the corrected boundary.
- **A fragment copy preserves its size.** `generateClipboardData` skips the trailing-empty trim when a range is passed - empty rows at the end of a selection are real content that clears the destination on paste, and the post-paste cursor lands `selection size` rows below the anchor rather than after the last note.
- **The range excludes the cursor row.** `normalizeTrackSelection` maps `{anchor, head}` to an anchor-inclusive, head-exclusive range - the first Shift+Arrow step selects only the origin row, and the cursor row is never rendered as selected. This refines the approved plan's `{trackId, start, end}` wording; the stored shape is unchanged.
- **Collapsing onto the anchor clears the selection.** Extending the head back onto the anchor returns `null` - Shift+Up then Shift+Down (or the reverse) is the way to drop a selection. A first step that cannot extend past the anchor (a pattern edge) creates nothing, because the stored anchor and head would coincide.
- **A fragment paste advances the cursor.** A paste that carries an anchor row (the `CTRL+V` path) moves the cursor one row below the last pasted row - `wrapIndex(lastPasted + 1)`, so a fragment reaching the pattern end wraps the cursor to row 0 rather than clamping onto the final row. The PASTE TRACK command passes no anchor and keeps its cursor unchanged.
- **The cursor row has its own selected tint.** `.track-line.current.selected` renders with `--track-selection-current-bg` (per theme, including the instrument-color mix) so the cursor row reads differently inside the selection than outside it.
- **No e2e coverage.** The plan listed a select-copy-paste e2e flow "if it lands cleanly" - it did not: system-clipboard permissions in headless Chromium outweigh the value. The clipboard paths are covered by unit tests.

This plan document itself was written after the implementation landed - it documents the applied state. The workflow now records that a confirmed plan is written to `docs/plan/<version>/` before the first code edit.

## Testing Strategy

**Unit tests**

- `test/utils/track/trackSelection.test.ts` covers normalization, clamping, extension in both directions, cross-track replacement, range mapping, and the storage round-trip including corrupt values.
- `test/utils/track/trackClipboard.test.ts` gains range serialization and offset paste cases.
- `test/utils/keyboard/keyboardShortcutUtils.test.ts` gains the clipboard chord matches.
- `test/utils/settings/settingsState.test.ts`, `settingsYaml.test.ts`, `uiState.test.ts`, `yamlEmission.test.ts`, and `SettingsModal.test.tsx` carry the new field; the `settings-default` and `settings-nondefault` emission goldens were regenerated deliberately.
- `test/components/TrackPanel.test.tsx` gains Shift+Arrow routing and selected-row rendering tests.

**E2E**

Not added - system-clipboard permissions in headless Chromium make a select-copy-paste e2e flow disproportionately heavy for this change; the clipboard paths are covered at unit level.

## Verification

Results recorded after the implementation landed.

- `npm run typecheck` - clean.
- `npm run lint` - zero errors and warnings.
- `npm run format` - applied; `npx prettier --check .` clean.
- `npm run build` - clean.
- `npm test` - 1256 tests passed.
