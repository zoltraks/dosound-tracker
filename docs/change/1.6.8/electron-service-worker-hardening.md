# Close residual Electron and service-worker hardening gaps

**Type:** Fix

**Source:** AUDIT-1.7 REC-007 — FND-SEC-003

## Summary

| Field         | Value                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Three small hardening items: Electron `sandbox` is unset, the service worker caches non-OK responses, and the dev server's `host: true` is undocumented |
| Key decisions | Set `sandbox` explicitly with a rationale comment; the SW caches only `response.ok` GETs; `host: true` stays but is documented as dev-only              |
| Open risks    | Enabling the Electron sandbox can break features that implicitly need it off - the packaged app needs a smoke check after the change                    |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The Electron boundary is otherwise hardened - `contextIsolation: true`,
`nodeIntegration: false`, deny-by-default permissions, blocked
navigation, denied window-open - but three residuals remain:

- `electron/main.cjs` `webPreferences` does not set `sandbox`
  explicitly, leaving renderer isolation to `contextIsolation` alone.
  Electron's default has shifted across versions; pinning the value with
  a comment removes the ambiguity.
- `public/worker.js` caches same-origin GET responses without checking
  the response status, so an error page or redirect could be stored as
  a valid cache entry.
- `vite.config.ts` binds the dev server to all interfaces via
  `host: true` - a deliberate development convenience that is currently
  undocumented, so a reader cannot tell intent from oversight.

## Use Cases

- When the desktop app launches, the renderer runs under the explicitly
  configured sandbox setting and the packaged build still passes its
  smoke checks.
- When the service worker encounters a non-OK same-origin response, the
  response is not written to the cache.
- When a contributor reads the Vite config, `host: true` is visibly a
  dev-only choice, not an accidental exposure.

## Hints

- Verify with `npm run electron:build` plus a packaged launch after the
  sandbox change - sandboxing can surface latent Node-API assumptions.
- The SW fix is a one-line `response.ok` guard in the fetch handler.
- The `host: true` documentation belongs in `docs/DEPLOYMENT.md` or a
  config comment, matching how other dev-only choices are recorded.

## Out of Scope

- CSP, the permission handler, navigation blocks, and window-open
  denial - already in place and verified.
- Any production hosting change - the app is a static bundle plus
  desktop package.
