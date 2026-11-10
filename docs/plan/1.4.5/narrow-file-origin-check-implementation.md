# Narrow the file origin check to the packaged bundle Implementation Plan

## Summary

| Field         | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Intent        | Restrict `isAppOrigin` to the bundled index path and the dev server origin |
| Key decisions | Compare the resolved file path against `dist/index.html`                   |
| Open risks    | none                                                                       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.5/narrow-file-origin-check.md`.

## Best Practices

Follow the Electron engineering standard from `docs/standard/typescript-electron-development.md`:

- Keep `electron/permissions.cjs` a standalone CommonJS module with no Electron runtime dependency
- Deny by default on unparseable input
- No abbreviations in identifiers (use full words)

## Documentation Updates

- `SPECIFICATION.md` — Electron Permission Policy section now records the bundled-index path comparison and the foreign `file://` denial.

`PROJECT.md`, `ARCHITECTURE.md`, `FORMAT.md` need no changes: the change narrows an existing rule, it does not add one.

## Step by Step Implementation

**Narrow `isAppOrigin` to the bundled index**

Resolve the candidate URL with `new URL` and, for `file:` targets only, convert it with `fileURLToPath` and compare it to `path.join(__dirname, '..', 'dist', 'index.html')`. Admit the dev server by matching `parsed.origin` against `http://localhost:8008`. Both Node builtins keep the module loadable through `createRequire` without Electron.

File to modify: `electron/permissions.cjs`.

```javascript
const path = require('node:path');
const { fileURLToPath } = require('node:url');

const DEV_ORIGIN = 'http://localhost:8008';
const BUNDLED_INDEX_PATH = path.join(__dirname, '..', 'dist', 'index.html');

function isAppOrigin(url) {
  if (typeof url !== 'string') {
    return false;
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.origin === DEV_ORIGIN) {
    return true;
  }
  if (parsed.protocol !== 'file:') {
    return false;
  }
  try {
    return fileURLToPath(parsed) === BUNDLED_INDEX_PATH;
  } catch {
    return false;
  }
}
```

`isMidiAllowed` and `isExternalHttpUrl` keep their current bodies.

**Extend the permission policy tests**

Derive the expected bundle URL in the test from the module's own location via `path.dirname(require.resolve(...))` and `pathToFileURL`, so the grant assertion exercises the real comparison.

File to modify: `test/electron/permissions.test.ts`.

Assert: bundled index `file://` URL grants midi and `isAppOrigin`; a foreign `file://` URL denies midi and `isAppOrigin` (the `will-navigate` predicate); `http://localhost:8008` grants; other http(s) targets and `http://localhost:8008.evil.com` deny.

## Implementation Order

1. Update documentation
2. Narrow `isAppOrigin` in `electron/permissions.cjs`
3. Extend `test/electron/permissions.test.ts`
4. Run verification loop

## Testing Strategy

**Unit tests**

Test file to update: `test/electron/permissions.test.ts`.

Keep the `// @vitest-environment node` pragma and the `createRequire` load. Assert:

- `isAppOrigin(bundledIndexUrl)` and `isMidiAllowed('midi', bundledIndexUrl)` are true.
- `isAppOrigin('file:///private/etc/passwd')` and `isMidiAllowed('midi', 'file:///tmp/foreign.html')` are false.
- `isMidiAllowed('midi', 'http://localhost:8008/')` is true.
- `isAppOrigin('https://example.com/')` and `isAppOrigin('http://localhost:8008.evil.com/')` are false.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npx prettier --check` on touched files
- Run `npm run build`
- Run `npx vitest run test/electron/`
- Re-read `electron/main.cjs` to confirm both consumers keep working through the narrowed predicates
