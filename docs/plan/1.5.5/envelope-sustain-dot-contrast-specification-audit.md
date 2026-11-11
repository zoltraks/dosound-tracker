# Specification Audit - Contrast the Sustain Dot

## Document Information

|            |                                                                   |
| ---------- | ----------------------------------------------------------------- |
| Change     | `docs/change/1.5.5/envelope-sustain-dot-contrast.md`              |
| Plan       | `docs/plan/1.5.5/envelope-sustain-dot-contrast-implementation.md` |
| Audit Date | 2026-11-11                                                        |

## Completeness

Every requirement in the change record maps to a plan step:

| Requirement                                                  | Plan step                                     |
| ------------------------------------------------------------ | --------------------------------------------- |
| Dot keeps black while the sustain bar reaches 50% or more    | `getBarHeight >= 50` keeps the base class     |
| Below that line the dot renders a contrasting idle color     | `idle` modifier class + `.idle` CSS rule      |
| Per-theme idle color: light gray / dark gray / high-contrast | `--envelope-sustain-dot-idle` per theme block |

No requirement lacks a covering step and no step lacks a stated requirement.

## Ambiguity

- "Reaches the dot's position" resolves to the record's own quantified rule - bar height of 50% or more - implemented as `getBarHeight(value) >= 50` on the sustain index's bar.
- The threshold lands on the rendered bar, not the raw value; for the volume type `getBarHeight` is `value / VOLUME_MAX * 100`, so `>= 50` means value `>= 8`.

## Implementability

- `sustainIndex` and `envelopeData` are already in scope at the dot's render site, and `getBarHeight` is the memoized helper the bars themselves use - the check needs no new imports or state.
- The `.envelope-sustain-dot` rule and all three theme blocks exist in `src/App.css`; the new variable follows the `--envelope-*` naming already in use.
- The existing sustain-dot tests in `test/components/EnvelopePanel.test.tsx` establish the render pattern the new tests extend.

## Fidelity

- Enumeration fidelity: the record's single element, single state switch, and three theme values are all covered - nothing else changes.
- Vocabulary freeze: `idle` is the only new class token; `--envelope-sustain-dot-idle` is the only new variable.
- Cross-party parity: the component computes the state, the stylesheet owns the color - the same split the bars use.
- Boundary decisions: size, position, and the sustain-bar inset shadow stay untouched, matching the record's Out of Scope list; other envelope types keep no dot, as before.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
