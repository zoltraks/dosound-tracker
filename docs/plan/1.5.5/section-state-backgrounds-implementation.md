# Invert Section State Backgrounds and Add a Combined Hover State Implementation Plan

## Summary

| Field         | Value                                                                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Active sections read darker than the normal background, hovered sections read lighter, and hovered active sections carry a third distinct background             |
| Key decisions | The inversion happens at the shared variables in each theme block; the combined state lands on the eight `.x.active:hover` rules via `--section-active-hover-bg` |
| Open risks    | `--active-bg` also drives buttons and selected cells - every active indicator darkens, not only section frames                                                   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.5/section-state-backgrounds.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- This is a stylesheet-only change - component code, state, and behavior are untouched.
- Mirror the existing CSS conventions - theme values live as custom properties in the three theme blocks, and `color-mix` derivations follow the formulas already in use.

## Audio-Critical Requirements

This change touches CSS only - no audio-path code changes.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications. Update only the files affected by this change.

- `SPECIFICATION.md` — no changes: section background semantics are a visual theme detail, not a documented behavior.
- `MANUAL.md` — no changes: the manual does not describe per-state section colors.
- `PROJECT.md` — no changes.
- `ARCHITECTURE.md` — no changes.
- `FORMAT.md` — no changes.

## Type and State Updates

**Type definitions**

None - CSS custom properties only.

**State store modifications**

None.

## Step by Step Implementation

**Invert the dark theme variables**

In the `:root` theme block, active takes the old darker hover formula, hover takes the old lighter active color, and the new combined variable mixes the two.

File to modify: `src/App.css`.

```css
--section-hover-bg: #252d42;
--section-active-hover-bg: color-mix(in srgb, var(--section-hover-bg) 75%, var(--active-bg) 25%);
--active-bg: color-mix(in srgb, var(--bg-secondary) 75%, black 25%);
```

**Invert the light theme variables**

In the `.app.light` block the same inversion applies - the old hover formula becomes active and the old active color becomes hover.

File to modify: `src/App.css`.

```css
--section-hover-bg: #fef3c7;
--section-active-hover-bg: color-mix(in srgb, var(--section-hover-bg) 75%, var(--active-bg) 25%);
--active-bg: color-mix(in srgb, var(--bg-secondary) 78%, #98a1ab 22%);
```

**Invert the contrast theme variables**

In the `.app.contrast` block the hover value already reads lighter than the background, so only the active value darkens while the combined variable follows the same formula.

File to modify: `src/App.css`.

```css
--section-hover-bg: #1a1a1a;
--section-active-hover-bg: color-mix(in srgb, var(--section-hover-bg) 75%, var(--active-bg) 25%);
--active-bg: #000000;
```

**Add the combined background to flat sections**

The five flat-background sections gain the combined background in their `.x.active:hover` rule, which already carries the border change.

File to modify: `src/App.css` - `.octave-selection.active:hover`, `.envelope-panel.active:hover`, `.information-panel.active:hover`, `.playlist-panel.active:hover`, `.instrument-panel.active:hover`.

```css
.envelope-panel.active:hover {
  border-color: var(--section-active-hover-border);
  background-color: var(--section-active-hover-bg);
}
```

(`.octave-selection.active:hover` uses `border-bottom-color` - only the background line is added.)

**Add the combined gradient to gradient sections**

The three gradient sections get the matching gradient variant built on the combined variable, mirroring each section's existing hover gradient shape.

File to modify: `src/App.css` - `.command-panel.active:hover`, `.track-panel.active:hover`, `.piano-keyboard.active:hover`.

```css
.command-panel.active:hover {
  border-color: var(--section-active-hover-border);
  background-image: linear-gradient(
    180deg,
    var(--section-active-hover-bg) 0%,
    var(--bg-tertiary) 100%
  );
}

.track-panel.active:hover {
  border-color: var(--section-active-hover-border);
  background-image: linear-gradient(
    180deg,
    var(--section-active-hover-bg) 0%,
    var(--bg-secondary) 100%
  );
}

.piano-keyboard.active:hover {
  border-color: var(--section-active-hover-border);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--section-active-hover-bg) 60%, #1a1a1a) 0%,
    color-mix(in srgb, var(--section-active-hover-bg) 60%, #2a2a2a) 100%
  );
}
```

## Implementation Order

Execute the steps above in this sequence.

1. Invert the dark theme variables and add `--section-active-hover-bg`
2. Invert the light theme variables
3. Invert the contrast theme variables
4. Add the combined background to the five flat `.x.active:hover` rules
5. Add the combined gradient to the three gradient `.x.active:hover` rules
6. Run verification loop and visual check

## Testing Strategy

**Unit tests**

None - CSS-only change.

**Integration tests**

None - CSS-only change.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Manually verify the three states on the dev server for the dark theme, and spot-check light and contrast themes: an active section is darker than normal, a hovered inactive section is lighter, and a hovered active section shows the third background
- For audio-related changes, manually verify playback timing and audio stability
