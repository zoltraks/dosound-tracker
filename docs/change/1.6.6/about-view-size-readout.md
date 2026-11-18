# Show the viewport size and zoom in the About dialog

**Type:** Feature

## Summary

| Field         | Value                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| Intent        | The About dialog reports the current available screen area in pixels and the active zoom factor, live on resize.   |
| Key decisions | A `useViewportSize` hook owns the resize subscription inside the modal layer; the zoom factor travels as a prop.   |
| Open risks    | None - read-only display addition; no state, audio, or export surface is touched.                                  |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The About dialog currently shows the product name, version, and runtime
details. It gains a viewport line reporting the available screen area:

- `View: <width>x<height>` where the dimensions are the window's viewport in
  CSS pixels (`window.innerWidth` by `window.innerHeight`).
- When the zoom factor is known, the line also carries it, for example
  `View: 1024x768 @ 1.25x`. The factor is the `--app-zoom` value derived from
  the text-scale setting (`100` -> `1`, `125` -> `1.25`, `150` -> `1.5`).

The dimensions update in real time while the dialog is open: a window
`resize` listener refreshes the reported size. The line renders in every
runtime, including plain-browser sessions where no Electron runtime block
appears.

## Use Cases

- When the user resizes the window or Electron frame with the About dialog
  open, the `View:` line reflects the new pixel dimensions immediately.
- When the text scale is set to 125% or 150%, the line shows the matching
  zoom factor next to the dimensions.

## Hints

- `useResponsivePanels` already owns a `resize` listener for the mobile
  breakpoint but exposes only a boolean; the new hook reports dimensions and
  lives beside it under `src/hooks/ui/`.
- `AboutModal` is always mounted and returns `null` when closed; the hook's
  listener cost while closed is a single state update per resize and is
  acceptable, matching `useResponsivePanels`' unconditional subscription.
- The zoom factor must arrive as a prop through the modal pipeline
  (`App.tsx` -> `useAppModals` documents slice -> `DocumentModalGroup` ->
  `AboutModal`); the modal must not read the setting or the CSS variable
  itself.

## Out of Scope

- Changes to the text-scale setting, the `--app-zoom` mechanism, or any
  panel layout.
- Reporting device pixel ratio or monitor physical resolution.
- Changes to the changelog or manual dialogs.
