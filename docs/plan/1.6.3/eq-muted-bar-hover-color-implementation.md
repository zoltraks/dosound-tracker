# Fix EQ Muted Bar Losing Its Color on Hover Implementation Plan

## Summary

| Field         | Value                                                                               |
| ------------- | ----------------------------------------------------------------------------------- |
| Intent        | Keep a muted EQ channel bar visually muted while the pointer hovers the EQ panel    |
| Key decisions | Add `:not(.muted)` to the panel-hover bar rule, matching the neighboring fill rules |
| Open risks    | None                                                                                |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.6.3/eq-muted-bar-hover-color.md`.

## Best Practices

One CSS selector change - the applicable practice is consistency with the
file's own convention: the `.volume-fill` hover rules immediately below
already scope their effect with `.volume-bar:not(.muted)`, so the same guard
is applied to the bar rule.

## Audio-Critical Requirements

None - a stylesheet selector change touches no component, timing, state, or
audio path.

## Documentation Updates

None - the fix is a style correction; no doc describes the EQ hover styling.
The change record is the documentation.

## Type and State Updates

None.

## Step by Step Implementation

**Guard the hover rule against muted bars**

In `src/App.css`, change `.eq-panel:hover .volume-bar` to
`.eq-panel:hover .volume-bar:not(.muted)`. The muted bar then keeps the
`playback-position` background and border from `.volume-bar.muted` while the
panel is hovered; unmuted bars keep the existing hover repaint.

File to modify: `src/App.css`.

## Implementation Order

1. Guard the hover rule
2. Run verification loop

## Testing Strategy

No test coverage convention exists for hover colors; verification is the
lint and build pass plus manual inspection. The specificity analysis is the
evidence: `.eq-panel:hover .volume-bar.muted` no longer matches anything, so
`.volume-bar.muted` supplies the colors in every hover state.

## Verification

- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Manual: mute a channel, hover the EQ panel - the muted bar keeps its
  disabled colors
