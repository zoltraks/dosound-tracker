# Fix EQ muted bar losing its color on hover

**Type:** Bug

## Summary

| Field         | Value                                                                            |
| ------------- | -------------------------------------------------------------------------------- |
| Intent        | Keep a muted EQ channel bar visually muted while the pointer hovers the EQ panel |
| Key decisions | Raise the muted-state rule so it wins over the panel hover rule                  |
| Open risks    | None - one CSS rule, no behavior change                                          |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The EQ panel (`src/components/song/EQPanel.tsx`) renders one volume bar per
YM channel. Clicking a bar toggles the channel mute; a muted bar gets the
`muted` class and is painted with the playback-position colors so it reads as
disabled.

Hovering anywhere on the EQ panel applies `.eq-panel:hover .volume-bar`,
which carries higher specificity than `.volume-bar.muted` and repaints the
muted bar's background and border with the normal hover colors - the muted
bar loses its disabled color until the pointer leaves.

The fix keeps the muted background and border colors in force during panel
hover.

## Use Cases

- When the user mutes a channel and hovers the EQ panel, the muted bar keeps
  its muted colors.
- When the user hovers the EQ panel with no channel muted, the existing hover
  treatment is unchanged.

## Hints

- `.volume-bar.muted` (specificity 0,2,0) is defined at `src/App.css` around
  line 3670; `.eq-panel:hover .volume-bar` (0,3,0) around line 3609.
- The `.volume-fill` hover rules already exclude muted bars with
  `:not(.muted)` - only the bar's own background and border regress.

## Out of Scope

- No component, hook, or state changes.
- No changes to unmuted hover styling.
