# Specification Audit - Number Spinner Theme

## Document Information

|            |                                                          |
| ---------- | -------------------------------------------------------- |
| Change     | `docs/change/1.4.6/number-spinner-theme.md`              |
| Plan       | `docs/plan/1.4.6/number-spinner-theme-implementation.md` |
| Audit Date | 2026-11-10                                               |

## Completeness

Every requirement in the change record maps to a plan step.

- Themed colors in both modes - covered by the palette step.
- Themed hover and focus-visible states - covered by the interaction-states
  step.
- One fix covering every `NumberSpinner` instance - covered structurally,
  since all instances share the `.number-spinner-button` class.

No requirement lacks a covering step and no step lacks a stated requirement.

## Ambiguity

No wording in the plan admits more than one implementation. The chosen
convention (`--button-*` palette) is named explicitly, and the alternative
`.toggle-value-button` convention is recorded as deliberately rejected in the
change record's hints.

## Implementability

Each plan step checks out against the real codebase.

- `.number-spinner-button` exists in `src/App.css` at line 2333 with geometry
  only and no conflicting color declarations.
- `--button-bg`, `--button-border`, `--button-text`, and `--button-hover` are
  defined in the root (night) block at lines 36-39 and redefined in the
  `.light` (day) block at lines 197-200.
- `--active-border` is defined at lines 25 (night) and 186 (day).
- The `.octave-button` reference convention exists at lines 511-530.
- `NumberSpinner.tsx` renders the buttons with `lucide-react` `ChevronUp` and
  `ChevronDown` icons, which stroke with `currentColor` by default, so the
  `color` property reaches the glyphs.
- No generic `button` selector exists in `src/App.css` or `src/index.css` -
  the unstyled fallback the change record describes is real.

## Fidelity

- Enumeration fidelity - all three `NumberSpinner` consumers are covered by
  the shared class: `InformationPanel.tsx`, `TransposeModal.tsx`,
  `InstrumentMidiModal.tsx`.
- Vocabulary freeze - no interchange vocabulary is touched; the change is a
  single selector's declarations.
- Cross-party parity - both theme scopes define every variable the fix reads,
  so neither theme resolves a missing token.
- Constants completeness - the only values encoded are existing custom
  properties; no new numeric constants are introduced.
- Boundary decisions - the day-mode appearance is preserved as closely as the
  palette allows (`#ffffff` background, `#2d3748` border), satisfying the
  record's requirement that day mode stays visually consistent.

## Findings Returned to Planning

none.
