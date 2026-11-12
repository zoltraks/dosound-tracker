# Rename btn class suffix

## Summary

- **Status**: shipped
- **Type**: Refactor
- **Owner**: user
- **Scope**: `src/` CSS class names and custom properties, `e2e/` selectors, `docs/standard/css-general-development.md` examples

## Request

The user prefers full words over abbreviations in CSS class names - every
`-btn` suffix becomes `-button` (`.command-btn` becomes `.command-button`).

## Implementation

- Renamed every `-btn` class token and every derived custom property
  (for example `--export-btn-bg-left` becomes `--export-button-bg-left`)
  across `src/`, `e2e/`, and `test/` - a mechanical `-btn` to `-button`
  token rewrite with no behavior change.
- Updated the `.command-button` examples in
  `docs/standard/css-general-development.md`; historical change, plan, and
  refactoring records keep the names in effect when they were written.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build` clean.
- `npm test` and `npm run test:e2e` pass on Chromium and WebKit - the e2e
  `.play-song-button` selectors confirm the renamed classes apply at runtime.
