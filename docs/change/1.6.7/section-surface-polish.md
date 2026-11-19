# Align header, command, and piano surfaces with the section idiom and drop the envelope Pos/Val footer

**Type:** Fix

## Summary

| Field         | Value                                                                                                                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Make the title bar, command panel, and on-screen piano read as consistent tracker sections; remove the redundant Pos/Val footer from the four envelope panels                                                                                       |
| Key decisions | Title bar and piano share the dark `#1a1a1a`→`#2a2a2a` fill with a warm `#503c28` frame; the command panel keeps the theme border over a hover-tinted gradient and renders fully static; envelope cursor state moves to a `data-position` attribute |
| Open risks    | `none` — pure presentation changes verified by live geometry measurement, computed-style checks, and the standard loop                                                                                                                              |

## Description

The tracker surfaces had drifted from the section idiom the envelope panels
established: the title bar rendered as a gradient strip with a heavy bottom
border and drop shadow, the command panel used a flat theme surface that
recolored on hover and activation, and the on-screen piano carried the cool
theme border against its dark fill. The four envelope panels (Volume,
Arpeggio, Pitch, Noise) also ended in a `Pos:`/`Val:` footer row under a 1px
rule that duplicated information already available through the bars' tooltips
and the current-cell highlight.

The title bar (`.header-panel`) now uses the same recessed surface as the
piano and command panels: a vertical `#1a1a1a`→`#2a2a2a` gradient, a 1px warm
`#503c28` frame chosen to suit the dark fill, an inset shadow, and a 4px
outer gutter so the frame floats on the app background like every other
section. Its padding is `4px 14px` — slim enough to reduce the bar's height
while keeping the controls optically centered. The diagonal gradient, the
2px bottom border, the drop shadow, and the `::after` bottom hairline are
removed. Because the fixed header grew taller than the compact layout's
content offset, `.app`'s compact `padding-top` rises from 36px to 52px.

The command panel (`.command-panel`) adopts a permanent background built
from the former hover gradient — a vertical gradient color-mixed from the
section hover tone over the title's dark colors — with `7px` padding, the
theme `--border-color` frame, and the inset shadow. Its `:hover`, `.active`,
and `.active:hover` rules are deleted, so the panel no longer changes
background, border, or shadow on pointer or focus; it is fully static.

In the light theme both surfaces switch to a light gray fill: a vertical
`--bg-secondary`→`--bg-tertiary` gradient with `box-shadow: none`, since the
dark inset shadow reads as a smudge on a light surface. The title bar's frame switches to the theme
`--border-color` (light gray in this theme), matching the command panel and
every other section. Dark and contrast themes
keep the recessed shadow and the `#503c28` frame.

The on-screen piano (`.piano-keyboard`) keeps its dark gradient fill and
switches its frame from the cool theme border to the same warm `#503c28`,
matching the title bar. The title text (`.application-name`) adopts the
section-heading font (`--font-heading`) at normal weight — `font-weight:
400` is set explicitly because the `<h1>` element otherwise inherits the
browser's bold user-agent style.

Header controls are polished: the `.header-right` `translateX(6px)` hack is
removed so the settings button keeps a real gap from the frame edge, the
settings glyph gains the U+FE0F emoji variation selector so it renders in
the same emoji presentation as the theme toggle's sun/moon icons, and the
logo suppresses the global focus ring on mouse click via
`.logo:focus:not(:focus-visible)` while keyboard focus keeps its indicator.

Every dialog's action buttons (`.modal-actions .command-button` — the
settings, export, file-picker, MIDI, about, confirm, transpose, paste-track,
and instrument dialogs all share the `.modal-actions` row convention) get a
single unscoped override: integer `5px 8px 4px` padding (the base `3.5px` is
fractional) gives the buttons one extra pixel of height with the label
nudged lower, identically in dark, light, and contrast themes. Command-panel
buttons are not inside `.modal-actions` and keep the base styling. An
earlier light-theme-only enlargement was reverted once the labels proved
metrically identical across themes.

Each non-mode `EnvelopePanel` (Volume, Arpeggio, Pitch, Noise) loses its
`.envelope-footer` — the 1px `border-top` rule and the `Pos:`/`Val:` readout
row. The cursor position remains observable through a `data-position`
attribute on the panel element, and the value at the cursor remains visible
through the highlighted `.envelope-value.current` cell, so no information is
lost. Panel heights shrink by roughly 22px each and the flex middle column
redistributes the space to the notes panel automatically.

## Use Cases

- When the app renders, the title bar shows the dark gradient surface, warm
  frame, and 4px gutter like the piano and command sections, at a reduced
  height with vertically centered content.
- When the pointer hovers or a command button holds focus, the command panel
  does not change background, border, or shadow.
- When the on-screen piano or title bar renders in any theme, its frame reads
  as a warm brown against the dark fill while the command panel keeps the
  theme border.
- When the light theme is active, the title bar and command panel fill with a
  light gray gradient, no inset shadow, and the theme border; the settings
  dialog's action buttons render larger, vertically centered labels. Dark
  and contrast themes keep the dark recessed surface and the standard button
  styling.
- When the user clicks the logo, no focus ring appears; tabbing to it still
  shows the focus indicator.
- When the settings or theme buttons render, the gear and sun/moon glyphs
  share the same emoji presentation.
- When an envelope panel renders, it ends at the value row — no Pos/Val
  footer or separator line — and the panel is correspondingly shorter.

## Hints

- `.piano-keyboard` and `.command-panel` are the reference surfaces: dark
  vertical gradient, `7px` padding, 1px frame, `inset 0 2px 4px` shadow.
- `.light .header-panel, .light .command-panel` carries the light-theme
  fill override and `.light .header-panel` the theme `--border-color` frame;
  theme-scoped selectors follow the existing `.light <component>`
  convention.
- `color-mix(in srgb, var(--section-hover-bg) 60%, #1a1a1a)` derives the
  command panel's resting gradient stops from theme tokens plus the title
  bar's dark colors, so it tracks theme changes without new variables.
- `.chip-switcher-button:focus:not(:focus-visible)` already establishes the
  click-ring suppression convention; `.logo` follows it.
- `⚙` (U+2699) defaults to text presentation; appending U+FE0F forces emoji
  presentation matching `☀️`/`🌑`.
- jsdom cannot observe CSS or layout; visual verification uses live bounding
  boxes and computed styles per `docs/TOOLING.md`.

## Out of Scope

- The track header volume label change, recorded separately in
  `docs/change/1.6.7/track-header-volume-label.md`.
- Per-channel track frame borders and track tints, recorded in
  `docs/change/1.6.7/track-frame-borders.md` and
  `docs/change/1.6.7/dual-chip-track-tints.md`.
- Envelope editing behavior, keyboard shortcuts, sustain handling, and the
  mode panel (which never had a footer).
- Audio engines, playback, song format, settings, and save files.
- Version bump and commit creation.

This record supersedes `title-bar-section-frame.md`, whose flat-surface,
edge-to-edge description was replaced by the section-idiom surface recorded
here before either was committed.
