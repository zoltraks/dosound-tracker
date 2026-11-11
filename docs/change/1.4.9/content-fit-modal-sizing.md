# Content-Fit Modal Sizing

**Type:** Fix

## Summary

| Field         | Value                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------- |
| Intent        | Size tall content modals to their content on desktop and to the full screen on the mobile layout   |
| Key decisions | The settings dialog drops its fixed `80vh` height; the mobile query promotes modals to full screen |
| Open risks    | none                                                                                               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Content modals carry fixed viewport-height fractions
(`settings-modal` `80vh`, `text-display` `80vh`, `midi-modal` `90vh`,
`download-modal` `50vh`). On a desktop window taller than roughly 600 px
the settings dialog still claims 80% of the viewport, leaving a tall empty
pane under a handful of settings rows. In the mobile layout the same
modals keep their `vh` heights - the About dialog renders at 80% of a
narrow screen instead of using the space it needs.

This record sizes the settings dialog to its content on the desktop
layout: the dialog takes the height its controls need, capped at the
current `80vh` bound, and stays centered in the backdrop. In the mobile
layout (`max-width: 1100px` or `max-height: 700px`) the tall content
modals - settings, text display (About/markdown), MIDI, download - expand
to fill the screen, keeping their own internal scrolling regions.

## Use Cases

- When the settings modal opens on a desktop window taller than its
  content, the dialog is no taller than the settings it shows and stays
  centered vertically and horizontally.
- When the settings pane holds more rows than fit, the pane scrolls
  inside the capped dialog as it does today.
- When the settings, About, MIDI, or download modal opens in the mobile
  layout, the dialog fills the viewport and its content region scrolls.
- Small confirm and option dialogs keep their centered card sizing in
  every layout.

## Hints

- `.modal-backdrop` already flex-centers `.modal-dialog` - dropping the
  fixed `height` on `settings-modal` gives content fit with no layout
  rework; keep `max-height: 80vh` as the cap.
- The mobile block at `@media (max-width: 1100px), (max-height: 700px)`
  already retargets `.modal-dialog.text-display`; extend the same rule to
  the other sized modals and set full-screen width and height there.
- `.settings-pane`, `.text-display-body`, `.download-modal-body`, and the
  MIDI body already own `overflow-y: auto` - the fullscreen height only
  gives those regions room to scroll.
- `isMobileViewport` in `src/hooks/ui/useResponsivePanels.ts` mirrors the
  media query - no JS change is expected.

## Out of Scope

- Restyling modal chrome (borders, backdrop, title bar).
- Reordering or resizing the desktop settings sidebar.
- Sizing changes to non-content dialogs (confirmations, warnings, export).
