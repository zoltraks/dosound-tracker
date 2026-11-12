# Separate packaged and development origins

**Type:** Fix

**Source:** Audit 2026-11-12 REC-07 (FND-07)

## Summary

| Field         | Value                                                       |
| ------------- | ----------------------------------------------------------- |
| Intent        | Stop the packaged app from trusting the development origin  |
| Key decisions | none                                                        |
| Open risks    | Dev-mode workflow must keep working after the check narrows |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`isAppOrigin` in `electron/permissions.cjs` accepts
`http://localhost:8008` unconditionally, and that decision feeds both the
MIDI permission handlers and the `will-navigate` guard in
`electron/main.cjs`. A packaged build loads `dist/index.html` yet still
treats the development origin as trusted - a foreign page served on that
local port would pass the permission check.

The origin check must know the app's packaged state. In a packaged app,
only the bundled index page is an application origin; the development
URL is allowed solely when running unpackaged.

## Use Cases

- When a packaged app receives a permission or navigation request from
  `http://localhost:8008`, it is denied.
- When a development build runs against the dev server, MIDI permission
  and navigation still pass.
- When a foreign `file:` page requests MIDI inside a packaged app, it is
  denied.

## Hints

- Thread a packaged/development flag (for example `app.isPackaged`) into
  `isAppOrigin` and `isMidiAllowed` rather than adding parallel checks.
- Cover both modes with tests: bundled index, foreign `file:` page, and
  the localhost origin while packaged versus unpackaged.
- Sites: `electron/permissions.cjs`, `electron/main.cjs`.

## Out of Scope

- Changing the dev server port or the CSP configuration.
- Reworking the window-open or external-link handlers.
