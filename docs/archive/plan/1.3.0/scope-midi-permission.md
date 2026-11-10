# Scope the MIDI permission grant to the app origin Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.0/scope-midi-permission.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`.

## Documentation Updates

Update the named documentation before any source code modifications.

- `SPECIFICATION.md` — record the Electron permission policy under Project-Specific Conventions.

## Step by Step Implementation

**Extract the permission policy**

Create `electron/permissions.cjs`, a dependency-free CommonJS module exporting `isAppOrigin` and `isMidiAllowed`. Keeping the predicate out of `main.cjs` lets the unit test import it without loading Electron.

```javascript
const DEV_ORIGIN = 'http://localhost:8008';

function isAppOrigin(url) {
  return typeof url === 'string' && (url.startsWith('file://') || url.startsWith(DEV_ORIGIN));
}

function isMidiAllowed(permission, url) {
  return permission === 'midi' && isAppOrigin(url);
}

module.exports = { isAppOrigin, isMidiAllowed };
```

**Scope the permission handlers**

File to modify: `electron/main.cjs`.

Require `isMidiAllowed` from `./permissions.cjs`. In `setPermissionRequestHandler`, call `callback(isMidiAllowed(permission, webContents.getURL()))`. In `setPermissionCheckHandler`, return `false` when `webContents` is null and `isMidiAllowed(permission, webContents.getURL())` otherwise. The `midiSysex` grant is removed - the app never requests it.

**Add unit tests**

File to create: `test/electron/permissions.test.ts`.

Cover: packaged `file://` origin grants `midi`, dev server origin grants `midi`, foreign `https://` origin denied, `midiSysex` denied on every origin, non-string and null URLs denied.

## Implementation Order

1. Update documentation
2. Create `electron/permissions.cjs`
3. Scope the handlers in `electron/main.cjs`
4. Add unit tests
5. Run verification loop

## Testing Strategy

**Unit tests**

Test file to create: `test/electron/permissions.test.ts`.

```typescript
// midi granted for file:// and http://localhost:8008 origins
// midi denied for any other origin
// midiSysex denied regardless of origin
// malformed or empty URLs denied
```

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
