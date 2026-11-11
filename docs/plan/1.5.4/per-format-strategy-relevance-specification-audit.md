# Specification Audit - Per-Format Strategy Relevance

## Document Information

|            |                                                                   |
| ---------- | ----------------------------------------------------------------- |
| Change     | `docs/change/1.5.4/per-format-strategy-relevance.md`              |
| Plan       | `docs/plan/1.5.4/per-format-strategy-relevance-implementation.md` |
| Audit Date | 2026-11-11                                                        |

## Completeness

| Requirement                                                    | Covering plan step                                 |
| -------------------------------------------------------------- | -------------------------------------------------- |
| Annotate the strategy selector's per-format effect             | Format button markers and caption                  |
| React to the What selection (instrument scope honors MAX only) | Strategy relevance helper scope map                |
| Keep persisted `exportStrategy` untouched                      | Type and State Updates - no state changes          |
| Modal tests cover the annotation states per format             | Testing Strategy - integration tests               |
| `npm run test:e2e` export flows unchanged                      | `aria-hidden` marker keeps accessible button names |

No requirement lacks a covering step and no step serves a foreign requirement.

## Ambiguity

- The marker glyph (`*`), its `aria-hidden` placement, the caption position
  under the format grid, and the exact caption strings are all fixed in the
  plan - one reading only.

## Implementability

- `src/constants/export.ts` exists and already carries the `ExportType` and
  `ExportStrategy` unions - the `ExportFormat` union joins it.
- `src/utils/export/` exists (`exportFileNaming.ts`, `exportSummary.ts`) -
  the new helper file fits the domain directory.
- `src/modals/ExportModal.tsx` receives `exportType: ExportType` as a prop -
  no new wiring through `ModalManager` or `useExportModal` is needed.
- Scope-to-strategy map verified in `src/hooks/file/useFileOperations.ts`:
  `exportInstrumentToMax` is the only instrument path taking a strategy
  parameter; DATA, BIN, VGM, and MAX take it on the song paths.
- `--text-dim` exists in the `src/App.css` palette.
- `test/utils/export/` and `test/modals/ExportModal.test.tsx` exist.
- The e2e suite clicks format buttons by accessible name
  (`e2e/smoke.spec.ts`); an `aria-hidden` span does not enter the computed
  name, so `DATA`, `VGM`, `MAX`, `MOD`, `MIDI` selectors keep matching.

## Fidelity

- Enumeration fidelity - all eight format buttons are covered by the
  relevance map: four strategy consumers per scope at most, the rest false.
- Vocabulary freeze - the format ids reuse the `ExportFormat` union; button
  labels and persisted strategy values are unchanged.
- Constants completeness - the scope map, marker glyph, and caption strings
  are enumerated in the plan; no constants left for rediscovery.
- Boundary decisions - the annotation is display-level; a future format
  joins the map by convention, recorded in `SPECIFICATION.md`.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| `none`  | -       | -                |
