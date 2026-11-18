# Style the selected Dump chip button like a hovered command button

**Type:** Fix

## Summary

| Field         | Value                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | The selected CHIP 1/CHIP 2 button in the Dump panel should read as active at rest, matching the fill, label, and border colors of a hovered `command-button`. |
| Key decisions | Reuse the `command-button` hover palette through theme variables so the selected state adapts to dark, light, and contrast themes.                            |
| Open risks    | None - a single CSS rule restyle; the hover rules that layer on top are unchanged.                                                                            |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The Dump panel's chip switcher marks the active chip with
`.chip-switcher-button.active`, which currently uses hardcoded colors - a
gray-blue fill, a black border, and dark label text - that do not adapt to
the theme and do not match the rest of the interface's active affordance.

The selected button, while not hovered, should present the same colors a
`command-button` shows on hover: the `--button-hover` to `--button-active`
gradient fill, the `--border-bright` border, and the `--button-text` label.
Applying the command-button hover box shadow keeps the selected state
visually consistent with the hovered command buttons it references.

Hover behaviour is unchanged: hovering any chip button still applies the
existing theme hover fill and lime frame, including on the selected button.

## Use Cases

- When a dual-chip song is loaded and the Dump panel shows CHIP 1 selected,
  the CHIP 1 button carries the hovered-command-button colors until the
  pointer moves over it.
- When the theme switches to light or contrast, the selected chip button
  keeps readable theme-correct colors instead of the previous fixed palette.

## Hints

- `.chip-switcher` classes are used only by `DumpPanel.tsx`; the A-C/D-F
  switcher uses different classes, so the change is scoped to the Dump
  panel.
- `.chip-switcher-button:hover` and the `.dark` hover variants are declared
  after `.active` on purpose; the restyle must keep that ordering so hover
  still wins over the selected resting state.

## Out of Scope

- The chip switcher's hover colors, layout, or the A-C/D-F track switcher.
- Any change to which chip the Dump panel displays or how selection works.
