# Fix Changelog Modal Heading Clipping Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.5/changelog-heading-clipping.md`.

## Best Practices

Follow the CSS engineering standard from `docs/standard/css-general-development.md`:

- Keep selectors shallow and scoped to the component class.
- Extend the existing scoped rules instead of adding new selector chains.
- Do not reformat unrelated rules in `App.css`.

## Documentation Updates

No documentation files require changes. The fix restores the intended rendering; `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, and `FORMAT.md` are unaffected.

## Type and State Updates

No TypeScript types, interfaces, or stores change. The fix is CSS only.

## Step by Step Implementation

**Give rendered headings a glyph-covering line height**

The scrollable markdown body inherits `line-height: 0.8rem` from `.modal-body`. Rendered headings keep their default `em`-based font sizes, so their glyphs overflow the tight line box and are clipped at the `overflow-y: auto` edge. Add `line-height: 1.2` to the existing heading rules so each heading's line box covers its glyphs. This moves the visual text down inside its own line box rather than relying on padding, so the heading renders fully at any scroll position.

File to modify: `src/App.css`.

```css
.modal-body.text-display-body h1,
.modal-body.text-display-body h2 {
  margin-top: 0;
  margin-bottom: 1.2rem;
  line-height: 1.2;
}
```

```css
.modal-body.text-display-body h3 {
  color: var(--markdown-h3-color);
  line-height: 1.2;
  padding-top: 2px;
  padding-bottom: 12px;
}
```

## Implementation Order

1. Update `src/App.css` heading rules.
2. Run verification loop.

## Testing Strategy

No new unit or integration tests. The change is a CSS line-height on rendered markdown; no utility functions, state actions, or component logic change. The existing component tests for the modal continue to pass unchanged.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Manually open About -> CHANGES and confirm the "Changes" heading renders fully at the top of the scrollable body
- Manually open About -> MANUAL and confirm the same correction
