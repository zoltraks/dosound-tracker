# UI Style Polish

**Type:** Enhancement

## Summary

| Field         | Value                                                              |
| ------------- | ------------------------------------------------------------------ |
| Intent        | Consolidate scattered style values into themed variables and close |
|               | the visible polish gaps: font scale, modal line height, themed     |
|               | colors, focus visibility, and spacing                              |
| Key decisions | One pass over `App.css`; zero structural or behavioral changes     |
| Open risks    | Font-size normalization shifts two sizes slightly (7px, 11px)      |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

A general polish audit of `src/App.css` found five consolidation targets.

- Ten distinct hardcoded font sizes (7px through 16px) carry no scale;
  `font-family: var(--font-mono)` already shows the variable pattern works.
- `.modal-body` defaults to `line-height: 0.8rem` while the export modals
  needed `1.2rem` - the tight default is the anomaly, not the override.
- Roughly fifty hardcoded color values sit outside the theme blocks; the
  ones that encode themeable meaning (status glows, selection overlays,
  error tints) belong in the theme variable sets.
- Only `.command-button` has a `:focus-visible` style; several interactive
  elements carry `outline: none` with no visible keyboard-focus state.
- Gap values fragment across six sizes with no scale.

A second, interactive polish pass over the instrument list and message
panel landed in the same window: instrument rows gained odd/even striping
that stays visible over equal instrument colors, uniform 16px control
heights, tuned row and scrollbar spacing, and Ubuntu Mono at `--fs-lg`
for numbers and names; the message panel's rotating notes adopted the
same font and size; the command bar no longer recolors its frame on
hover; and oversized lucide chevron glyphs (a dead `h-3 w-3` utility
class left them at the 24px default) were pinned to `size={12}`, which
also removed phantom scroll overflow inside the instrument list, the
playlist, and the number spinner.

## Use Cases

- When a user tabs through the interface, every interactive element shows a
  visible focus state consistent with the command-button treatment.
- When any modal opens, body text uses the roomier `1.2rem` line height
  without per-modal overrides.
- When a theme is applied, status tints and overlays follow the theme's
  palette instead of fixed rgba values.

## Hints

- Font sizes are not theme-dependent - the scale can live once in `:root`.
- The `export-summary-modal` class plumbing landed this version to lift one
  modal's line height; a corrected `.modal-body` default makes the override
  rules redundant - remove the rules, keep or drop the plumbing as the
  implementation finds cleanest.
- Piano-key black/white colors encode physical keys - leave them hardcoded.
- Two sizes normalize visually: 7px moves to the 8px floor, 11px folds into
  the nearest scale step.

## Out of Scope

- Redesigning the palettes - the three themes' hues stay as they are.
- Layout restructuring, new components, or responsive breakpoints.
- Piano-key recoloring.
