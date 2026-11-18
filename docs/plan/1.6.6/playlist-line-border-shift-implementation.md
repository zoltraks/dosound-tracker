# Stop Playlist Column Width Shifts Implementation Plan

## Summary

| Field         | Value                                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Freeze `.playlist-line` and `.track-line.current` content geometry across current, playback-position, and panel-active states.    |
| Key decisions | Permanent transparent side borders plus `border-color`-only state rules; padding and margin compensated to preserve rest metrics. |
| Open risks    | None - single-file CSS change with a defined cascade order to preserve.                                                           |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.6.6/playlist-line-border-shift.md`.

## Best Practices

CSS-only change in `src/App.css`. Preserve the file's declaration-order
conventions: state rules stay after the base rule so the cascade keeps
working, and the comment above `.chip-switcher-button:hover`-style ordering
notes applies - later declarations win at equal specificity.

## Documentation Updates

- `SPECIFICATION.md` - no update required; the fix restores intended
  geometry rather than adding behaviour.
- `PROJECT.md`, `ARCHITECTURE.md`, `FORMAT.md` - unaffected.

## Type and State Updates

None.

## Step by Step Implementation

**Reserve the side borders on `.playlist-line`**

Add permanent `border-left`/`border-right` at `1px solid transparent` and
shift one pixel of horizontal padding onto the border budget so the
content box is pixel-identical at rest: left chrome stays `1px` (border
`1px` + padding `0`), right chrome stays `2px` (border `1px` + padding
`1px`).

File to modify: `src/App.css`, `.playlist-line` rule.

```css
.playlist-line {
  /* ...unchanged declarations... */
  padding-right: 1px;
  padding-left: 0px;
  border-top: 1px solid var(--bg-primary);
  border-bottom: 1px solid var(--bg-secondary);
  border-left: 1px solid transparent;
  border-right: 1px solid transparent;
}
```

**Recolor borders in the state rules**

Change the three state rules from the `border` shorthand to
`border-color` so they only repaint the already-reserved frame. The
`.playback-position.current` rule drops its `padding-left: 0px`
compensation, which the new base padding makes redundant.

```css
.playlist-line.current {
  background-color: var(--active-bg);
  border-color: var(--active-border);
}

.playlist-line.playback-position {
  background-color: var(--playback-position-bg);
  border-color: var(--playback-position-border);
}

.playlist-line.playback-position.current {
  background-color: var(--playback-position-active-bg);
  border-color: var(--playback-position-active-border);
}
```

Cascade check: `.current` and `.playback-position` keep equal specificity
and source order, so a line holding both still resolves to the
playback-position colours; `.playback-position.current` (higher
specificity) still wins for the combined state, exactly as the shorthand
version resolved.

**Freeze the track cursor line's geometry**

`.track-line.current` already reserves its `1px` border at rest; the
defect is the margin. Remove the `margin-left: 0` override from
`.track-panel.active .track-line.current` so the cursor line keeps
`margin-left: -1px` whether its panel is active or not, and delete the
`.track-panel.active .track-line.current .note-text` rule that drops
`padding-left` to `3px` - the text then inherits the same `4px` as every
other line. The active state keeps only `background-color` and
`border-color` changes.

```css
.track-panel.active .track-line.current {
  background-color: var(--track-active-bg);
  border-color: var(--track-active-border);
  margin-top: 0px;
  margin-bottom: 0;
}
```

Removing the `.note-text` override restores `padding-left: 4px` from the
base `.note-text` rule, so note glyphs, the line box, and every panel's
width stay identical across activation. The `.volume-data` padding swap
on the same active rule changes no geometry (fixed width, centered
content) and stays untouched.

## Implementation Order

1. Apply the `.playlist-line` base-rule change.
2. Apply the three state-rule changes in the same file.
3. Apply the `.track-panel.active .track-line.current` margin removal
   and delete the `.note-text` padding override.
4. Run the verification loop.
5. Measure live geometry at 1590x914 in the six-track layout across the
   playlist/track toggle and confirm zero width deltas.

## Testing Strategy

**Unit tests**

None - CSS geometry is not unit-tested in this suite.

**Integration tests**

None required - no DOM structure, class names, or behaviour change; the
existing e2e smoke suite continues to cover playlist interaction.

## Verification

Run the verification loop in this order. The implementation is complete
only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Measure the running build with a headless browser at 1590x914 in the
  six-track layout (`dual-chip` on, `visibleTracks` 6): record
  `.track-panel`, `.tracks-row`, `.left-column`, `.playlist-header-row
.track-header`, and `.playlist-line .track-pattern` widths before and
  after clicking a playlist channel button and the Playlist header; all
  values must be identical across states
- Manually open a dual-chip song, click a playlist channel button then the
  Playlist header, and confirm the track columns keep identical widths in
  both states; repeat with playback advancing through the
  playback-position line
