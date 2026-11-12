# Specification Audit - Content-Fit Modal Sizing

## Document Information

|            |                                                            |
| ---------- | ---------------------------------------------------------- |
| Change     | docs/change/1.4.9/content-fit-modal-sizing.md              |
| Plan       | docs/plan/1.4.9/content-fit-modal-sizing-implementation.md |
| Audit Date | 2026-11-10                                                 |

## Completeness

| Record requirement                                            | Covering plan step                                    |
| ------------------------------------------------------------- | ----------------------------------------------------- |
| Settings dialog sizes to content, capped, stays centered      | Step 1                                                |
| Sized modals fill the screen under the mobile layout          | Step 2                                                |
| Internal scroll regions keep working in the fullscreen modals | Step 2 (existing `overflow-y: auto` unchanged)        |
| Small dialogs keep centered card sizing                       | Step 2 (mobile rule names only the four sized modals) |
| Verification of the rendered result                           | Step 3                                                |

No requirement lacks a covering step and no step lacks a stated
requirement.

## Ambiguity

- "Sized content modals" is enumerated in the record and the plan
  (`text-display`, `settings-modal`, `midi-modal`, `download-modal`), so
  the set is fixed; dialogs outside the list are untouched by
  construction.
- "Content height" is the CSS `height: auto` behavior - the term has one
  meaning in the engine that implements it.

## Implementability

- `.modal-dialog.settings-modal` exists at `src/App.css` with
  `height: 80vh` / `max-height: 80vh`; the edit target is present.
- The mobile media block and the `.modal-dialog.text-display` override
  inside it exist (`@media (max-width: 1100px), (max-height: 700px)`).
- `.modal-backdrop` centers `.modal-dialog` via flexbox; removing the
  fixed height cannot break centering.
- `.settings-pane`, `.text-display-body`, `.download-modal-body`, and the
  MIDI body already own `overflow-y: auto`.

Every step's preconditions hold against the real stylesheet.

## Fidelity

- Enumeration fidelity - the four sized modal classes named by the
  record are exactly the four rules carrying `vh` heights; no other
  `.modal-dialog` variant carries a viewport height.
- Vocabulary freeze - CSS class names and the media query expression are
  copied verbatim from `src/App.css`.
- Cross-party parity - `useResponsivePanels` mirrors
  `(max-width: 1100px) or (max-height: 700px)`; the mobile rule uses the
  identical query so JS and CSS layout decisions stay aligned.

## Conclusion

The plan covers the record completely and implementably. Approved for
implementation.
