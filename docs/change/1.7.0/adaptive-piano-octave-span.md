# Adapt the on-screen piano octave span to the available width

**Type:** Feature

## Summary

| Field         | Value                                                                                |
| ------------- | ------------------------------------------------------------------------------------ |
| Intent        | Let the on-screen piano show more octaves when the window is wide enough to fit them |
| Key decisions | Measure the keyboard element's content width; clamp the span between 2 and 8 octaves |
| Open risks    | none                                                                                 |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The on-screen piano keyboard renders a fixed octave span: two octaves under the
compact layout (`window <= 1100px` wide or `<= 700px` high) and five octaves
otherwise, centered on the current octave. On wide displays the keyboard leaves
unused space while a large part of the playable octave range stays off-screen,
forcing octave navigation to preview notes outside the visible span.

The keyboard should widen its octave span to fill the space available to it. The
span is derived from the measured width of the keyboard element rather than a
fixed window breakpoint, so the count grows and shrinks smoothly as the window
resizes or the text scale changes.

Rules:

- The span is at least two octaves and never more than the playable range of
  eight octaves (`MIN_OCTAVE` to `MAX_OCTAVE`).
- The visible octaves stay centered on the current octave, clamped at the range
  edges, as today.
- Key sizes do not change - more octaves are shown, never shrunken keys.
- The compact media-query layout (fixed keyboard overlay on small windows) is
  unaffected; only the key count adapts.

## Use Cases

- On a wide desktop window the piano displays most or all of the eight playable
  octaves, so every note can be previewed by clicking without octave navigation.
- On a narrow or small window the piano keeps the current two-octave span.
- Resizing the window or changing the text scale re-derives the span live.

## Hints

One white key occupies 25px of pitch (24px width plus 1px margin), so one octave
costs 175px of keyboard content width. Measuring the element rather than the
window keeps the calculation correct under the `--app-zoom` text scale, which
zooms the whole app while `window.innerWidth` stays in viewport pixels.

## Out of Scope

- No changes to key dimensions, keyboard note mapping, or octave navigation keys.
- No changes to the compact media-query breakpoint or its fixed overlay styling.
