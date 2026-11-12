# Contrast the Sustain Dot against the Envelope Background Implementation Plan

## Summary

| Field         | Value                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Intent        | The Volume sustain dot switches to a theme-aware idle color when the bar under it does not reach the dot's position       |
| Key decisions | `getBarHeight(sustainValue) >= 50` decides whether the dot sits on the filled bar; the idle color is a per-theme variable |
| Open risks    | none                                                                                                                      |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.5/envelope-sustain-dot-contrast.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- The state lands as a modifier class on the existing element - no new component, no new state.
- The per-theme color rides a custom property beside the existing `--envelope-*` variables in each theme block.

## Audio-Critical Requirements

This change touches rendering only - no audio-path code changes.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications. Update only the files affected by this change.

- `SPECIFICATION.md` — no changes: marker contrast is a visual detail, not a documented behavior.
- `MANUAL.md` — no changes: the manual names the sustain dot but does not describe its color.
- `PROJECT.md` — no changes.
- `ARCHITECTURE.md` — no changes.
- `FORMAT.md` — no changes.

## Type and State Updates

**Type definitions**

None.

**State store modifications**

None.

## Step by Step Implementation

**Mark the idle state on the dot element**

The dot gains the `idle` class when the sustain bar's height falls below 50% of the graph. `getBarHeight` for the volume type returns `value / VOLUME_MAX * 100`, so the check reads the rendered bar directly.

File to modify: `src/components/EnvelopePanel.tsx`.

```tsx
{
  typeof sustainIndex === 'number' && sustainIndex >= 0 && sustainIndex < envelopeData.length && (
    <div
      className={`envelope-sustain-dot${getBarHeight(envelopeData[sustainIndex]) >= 50 ? '' : ' idle'}`}
      style={{
        left: `${((sustainIndex + 0.5) / envelopeData.length) * 100}%`,
      }}
    />
  );
}
```

**Define the idle color per theme**

Each theme block gains `--envelope-sustain-dot-idle`, and the `.envelope-sustain-dot` rule keeps its black while `.idle` switches the fill.

File to modify: `src/App.css`.

```css
/* :root (dark) */
--envelope-sustain-dot-idle: #c0c0c0;

/* .app.light */
--envelope-sustain-dot-idle: #444444;

/* .app.contrast */
--envelope-sustain-dot-idle: #ffff00;

.envelope-sustain-dot.idle {
  background-color: var(--envelope-sustain-dot-idle);
}
```

## Implementation Order

Execute the steps above in this sequence.

1. Add the `idle` class computation in `EnvelopePanel.tsx`
2. Add the per-theme variable and the `.idle` rule in `src/App.css`
3. Add the component test
4. Run verification loop

## Testing Strategy

**Unit tests**

Extend the existing sustain-dot coverage in `test/components/EnvelopePanel.test.tsx` - the dot carries `idle` when the sustain bar's value is below the midpoint and does not when the bar reaches it.

```tsx
it('marks the sustain dot idle when the bar does not reach it', () => {
  const data = zeros();
  data[0] = 3;
  const { container } = renderPanel({ data, sustainIndex: 0, onSustainChange: vi.fn() });
  expect(container.querySelector('.envelope-sustain-dot.idle')).toBeTruthy();
});

it('keeps the default dot when the bar reaches it', () => {
  const data = zeros();
  data[0] = 0x0f;
  const { container } = renderPanel({ data, sustainIndex: 0, onSustainChange: vi.fn() });
  expect(container.querySelector('.envelope-sustain-dot.idle')).toBeNull();
  expect(container.querySelector('.envelope-sustain-dot')).toBeTruthy();
});
```

**Integration tests**

None.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Manually verify the dot on the dev server - a low sustain value shows the idle color, a high one keeps black
- For audio-related changes, manually verify playback timing and audio stability
