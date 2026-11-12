# Make offline URLs base-aware

**Type:** Fix

**Source:** Audit 2026-11-12 REC-14 (RISK-03)

## Summary

| Field         | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Intent        | Let the service worker work under a nested deployment path |
| Key decisions | none                                                       |
| Open risks    | Root hosting must keep working - both bases are verified   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`DEPLOYMENT.md` promises any static host, and the build already uses a
relative base. But the production registration hard-codes `/worker.js`,
and `public/worker.js` precaches `/` and `/index.html` and falls back to
`/index.html`. Under a `/subpath/` deployment those absolute URLs
address the origin root, not the application - offline support silently
misses.

Registration and cache keys resolve relative to the deployed base
instead of `/`. The verification serves the built site at both `/` and a
nested path, installs the worker, goes offline, and checks cold and
returning navigation plus static asset fetches.

## Use Cases

- When the app is served at a nested path and goes offline, navigation
  and assets resolve from the application's own base.
- When the app is served at the root, behavior is unchanged.

## Hints

- `import.meta.env.BASE_URL` gives the deployed base at registration
  time; inside the worker the scope-relative URL replaces the absolute
  constants.
- Sites: `src/main.tsx`, `public/worker.js`, `vite.config.ts`,
  `docs/DEPLOYMENT.md`.

## Out of Scope

- A service-worker redesign beyond base-awareness.
- Promising nested-path support before the verification runs - the doc
  claim is reconciled only after the probe passes.
