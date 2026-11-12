# Specification Audit - Invert Section State Backgrounds

## Document Information

|            |                                                               |
| ---------- | ------------------------------------------------------------- |
| Change     | `docs/change/1.5.5/section-state-backgrounds.md`              |
| Plan       | `docs/plan/1.5.5/section-state-backgrounds-implementation.md` |
| Audit Date | 2026-11-11                                                    |

## Completeness

Every requirement in the change record maps to a plan step:

| Requirement                                             | Plan step                                         |
| ------------------------------------------------------- | ------------------------------------------------- |
| Active section darker than normal, all three themes     | Three variable-inversion steps                    |
| Hovered inactive section lighter than normal            | Same steps - hover takes the old active tone      |
| Hovered active section gets a third distinct background | `--section-active-hover-bg` + eight rule steps    |
| `--section-active-hover-border` stays as is             | Only a background line is added to each rule      |
| Light and contrast themes keep the same reading         | Per-theme values in the two remaining theme steps |
| `--track-hover-bg` unchanged                            | Untouched - only the `.active:hover` rule changes |
| Combined state on the eight `.x.active:hover` rules     | Flat-section and gradient-section steps           |
| Gradient panels get the matching gradient variant       | Gradient-section step mirrors each hover shape    |

No requirement lacks a covering step and no step lacks a stated requirement.

## Ambiguity

- The combined value is defined as `color-mix(section-hover-bg 75%, active-bg 25%)` in every theme - a between-mix that is guaranteed distinct from both states and adapts per theme. Final tones are verified visually on the dev server per the record's tooling hint.
- `.track-panel:hover` paints its frame with `--track-hover-bg`, not `--section-hover-bg`. The record names the variable unchanged, so the track panel keeps its current hover tone while its `.active:hover` rule still receives the combined gradient built on `--section-active-hover-bg`.
- `.position-block:hover` is a sub-element inside the command panel with no `.active` state - it keeps the new `--section-hover-bg` in its gradient automatically and needs no rule of its own.

## Implementability

- All eight `.x.active:hover` rules were located in the tree: `.octave-selection`, `.command-panel`, `.track-panel`, `.envelope-panel`, `.information-panel`, `.playlist-panel`, `.instrument-panel`, `.piano-keyboard`.
- The variable references in `color-mix` resolve at use time, so declaration order inside a theme block is unconstrained.
- `.octave-selection.active:hover` uses `border-bottom-color` while the other seven use `border-color` - the plan records the difference so only the background line is added in each rule.
- `.piano-keyboard.active:hover` must override the full `background` shorthand because its hover rule sets `background`, not `background-color` - the plan carries the matching gradient.

## Fidelity

- Enumeration fidelity: all eight section rules are named; the three theme blocks (`:root`, `.app.light`, `.app.contrast`) each get all three variables.
- Vocabulary freeze: `--section-active-hover-bg` is the only new token; existing variable names are reused verbatim.
- Cross-party parity: the same 75/25 mix formula produces the combined state in all themes, so no theme can drift to a different semantic.
- Constants completeness: every named value in the record (`--active-bg`, `--section-hover-bg`, `--section-active-hover-border`, `--track-hover-bg`) has a stated fate - changed, added, or explicitly unchanged.
- Boundary decisions: borders, glows, non-section surfaces, and activation logic stay untouched, matching the record's Out of Scope list.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
