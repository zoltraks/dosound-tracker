# Refactoring Assessment - 1.4.5

## Summary

| Item                             | Proposed | Achieved | Result    |
| -------------------------------- | -------- | -------- | --------- |
| Stale `App.tsx` figure           | 1        | 1        | completed |
| Unexport module-internal symbols | 12       | 12       | completed |
| `DialogFrame` extraction         | 13 sites | 13 sites | completed |

Overall result: complete - all proposed items landed and verify clean.

## Proposal vs Implementation

- **Refresh the stale figure** - completed. `REFACTORING.md:41` now cites "~940-line", matching `ARCHITECTURE.md` and `SPECIFICATION.md`.
- **Unexport utils internals** - completed. Seven symbols across six files lost `export`: `applyInstrumentToRegisters`, `escapeHtml`, `isSongData`, `SONG_INFO_FIELDS`, `PLAYLIST_TRACKS`, `MODE_ENVELOPE_LENGTH`, `RESTORABLE_MODALS`. The derived types (`SongInfoField`, `PlaylistTrack`, `RestorableModal`) stay exported.
- **Unexport remaining internals** - completed. Five symbols across three files lost `export`: `normalizePlaylistLineEntry`, `serializePlaylistEntry`, `POW2_OCTAVE_SCALE`, `POW2_SEMITONE_SCALE`, `buildInstrumentPreviewSong`.
- **Add DialogFrame** - completed. `src/components/DialogFrame.tsx` renders the backdrop-plus-dialog frame with `label`, `className`, `backdropStyle`, `onKeyDown`, and `children`. `test/components/DialogFrame.test.tsx` pins role, accessible name, `aria-modal`, class composition, backdrop style, and keydown forwarding - 4 tests.
- **Migrate label-only modals** - completed. `AboutModal`, `ConfirmationModal`, `InstrumentDeleteModal`, `PasteTrackModal`, `TransposeModal` render through `DialogFrame`.
- **Migrate variant modals** - completed. `ExportModal`, `FilePickerModal`, `InstrumentTypeWarningModal`, `MarkdownModal`, `MidiModal` pass their variant class; `InformationModal` passes `backdropStyle={{ zIndex: 1100 }}`.
- **Migrate keydown modals** - completed. `InstrumentColorModal` passes `handleKeyDown`; `InstrumentMidiModal` passes its inline Escape handler verbatim.

## Deviations and Rationale

- `InstrumentMidiModal`'s multi-line inline `onKeyDown` handler was truncated by a scripted non-greedy capture and restored manually, verbatim. No behavior change - the same handler body reaches the same element.
- Modal bodies dedented one level under `DialogFrame` through `prettier --write`, so migration diffs are larger than a tag swap. Formatting stays canonical; rendered DOM is identical.
- Type-only exported-but-unused interfaces (hook `*Params`/`*Result` contracts) were left exported deliberately - they document hook signatures and removing them is churn without value.

## Verification Results

- `npm run typecheck` - clean after every step.
- `npm run lint` - clean after every step, zero errors, zero warnings.
- `npx prettier --check` on all touched files - clean.
- `npm run build` - clean (`tsc -b` + Vite bundle).
- `npm test` - 102 files, 799 tests, all green. Before: 101 files, 795 tests. Delta: the new `DialogFrame` suite (+4 tests).
- `test/modals/` - 12 files, 83 tests pass unmodified, pinning identical DOM semantics.
- Export fixtures - `src/exports/` received one keyword-level change only; byte-identity holds through the unchanged `test/exports/` suites.

## Remaining Gaps

- `ModalManager` remains a pure pass-through between `useAppModals` and `ModalContainer` (~80 forwarded props). Folding it is structural churn without a consumer win - deferred to a later window's decomposition work.
- The `trackClipboard`/`songIO` run-length duplication stays at two sites, below the Rule-of-Three threshold (carried from the 1.4.1 assessment).
- The `instrumentLookup`/`instrumentsById` duplicate-map divergence stays a recorded behavior decision (carried from the 1.4.3 assessment).

## Lessons Learned

- Scripted JSX tag extraction must match the tag's own terminator - a non-greedy `}` capture truncates multi-line inline handlers at their first closing brace. Verify each migration compiles before batch-formatting.
- The accessibility baseline was itself the Rule-of-Three trigger - stamping `role="dialog"`/`aria-modal`/`aria-label` on 13 sites created the duplication it then cost a pass to extract. Future baseline sweeps should pair the attribute rollout with the frame extraction in the same window.
