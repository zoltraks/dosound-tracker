# Specification Audit - Expand End-to-End Coverage

## Document Information

|            |                                                         |
| ---------- | ------------------------------------------------------- |
| Change     | `docs/change/1.5.2/expand-e2e-coverage.md`              |
| Plan       | `docs/plan/1.5.2/expand-e2e-coverage-implementation.md` |
| Audit Date | 2026-11-11                                              |

## Completeness

- Settings flow with persistence across reload - covered by flow 1.
- Sound engine switch with playback - covered by flow 2; the audible-outcome
  surface is position advancement plus the persisted engine key.
- VGM and MAX download assertions - covered by flows 3 and 4.
- An About-document modal flow - covered by flow 5 (About opens, changelog
  renders).
- One independent `test` per flow, helpers in `e2e/helpers.ts` - honoured.

## Ambiguity

- "Verify audible context state" - resolved to position advancement plus the
  persisted engine key; the AudioContext instance is not page-reachable, and
  position movement is the observable proof that the engine pipeline runs.

## Implementability

- `#settings-category-sound`, `#settings-sound-engine`, `#settings-theme`,
  `#settings-action-ok` exist in `src/modals/SettingsModal.tsx` - verified.
- `VGM` and `MAX` buttons exist in `src/modals/ExportModal.tsx` and call
  `onExportVgm`/`onExportMax` which produce downloads - verified.
- `.logo` carries `aria-label="About DOSOUND Tracker"` in `HeaderPanel.tsx`;
  `AboutModal` renders `CHANGES` opening `MarkdownModal` - verified.
- Storage keys `dosound-tracker-theme` and `dosound-tracker-sound-engine`
  verified in `src/utils/storage/storageKeys.ts`.
- `clickAndDownload` and `commandButton` helpers exist post-stabilize.

## Fidelity

- Magic-byte assertions (`Vgm `, `MAX `) match the format writers in
  `src/exports/vgm.ts` and `src/exports/max.ts`.
- Both chromium and webkit run every new flow - parity holds by construction.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
