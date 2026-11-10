# Narrow the file origin check to the packaged bundle

**Type:** Fix

**Source:** AUDIT-1.5 REC-002 (FND-SEC-001)

## Summary

| Field         | Value                                                                              |
| ------------- | ---------------------------------------------------------------------------------- |
| Intent        | Restrict app-origin privileges to the packaged bundle instead of any `file://` URL |
| Key decisions | Compare the resolved URL against the bundled index path rather than a bare scheme  |
| Open risks    | none                                                                               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`isAppOrigin` in `electron/permissions.cjs` accepts every URL that starts with
`file://`. Both consumers inherit the weakness: the `midi` permission handler
grants MIDI access to any local page, and the `will-navigate` gate admits
top-level navigation to any local file. A local HTML page reached through
renderer navigation would inherit privileges the documented policy reserves for
the application bundle.

The app-origin check must admit only the packaged `index.html` of the built
bundle and the development server origin `http://localhost:8008`. Every other
`file://` URL is a foreign origin and must be denied permissions and blocked by
the navigation gate. The check resolves the candidate URL to a file path and
compares it against the bundle's index location rather than matching the
`file://` scheme prefix.

The Electron Permission Policy section of `SPECIFICATION.md` documents the
current origin rule and is updated first under the documentation-first order.

## Use Cases

- When the renderer requests `midi` from the packaged bundle, then the
  permission is granted.
- When any page under a `file://` URL other than the bundled index requests
  `midi`, then the permission is denied.
- When `will-navigate` targets a `file://` URL outside the bundled index, then
  navigation is prevented.
- When the development server origin `http://localhost:8008` requests the same
  surface, then it keeps working during development.

## Hints

- `electron/permissions.cjs` is a standalone `.cjs` module loaded in tests
  through `createRequire` - the narrowed check stays testable without the
  Electron runtime.
- `test/electron/` covers the permissions module; new cases assert the foreign
  `file://` denial and the bundled-index grant.
- Exploitability is theoretical - no navigation vector was demonstrated - but
  the fix removes the whole privilege-inheritance class.
