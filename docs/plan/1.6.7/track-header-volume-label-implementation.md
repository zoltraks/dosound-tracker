# Track Header Volume Label Implementation Plan

## Summary

| Field         | Value                                                                                                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Remove the `VOL` prefix from each track panel header and center the bare effective-volume value over the per-row volume column                                                                                             |
| Key decisions | Mirror the `.volume-data` box model in `.track-header-volume`; derive the title flex-basis from the row geometry (`10ch` note cell plus leading offsets); keep a visually-hidden `Volume ` prefix for assistive technology |
| Open risks    | `none` — geometry is verified by live bounding-box measurement across themes, track counts, and text scaling                                                                                                               |

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.6.7/track-header-volume-label.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Props interface named with `Props` suffix
- Destructure props in function signature
- Maintain accessibility with proper ARIA attributes
- Keep components focused on single responsibility
- No abbreviations in identifiers (use full words)

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications. Update only the files affected by this change.

- `PROJECT.md` — no change: the header label text is not a project requirement
- `ARCHITECTURE.md` — no change: no structural or boundary change
- `SPECIFICATION.md` — no change: the effective-volume computation is unchanged; only its presentation moves
- `FORMAT.md` — no change: no save or export format change
- `public/MANUAL.md`, `public/MESSAGES.md` — no change: neither document mentions the `VOL` header label (verified by search)

No documentation file requires an update for this change; the docs-first step is satisfied by this explicit statement.

## Type and State Updates

**Type definitions**

No type changes. `effectiveVolume` remains a `number` produced by `computeEffectiveVolume`.

File to modify: none.

**State store modifications**

No store changes. No subscribing components are affected.

File to modify: none.

## Step by Step Implementation

**Track header markup**

Drop the `VOL ` prefix so the header renders only the formatted value, and prepend a visually-hidden `Volume ` label so assistive technology keeps the context. The `.visually-hidden` class is the existing screen-reader-only convention and is absolutely positioned, so it does not affect layout.

File to modify: `src/components/tracker/TrackPanel.tsx`.

```tsx
<span className="track-header-volume">
  <span className="visually-hidden">Volume </span>
  {Formatter.hex(effectiveVolume, { padWidth: 0 })}
</span>
```

**Track header layout**

The header and the rows share the same left origin inside `.track-panel`. Row geometry places `.volume-data` at `2px` line padding + `1rem` note-data padding + `10ch` note cell + `8px` gap = `10ch + 26px` from the panel content edge, while the header content starts at `20px` padding. The title therefore takes `calc(10ch + 6px)` so the following volume box lands exactly on the column, and the header packs items from the left instead of spreading them to the edges.

File to modify: `src/App.css`.

```css
.track-panel .track-header {
  justify-content: flex-start;
  padding: 4px 4px;
  padding-left: 20px;
}

.track-header-title {
  flex: 0 0 calc(10ch + 6px);
  text-align: left;
  padding-left: 8px;
}
```

**Track header volume box**

Give `.track-header-volume` the same box model as `.volume-data` — 14px wide, 1px left padding, centered content — so the single glyph centers on the same point as the row cells. The font stays `--fs-sm`; only placement changes.

File to modify: `src/App.css`.

```css
.track-header-volume {
  font-size: var(--fs-sm);
  width: 14px;
  padding-left: 1px;
  text-align: center;
}
```

**Component test**

Replace the assertion that expects the `VOL` prefix with assertions that prove the bare value renders and the prefix is gone.

File to modify: `test/components/tracker/TrackPanel.test.tsx`.

```typescript
const headerVolume = document.querySelector('.track-header-volume');
expect(headerVolume?.textContent).toContain('F');
expect(headerVolume?.textContent).not.toContain('VOL');
```

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation (satisfied: no file requires changes, stated above)
2. Implement UI markup in `TrackPanel.tsx`
3. Adjust the header layout rules in `App.css`
4. Update the component test in `TrackPanel.test.tsx`
5. Run targeted verification, then the full verification loop
6. Measure live geometry in the reporter's configuration

## Testing Strategy

**Unit tests**

No new utility functions. The existing `TrackPanel` suite covers the markup change.

Test file to update: `test/components/tracker/TrackPanel.test.tsx`.

- Assert `.track-header-volume` contains the bare hex value (`F` for the default `0x0f` effective volume).
- Assert `.track-header-volume` does not contain `VOL`.

**Integration tests**

jsdom cannot observe CSS geometry, so alignment is proven by live measurement rather than a DOM test:

- Start `npm run dev`, drive the app with a throwaway `@playwright/test` script under `work/` per `docs/TOOLING.md`.
- Seed reporter-relevant settings through `page.addInitScript` localStorage keys (`dosound-tracker-dual-chip`, `dosound-tracker-visible-tracks`, theme, and text-scale siblings).
- Snapshot `getBoundingClientRect()` of `.track-header-volume` and the first row's `.volume-data` across states: three-track and six-track layouts, dark/light/contrast themes, and text scales.
- Pass criterion: the horizontal center of `.track-header-volume` equals the horizontal center of `.volume-data` within one device pixel.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format` on the touched files (`npx prettier --check` first; the tree is shared, so formatting is scoped to this change set per `docs/TOOLING.md`)
- Run `npm run build`
- Run `npm test`
- Run `npm run test:e2e` for the recorded smoke-suite substitution
- Manually verify the header value is centered over the volume column in the live app and confirm no regressions in consumer modules
- No audio-related verification is required; this change does not touch audio paths
