# Add navigation containment to the Electron shell

**Type:** Fix

**Source:** AUDIT-1.4 REC-002 (FND-SEC-002)

## Summary

| Field         | Value                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| Intent        | Prevent remote content from executing inside an application window                                              |
| Key decisions | new windows are denied or delegated to `shell.openExternal`; navigation is restricted to the application origin |
| Open risks    | bundled-document external links must keep working in the user's browser                                         |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`electron/main.cjs` installs no `setWindowOpenHandler` and no `will-navigate` handler. Bundled markdown documents render links with `target="_blank"`, so a click in a packaged build opens a second `BrowserWindow` that loads remote content while inheriting the application's `webPreferences` and exposing the `electronAPI` preload surface.

The change installs navigation containment in the main process: new-window requests are denied or delegated to `shell.openExternal` on an allowlisted basis, and top-level navigation is restricted to the application's own origin.

## Use Cases

- When a user clicks an external link inside a bundled document in a packaged build, the link opens in the user's external browser or nothing happens - never inside an application window.
- When remote content attempts a top-level navigation of the main window, the navigation is blocked.

## Hints

- Sandbox and contextIsolation remain enabled; this change adds the missing navigation layer, not a replacement for existing hardening.
- The preload surface is five read-mostly methods; containment should not expand or alter it.

## Out of Scope

- Changes to `webPreferences`, the preload API, or `electron/permissions.cjs`.
- Markdown renderer link generation beyond the containment behavior.
