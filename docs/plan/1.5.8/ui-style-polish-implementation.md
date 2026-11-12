# UI Style Polish Implementation Plan

**Change Request Reference:** `docs/change/1.5.8/ui-style-polish.md`

## Summary

| Field         | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| Goal          | Land the five accepted polish items in `App.css` as one pass         |
| Scope         | `src/App.css` only; `modalRendering.ts` descriptor cleanup allowed   |
| Key decisions | Font scale lives once in `:root`; gap consolidation is value-neutral |
| Risks         | 7px and 11px sizes normalize visibly; modal text gets roomier        |

## Approach

All five items are CSS-only changes inside `src/App.css`, plus an optional
small cleanup in `src/utils/panel/modalRendering.ts`. No component markup or
behavior changes.

## Implementation Steps

1. **Font scale**: add `--fs-xs: 8px; --fs-sm: 9px; --fs-md: 10px; --fs-lg: 12px; --fs-xl: 14px; --fs-2xl: 16px` to `:root`; replace every hardcoded `font-size` with the matching variable (`7px`->`--fs-xs`, `8px`->`--fs-xs`, `9px`->`--fs-sm`, `10px`->`--fs-md`, `11px`->`--fs-md`, `12px`->`--fs-lg`, `14px`->`--fs-xl`, `16px`->`--fs-2xl`); leave `0.95em` (relative to parent) as is.
2. **Modal line height**: change `.modal-body` to `line-height: 1.2rem`; delete the `.export-modal .modal-body` and `.export-summary-modal .modal-body` override rules; remove the `export-summary-modal` class from the two descriptors in `modalRendering.ts` (keep the `className` plumbing on `InfoModalDescriptor`/`InformationModal` - it is generic).
3. **Themed colors**: move the themeable hardcoded values into the theme variable sets - error-tint `rgba(127,29,29,0.25)`, status glows at the three focus/error glow rules, the `rgba(0,0,0,0.6)` overlay, selection `rgba(0,0,0,0.25)`/`rgba(255,255,255,0.25)` pair, and `text-shadow` alphas; define per-theme equivalents in `.light` and `.contrast` where the value must differ; leave functional/piano-key colors alone.
4. **Focus visibility**: at each `outline: none` interactive element, add a `:focus-visible` rule consistent with `.command-button:focus-visible` (active border + glow box-shadow), respecting each element's own colors.
5. **Spacing scale**: add `--gap-1: 3px; --gap-2: 4px; --gap-3: 6px; --gap-4: 8px; --gap-5: 16px` to `:root`; replace `gap:` declarations with the nearest variable - value-neutral (1px separator gaps stay literal).
6. Run the verification loop.

## Documentation

- `SPECIFICATION.md` / `MANUAL.md`: no behavioral surface changes - the
  export-summary line-height bullet in `SPECIFICATION.md` may need a wording
  touch if it describes the `export-summary-modal` class; check and update.
- The `export-summary-line-height` record stays as history; this record
  supersedes its mechanism, not its intent.

## Test Strategy

- No new tests - visual polish; existing suite must stay green.
- `InformationModal` className-forwarding test remains valid (the prop stays).
- Manual check: dev server, three themes, tab through controls, open modals.

## Definition of Done

- All five items landed; `App.css` uses the scales and variables.
- Verification loop clean (typecheck, lint, format, build, tests).

## Refinements

Recorded after the vista-skill evaluation of the landed pass.

- `--gap-0: 2px` added to the scale and the ten remaining `gap: 2px` sites
  migrated - the evaluation found the most-used literal had been left outside
  the scale.
- `.light` gains `--overlay-dim: rgba(0, 0, 0, 0.35)` - the shared 60% scrim
  was heavy over the light page; contrast keeps its stronger `0.75`.
- The `1.2rem` modal line-height was checked against modal overflow handling:
  every modal is height-capped (`50vh`-`90vh`) and `modal-body` variants
  scroll (`overflow-y: auto`), so the roomier height degrades to scrolling,
  never clipping. No change needed.
- The audit also found and this pass fixed a latent defect: `.light` defined
  `--midi-output-enabled-bg` and `--midi-both-enabled-bg` flat while the
  rules consumed `-bg-left`/`-bg-right`, leaving the gradients undefined in
  the light theme.
- An interactive instrument-list pass landed after the audit pass, recorded
  in the change record's added paragraph: zebra striping via per-theme
  `--instrument-zebra-tint`, uniform 16px controls, tuned row/scrollbar
  spacing, Ubuntu Mono `--fs-lg` row text, the same font for
  `.notes-content`, and no hover border recolor on `.command-panel`. The
  accompanying code fixes were `size={12}` on six lucide chevrons in
  `InstrumentSection`, `PlaylistLine`, and `NumberSpinner` - the unused
  `h-3 w-3` utility class left them at the 24px default, and the overflow
  inflated the instrument list's scroll area by 3px - plus the container
  flex column, a `ResizeObserver` flooring the container's fractional
  height, and scroll-into-view on instrument add.
