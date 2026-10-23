# Version the service-worker cache per build Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.0/version-service-worker-cache.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`. The Vite `define` convention applies: version data enters through the imported `package.json`, not `readFileSync`, so config re-evaluates when the version changes.

## Documentation Updates

Update the named documentation before any source code modifications.

- `DEPLOYMENT.md` — record the production service worker policy: versioned cache name, network-first fetch strategy, offline fallback.

## Step by Step Implementation

**Move the service worker to root scope**

The worker lives at `public/js/sw.js`, which caps its scope at `/js/` - it controls nothing under the app root and the cache code never runs. Static hosting cannot send the `Service-Worker-Allowed` header, so the file moves to `public/sw.js`, where the default scope covers the application. This repair is required for the record's use case to be meaningful and for the preserved offline capability to exist at all.

**Version the cache name**

Bake the application version into the emitted worker at build time. `public/sw.js` carries a `__APP_VERSION__` placeholder inside the cache name; a small `closeBundle` plugin in `vite.config.ts` rewrites `dist/sw.js` with `packageJson.version`, which `vite.config.ts` already imports. The registration URL stays `/sw.js`, so each deploy updates the existing registration through the normal byte-diff install/activate flow, and the activate handler's cache sweep deletes the previous version's cache.

**Prefer network-first for build assets**

Rewrite the fetch handler so every same-origin GET goes to the network first, updates the cache with the response, and falls back to the cache only when the network fails. Navigation requests keep the `/index.html` offline fallback. Asset filenames are deterministic (`assets/[name].js`), so every redeployed file must come from the network - the cache serves only as the offline path, preserving the offline capability noted in the record.

**Update the registration**

File to modify: `src/main.tsx`. Register `/sw.js` at the new root location.

## Implementation Order

1. Update documentation
2. Move `public/js/sw.js` to `public/sw.js` with the versioned cache name and network-first policy
3. Add the build-time placeholder substitution in `vite.config.ts`
4. Update the registration in `src/main.tsx`
5. Run verification loop

## Testing Strategy

**Unit tests**

No new utility functions. The worker is a static script verified through the build: after `npm run build`, `dist/sw.js` must contain the literal version in `CACHE_NAME` and no `__APP_VERSION__` placeholder.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Confirm `dist/sw.js` carries the baked version
- Run `npm test`
