# Electron Navigation Containment Implementation Plan

## Summary

| Field         | Value                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Intent        | stop remote content from executing inside an application window                                                                      |
| Key decisions | external http(s) links delegate to `shell.openExternal`; all in-app new windows denied; `will-navigate` restricted to the app origin |
| Open risks    | `none`                                                                                                                               |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.8/electron-navigation-containment.md`.

## Best Practices

Follow the TypeScript and Electron engineering standard from `docs/standard/typescript-electron-development.md`:

- Main-process helpers live in standalone `.cjs` modules so tests can import them without the Electron runtime.
- Sandbox and contextIsolation stay enabled - containment adds a layer, not a replacement.

## Documentation Updates

`SPECIFICATION.md` - the Electron Permission Policy section gains the navigation containment rule: external links open through the OS browser and top-level navigation is pinned to the app origin.

## Step by Step Implementation

**Add the external-link predicate**

`electron/permissions.cjs` gains `isExternalHttpUrl(url)` matching `http:`/`https:` URLs case-insensitively. `isAppOrigin` already covers `file://` and the dev origin.

File to modify: `electron/permissions.cjs`.

**Install the navigation handlers**

In `createWindow` install `webContents.setWindowOpenHandler`: external http(s) URLs are delegated to `shell.openExternal`, every request returns `{ action: 'deny' }` so no second `BrowserWindow` is ever created. Install `webContents.on('will-navigate')` calling `event.preventDefault()` when the target fails `isAppOrigin`.

File to modify: `electron/main.cjs`.

**Extend the permissions tests**

Add cases for `isExternalHttpUrl`: http and https accepted, `file:`, `data:`, `javascript:`, and non-strings rejected.

File to modify: `test/electron/permissions.test.ts`.

## Implementation Order

1. Update `SPECIFICATION.md`.
2. Add the predicate to `permissions.cjs`.
3. Install the handlers in `main.cjs`.
4. Extend the tests.
5. Run the targeted verification loop.

## Testing Strategy

**Unit tests**

Test file to update: `test/electron/permissions.test.ts`.

- `isExternalHttpUrl('https://example.com')` is true - `isExternalHttpUrl('file:///app/index.html')` and `isExternalHttpUrl('javascript:alert(1)')` are false.
- `isAppOrigin` keeps covering `file://` and `http://localhost:8008`.

**Manual verification**

A packaged build click on a bundled-document external link opens the system browser, not an app window. Recorded as the record's verification note since the runnable-artifact substitution applies to `electron/` changes.

## Verification

Run the targeted verification loop. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test -- test/electron`
