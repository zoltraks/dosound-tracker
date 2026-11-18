# Style the Selected Dump Chip Button Implementation Plan

## Summary

| Field         | Value                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Restyle `.chip-switcher-button.active` so the selected Dump chip button shows the hovered `command-button` fill, label, border, and shadow through theme variables. |
| Key decisions | Map the selected state onto the existing `command-button` hover declarations rather than introducing new color literals.                                            |
| Open risks    | None - single-rule CSS change; ordering against the existing hover rules is preserved.                                                                              |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.6.6/dump-chip-switcher-active-colors.md`.

## Best Practices

CSS-only change. No TypeScript or React surface is touched; the existing
styling conventions in `src/App.css` apply - theme variables, `color-mix`
where a blend is needed, and declaration order carrying the cascade intent.

## Documentation Updates

- `SPECIFICATION.md` - no update required; the chip switcher's colour
  values are a presentation detail not tracked at that granularity.
- `PROJECT.md`, `ARCHITECTURE.md`, `FORMAT.md` - unaffected.

## Type and State Updates

None. No types, stores, or component props change.

## Step by Step Implementation

**Restyle the selected chip button**

Replace the hardcoded `.chip-switcher-button.active` declaration with the
`command-button` hover palette so the selected Dump chip reads as active at
rest in every theme.

File to modify: `src/App.css`.

```css
.chip-switcher-button.active {
  background: linear-gradient(135deg, var(--button-hover) 0%, var(--button-active) 100%);
  border-color: var(--border-bright);
  color: var(--button-text);
  box-shadow: var(--shadow-medium), var(--glow-secondary);
}
```

The rule stays in place ahead of `.chip-switcher-button:hover` and the
`.dark` hover variants, so hovering the selected button still produces the
existing lime-frame hover treatment.

## Implementation Order

1. Update the `.chip-switcher-button.active` rule in `src/App.css`.
2. Run the verification loop.
3. Visually confirm the selected chip button in the Dump panel under the
   dark, light, and contrast themes.

## Testing Strategy

**Unit tests**

None - the change is a single CSS declaration block with no logic. No
existing test asserts on chip-switcher styles.

**Integration tests**

None required. The e2e smoke suite exercises the Dump panel indirectly;
visual confirmation covers the styling change.

## Verification

Run the verification loop in this order. The implementation is complete only
when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Manually verify the selected chip button in the Dump panel shows the
  command-button hover colors at rest and the existing hover treatment on
  pointer-over, in dark, light, and contrast themes
