# Fix Focused Volume Value Shifting Right Implementation Plan

## Summary

| Field         | Value                                                                           |
| ------------- | ------------------------------------------------------------------------------- |
| Intent        | Anchor the focused row's volume nibble to the same position as unfocused rows   |
| Key decisions | Swap the volume cell's left padding for right padding on the active current row |
| Open risks    | none                                                                            |

This plan was written after the change landed, under the ad-hoc-implementation work mode - it documents the applied fix, not upcoming work.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.5/fix-focused-volume-shift.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`. The change is a stylesheet rule adjustment and introduces no component or logic edits.

## Documentation Updates

No documentation file required changes - the fix restores the rendered geometry the interface already promised, and no specification section owns pixel-level cell padding.

## Type and State Updates

None - no TypeScript types, stores, or state are affected.

## Step by Step Implementation

**Align the focused volume cell**

`.track-line.current` adds a one-pixel border and removes its negative left margin when the parent track panel is active, shifting all row content one pixel to the right. `.note-text` compensates by dropping one pixel of left padding, which works because its text is left-aligned. `.volume-data` removed its left padding too, but its glyph is centered inside a fixed `14px` border-box: the center sits at `(width + padding-left - padding-right) / 2`, so a one-sided removal recovers only half a pixel and the glyph stayed half a pixel right of the unfocused position. Moving the one-pixel pad to the right side keeps the center one pixel earlier inside the box, exactly cancelling the row shift.

File modified: `src/App.css`.

```css
.track-panel.active .track-line.current .volume-data {
  padding-left: 0;
  padding-right: 1px;
}
```

## Implementation Order

The change was a single-step stylesheet edit, verified live.

## Testing Strategy

**Unit tests**

Not applicable - stylesheet geometry has no unit-test surface. Pixel position was verified by a headless probe (`work/volume-shift-probe.mjs`) measuring the glyph's `Range.getBoundingClientRect().left` on the focused row against adjacent unfocused rows through the running dev server.

**Integration tests**

Existing `test/components/TrackPanel` suites confirm no component regression.

## Verification

Results recorded after the fix landed.

- `npx prettier --check src/App.css` - clean
- `npm run typecheck` - clean
- `npm run lint` - zero errors, zero warnings
- `npm run build` - clean
- `npm test -- test/components/TrackPanel` - 47 tests passed
- Headless probe - volume glyph delta focused vs unfocused: `+0.500px` before the fix, `0.000px` after; `.note-text` control delta `0.000px` before and after
