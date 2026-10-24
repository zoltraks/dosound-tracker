# Give Every Section a Distinct Hover Border Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.5/section-hover-border.md`.

## Best Practices

Follow the CSS engineering standard from `docs/standard/css-general-development.md`:

- Keep selectors shallow and scoped to the existing component classes.
- Theme colors live in custom properties on `:root` and `.light`, never raw values in component rules.
- Extend the existing rules; do not reformat unrelated blocks.

## Documentation Updates

No documentation files require changes. The hover border is a visual refinement with no new requirement, architecture, specification, or file-format impact.

## Type and State Updates

No TypeScript types, interfaces, or stores change. The fix is CSS only.

## Step by Step Implementation

**Declare the hover-border token in both themes**

Add `--section-hover-border` to the dark palette in `:root` beside the border tokens, and to `.light` beside its equivalents. Dark theme uses a red-violet `#b84ec8` that sits between the existing violet and pink accents and blends with `--active-border` (`#7aa2f7`). Light theme uses a deeper red-violet `#9a3d95` that stays readable on light surfaces and blends with `--active-border` (`#f59e0b`).

File to modify: `src/App.css`.

```css
/* dark :root, after --border-bright */
--section-hover-border: #b84ec8;

/* .light, after --border-bright */
--section-hover-border: #9a3d95;
```

**Point the track-panel hover border at the new token**

`.track-panel:hover` keeps its shadow glow; only the border color token changes.

File to modify: `src/App.css`.

```css
.track-panel:hover {
  border-color: var(--section-hover-border);
  box-shadow: var(--shadow-large), var(--glow-secondary);
}
```

**Give every bordered section the same hover border**

Add a `:hover` rule directly after each section's `.active` rule so the hover color wins while the pointer is over the section, matching the track-panel ordering convention. Sections: `.envelope-panel` (covers tone/noise, volume, arpeggio, pitch, noise), `.information-panel`, `.playlist-panel`, `.instrument-panel`, `.piano-keyboard`, `.dump-panel`, `.eq-panel`. Command and octave sections have only a bottom border, so they hover on `border-bottom-color`. `.octave-selection` gains a transparent `border-bottom` in its base rule so the hover and the existing `.active` `border-bottom-color` can render; the active rule already sets that color and becomes visible once the base border exists.

File to modify: `src/App.css`.

```css
.envelope-panel:hover,
.information-panel:hover,
.playlist-panel:hover,
.instrument-panel:hover,
.piano-keyboard:hover,
.dump-panel:hover,
.eq-panel:hover {
  border-color: var(--section-hover-border);
}

.command-panel:hover {
  border-bottom-color: var(--section-hover-border);
}

.octave-selection:hover {
  border-bottom-color: var(--section-hover-border);
}
```

**Extend the smooth fade to the other sections**

`.track-panel` already transitions `border-color` over `0.6s`. Add the same `border-color` transition to `.envelope-panel`, `.information-panel`, `.playlist-panel`, `.instrument-panel`, `.piano-keyboard`, `.dump-panel`, `.eq-panel`, `.command-panel`, and `.octave-selection` so every section fades in and out the same way.

File to modify: `src/App.css`.

```css
/* example on .envelope-panel base rule */
transition: border-color 0.6s ease;
```

## Implementation Order

1. Update `src/App.css`: tokens, track-panel hover token, section hover rules, transitions.
2. Run verification loop.

## Testing Strategy

No new unit or integration tests. The change is CSS-only: no functions, state, or component logic change. The existing component tests continue to pass unchanged.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Manually hover track panels and other sections in both themes to confirm the red-violet fade, the blend with the active border, and the hover-over-active precedence
