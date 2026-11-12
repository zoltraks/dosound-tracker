# Content-Fit Modal Sizing Implementation Plan

## Summary

| Field         | Value                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------- |
| Intent        | Size the settings dialog to its content and promote the sized modals to full screen on mobile |
| Key decisions | CSS-only change inside the existing layout rules; no component or hook edits                  |
| Open risks    | none                                                                                          |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.9/content-fit-modal-sizing.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`. The change touches stylesheet rules only - no component, prop, or accessibility surface changes.

## Documentation Updates

- `SPECIFICATION.md` — the settings modal paragraph gains the content-fit sizing rule, and the mobile layout section gains the fullscreen-modal rule.
- `PROJECT.md` — F-17 gains the content-fit sizing statement.
- `ARCHITECTURE.md`, `FORMAT.md` — no changes; no structural or format surface moves.

## Implementation Steps

1. In `src/App.css`, change `.modal-dialog.settings-modal` from
   `height: 80vh` to `height: auto` so the dialog sizes to its content;
   keep `max-height: 80vh` as the cap and update the rule comment.
2. In the `@media (max-width: 1100px), (max-height: 700px)` block,
   extend the `.modal-dialog.text-display` rule so the sized content
   modals - `text-display`, `settings-modal`, `midi-modal`, and
   `download-modal` - take `width: 100vw`, `max-width: 100vw`,
   `height: 100vh`, `max-height: 100vh`, with the margin reset to `0`.
   The existing internal `overflow-y: auto` regions provide the
   scrolling.
3. Verify: `npm run typecheck`, `npm run lint`, `npx prettier --check`,
   `npm run test`, `npm run build`, plus a headless viewport probe over
   the preview build measuring dialog bounding boxes on desktop and
   mobile-sized viewports.

## Verification Approach

- Unit suite stays green; no behavioral surface is covered by tests.
- The browser probe asserts the settings dialog height equals its
  content height (below `80vh`) on a tall desktop viewport, and that the
  sized modals fill the viewport under the mobile query.
