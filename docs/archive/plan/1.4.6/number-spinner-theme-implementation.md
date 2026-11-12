# Theme the Number-Spinner Buttons Implementation Plan

## Summary

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Intent        | Apply the `--button-*` theme palette to `.number-spinner-button`       |
| Key decisions | Follow the `.octave-button` convention; no component or markup changes |
| Open risks    | `none`                                                                 |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.6/number-spinner-theme.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md` and the CSS conventions from `docs/standard/css-general-development.md`:

- Theme through the existing CSS custom properties, never hard-coded colors.
- Reuse the established button-state convention (base, hover, focus-visible).
- Keep selectors at the current specificity - one class per rule.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications. Update only the files affected by this change.

None of the pillar documents require changes. The fix is visual theming of an
existing control: `PROJECT.md` owns requirements, `ARCHITECTURE.md` owns module
structure, `SPECIFICATION.md` owns implementation semantics, and `FORMAT.md`
owns file formats - none documents per-control colors. No specification update
precedes this change.

## Step by Step Implementation

**Apply the button palette**

Give the arrow buttons themed background, border, text color, and pointer
cursor using the `--button-*` custom properties. The rule sits directly above
`.toggle-value-button` and stays geometry-first as it is now.

File to modify: `src/App.css`.

```css
.number-spinner-button {
  width: 18px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-sizing: border-box;
  background-color: var(--button-bg);
  border: 1px solid var(--button-border);
  color: var(--button-text);
  cursor: pointer;
}
```

The chevron glyphs are `lucide-react` SVGs stroked with `currentColor`, so the
`color` property themes the arrows themselves.

**Add themed interaction states**

Add hover and focus-visible rules directly below the base rule, following the
`.octave-button` and `.toggle-value-button` conventions.

File to modify: `src/App.css`.

```css
.number-spinner-button:hover {
  background-color: var(--button-hover);
}

.number-spinner-button:focus-visible {
  outline: none;
  border-color: var(--active-border);
}
```

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation - none required, recorded above.
2. Apply the palette and interaction states in `src/App.css`.
3. Run the verification loop.
4. Verify both themes visually on the dev server.

## Testing Strategy

**Unit tests**

No new unit tests. The change is CSS-only and jsdom does not evaluate the
application stylesheet, so no suite assertion can observe it.

**Integration tests**

No new integration tests. Existing `NumberSpinner` consumers render through
the unchanged component contract; behavior assertions remain valid as-is.

**Visual verification**

Drive `npm run dev` with a throwaway Playwright probe under `work/` that reads
`getComputedStyle` on a spinner button in each theme and in hover state,
matching the recorded headless styling technique in `WORKFLOW.md`.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Verify spinner button colors in night and day mode on the dev server, including hover
