# Harden Electron Sandbox and Service Worker Caching Implementation Plan

## Summary

| Field         | Value                                                                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Pin `sandbox: true` in the Electron renderer preferences, stop the service worker from caching non-OK responses, and mark the dev server's `host: true` as a documented dev-only choice. |
| Key decisions | `sandbox` set explicitly with a rationale comment; the fetch handler writes to the cache only when `response.ok`; `host: true` stays and is documented in `DEPLOYMENT.md`.               |
| Open risks    | Sandboxing can surface latent Node-API assumptions - the packaged app needs a launch smoke check after the change                                                                        |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.6.8/electron-service-worker-hardening.md`.

## Best Practices

Configuration and platform-script changes only - no React or TypeScript
application code is touched. Match the surrounding comment style: `main.cjs`
and `vite.config.ts` already carry short `//` rationale comments, and
`worker.js` stays comment-free plain script.

## Documentation Updates

- `DEPLOYMENT.md` - add a short Development Server note recording that
  `host: true` binds the Vite dev server to all interfaces for LAN access
  during development and applies to `vite dev` only.
- `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, `FORMAT.md` - no
  update required; the Electron permission policy documented in
  `SPECIFICATION.md` is unchanged, and the service worker cache contract in
  `DEPLOYMENT.md` gains only the status guard.

## Type and State Updates

None.

## Step by Step Implementation

**Pin the Electron renderer sandbox**

`webPreferences` gains `sandbox: true` with a comment recording why the
value is explicit: Electron's sandbox default has shifted across versions,
and the preload script uses only `contextBridge` and `ipcRenderer`, which
sandboxed preloads fully support.

File to modify: `electron/main.cjs`.

```js
webPreferences: {
  preload: path.join(__dirname, 'preload.cjs'),
  contextIsolation: true,
  nodeIntegration: false,
  // Renderer sandbox pinned explicitly - the default has shifted across
  // Electron versions, and the preload uses only sandbox-safe APIs.
  sandbox: true,
  backgroundThrottling: false,
},
```

**Gate service worker caching on `response.ok`**

The fetch handler still returns every same-origin GET response to the
client, but writes it to the cache only when `response.ok` is true, so
error pages and other non-OK statuses are never stored as valid entries.

File to modify: `public/worker.js`.

```js
.then((response) => {
  if (response.ok) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
  }
  return response;
})
```

**Mark `host: true` as dev-only**

A comment above `host: true` in the `server` block records that binding all
interfaces is a deliberate development convenience for reaching the app
from other devices on the LAN, and that `vite preview` and production builds
are unaffected.

File to modify: `vite.config.ts`.

```ts
server: {
  port: 8008,
  // Dev-only: bind all interfaces so the app is reachable from other
  // devices on the LAN during development; preview and builds are unaffected.
  host: true,
},
```

**Document the dev-server binding in `DEPLOYMENT.md`**

A short Development Server section states the `host: true` intent, names
`vite.config.ts` as the source, and scopes the behaviour to `vite dev`.

File to modify: `docs/DEPLOYMENT.md`.

## Implementation Order

1. Update `DEPLOYMENT.md`.
2. Apply the `electron/main.cjs`, `public/worker.js`, and `vite.config.ts`
   edits.
3. Add `test/workers/serviceWorker.test.ts` and
   `test/electron/webPreferences.test.ts`.
4. Run targeted verification: `npx vitest run` on the touched test files,
   `npx eslint` on touched sources, `npx tsc -b`, `npx prettier --check`.
5. Run `npm run electron:build` once to confirm the packaged build still
   succeeds with `sandbox: true`; packaged launch stays an integration step.
6. Record refinements in this plan.

## Testing Strategy

**Unit tests**

Create `test/workers/serviceWorker.test.ts` (`@vitest-environment node`).
The suite reads `public/worker.js`, evaluates it with `new Function`
against fake `self`, `caches`, and `fetch` globals, and dispatches the
captured event handlers:

- A same-origin GET answered with a 200 response is written to the cache
  and returned to the client.
- Same-origin GETs answered with 404 and 500 responses are returned to the
  client but never written to the cache.
- Non-GET requests and cross-origin requests never reach `respondWith`.
- A rejected fetch falls back to `caches.match`, and a navigate request
  falls back to the cached `index.html`.

Create `test/electron/webPreferences.test.ts`
(`@vitest-environment node`). `electron/main.cjs` cannot be imported under
Vitest because it requires the `electron` module, so the suite reads the
source and asserts the `webPreferences` block pins `sandbox: true` beside
the existing `contextIsolation` and `nodeIntegration` settings.

**Integration tests**

`npm run electron:build` verifies the packaged build compiles and packages
with the new preference. Launching the packaged app to confirm MIDI,
close-guard IPC, and runtime-info dialogs still work under the sandbox is
the recorded manual smoke step - it is not automated here.

## Verification

- Run `npx tsc -b`.
- Run `npx eslint` on the touched files.
- Run `npx prettier --check` on the touched files.
- Run `npx vitest run test/workers/serviceWorker.test.ts test/electron/webPreferences.test.ts`.
- Run `npm run electron:build` and confirm `release/` artifacts build.
- Manually launch the packaged app and verify startup, MIDI permission,
  and the About dialog runtime info under `sandbox: true`.

## Refinements

Adjustments made during implementation, recorded per the workflow rule.

- The `response.ok` guard is an `if` block wrapping the clone-and-put pair
  rather than a single-line guard - the cached write is two statements, so
  the block is the minimal correct shape.
- Automated coverage was added beyond the record's manual verification:
  `test/workers/serviceWorker.test.ts` evaluates `public/worker.js` in a
  `node:vm` context with fake worker globals (9 tests), and
  `test/electron/webPreferences.test.ts` source-guards the `sandbox: true`
  pin because `electron/main.cjs` cannot be imported under Vitest.
- `docs/DEPLOYMENT.md` gained a `## Development Server` section at the end
  of the document rather than a note inside an existing section - the
  binding is a development concern with no natural home in the deployment
  sections.
- `npm run electron:build` was attempted once and stopped at the `tsc -b`
  step on foreign in-flight errors in `test/utils/cross/zzprobe.test.tsx`
  (unused variables, outside this change set) - `vite build` and
  `electron-builder` never ran. `node --check` passes on
  `electron/main.cjs`, `electron/preload.cjs`, and `public/worker.js`.
  Re-run the packaged build once the tree typechecks, and keep the
  packaged-launch smoke as the sandbox acceptance step.
