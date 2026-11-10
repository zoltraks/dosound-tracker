# Specification Audit - Apply the adopted accessibility baseline

## Document Information

|            |                                                                  |
| ---------- | ---------------------------------------------------------------- |
| Change     | `docs/change/1.4.5/apply-accessibility-baseline.md`              |
| Plan       | `docs/plan/1.4.5/apply-accessibility-baseline-implementation.md` |
| Audit Date | 2026-11-10                                                       |

## Completeness

| Requirement (record)                                         | Plan step                                                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Controls carry accessible names and roles                    | Name the header controls; Name the tracker surface controls; Name the remaining panels and quick-win controls |
| Focus is visible and follows the documented navigation order | Existing `:focus-visible` styles on `.command-btn` verified - no restyle per scope                            |
| Message rotation announces through `aria-live`               | Announce the rotating message surface                                                                         |
| Modal state changes announce; dialogs described correctly    | Give modal dialogs dialog semantics                                                                           |
| Tracker widgets expose keyboard-equivalent operation         | Existing section-level keyboard navigation accepted; panels labelled, cells roled, no grid redesign           |

No uncovered requirements; no orphan steps.

## Ambiguity

- "Accessible name" for composite widgets admits two readings: label the
  focusable panel, or label every cell. The plan labels the panel
  (`role="group"` + `aria-label`) and adds `role="button"` + `aria-label` to
  clickable cells without adding tab stops, matching the existing
  panel-level navigation model.
- The record asks for `aria-label`/`aria-labelledby` pointing at the modal
  title. The plan uses `aria-label` carrying the same title text - equivalent
  naming without introducing id plumbing across 13 components.
- `.message-panel` is both the live region and a click target. The plan keeps
  `role="status"` per the record and retains `onClick`; keyboard users reach
  the notes toggle through the existing section bindings.

## Implementability

- All referenced files exist under `src/components/` and `src/modals/`.
- `.modal-dialog` renders once per modal component; `DownloadModal` delegates
  to `FilePickerModal`, covering its surface.
- `aria-hidden="true"` on `.message-panel` confirmed at
  `src/components/EnvelopeSection.tsx:93`.
- `.command-btn:focus-visible` exists at `src/App.css:658` - focus-indicator
  requirement already met.
- No `eslint-plugin-jsx-a11y` in `eslint.config.js` - added ARIA markup is not
  lint-blocked; attributes were checked manually against the standard.
- No axe-core or jest-axe in dependencies - verification is attribute-level
  census plus targeted component tests, matching the record's open risk.

## Fidelity

- Enumeration fidelity: every `.modal-dialog` container in `src/modals/` is
  covered (13 files); `DownloadModal` covered transitively.
- Vocabulary freeze: `role="dialog"` + `aria-modal="true"` identical on every
  dialog; `role="status"` + `aria-live="polite"` on the message panel.
- Constants completeness: no new numeric bounds, limits, or defaults.
- Boundary decisions: pattern-grid cells, instrument rows, and playlist lines
  keep existing keyboard navigation - explicitly deferred from per-cell
  tabbable redesign by the record's scope.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
