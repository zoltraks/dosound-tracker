# Extend Accessibility Support

**Type:** Feature

## Summary

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Intent        | Build on the applied accessibility baseline with screen-reader support, |
|               | contrast options beyond the two themes, and text size scaling           |
| Key decisions | Scope lands in three independent slices so each can ship on its own     |
| Open risks    | A tracker UI is dense and keyboard-first - screen-reader semantics need |
|               | a designed reading order, not a blanket ARIA pass                       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The applied accessibility baseline covered the first pass; the wider
gaps remain. Three enhancements build on it, each independently shippable.

**Screen reader support.** Panels, controls, and editable grids carry
labels and roles a screen reader can announce meaningfully. The pattern
editor's dense grid is the hard surface - a designed reading order (row
announcement with column context) beats exposing every cell.

**High contrast options.** A contrast variant beyond the current dark
and light themes improves readability for low-vision users. The variant
follows the theme mechanism already in place.

**Text size scaling.** The monospaced DOS-style interface renders at a
fixed size. A scaling option enlarges UI text without breaking the
fixed-grid layout - scaling bounds and layout behaviour under scaling
are defined in the plan.

Keyboard navigation is already comprehensive and stays unchanged.

## Use Cases

- When a screen reader user moves through sections, each section
  announces its name and the focused control's role and value.
- When the user selects the high-contrast variant, panels and text
  remain legible against their backgrounds.
- When the user increases text size, the layout still fits the window
  and panels scroll their own content.

## Hints

- Reuse the settings mechanism for new options - each accessibility
  setting is a candidate for the settings modal's categories.
- `standard/accessibility-general-development.md` is the adopted
  engineering standard for this work.
- The baseline record lives at `docs/change/1.4.5/apply-accessibility-baseline.md`.

## Out of Scope

- Mobile screen-reader (touch) flows - the scope is the desktop and web
  keyboard-first interface.
- Localization or translated announcements.
