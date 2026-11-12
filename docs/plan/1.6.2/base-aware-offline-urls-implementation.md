# Make Offline URLs Base-Aware Implementation Plan

**Change Request Reference:** `docs/change/1.6.2/base-aware-offline-urls.md`

## Summary

| Field         | Value                                                           |
| ------------- | --------------------------------------------------------------- |
| Intent        | Registration, precache, and fallback resolve under the deployed |
|               | base                                                            |
| Key decisions | `import.meta.env.BASE_URL` at registration; scope-relative URLs |
|               | inside the worker                                               |
| Open risks    | The worker is a static `public/` asset - base resolution inside |
|               | it uses registration scope, not a build-time constant           |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Best Practices

Follow `docs/standard/typescript-react-development.md`: no hardcoded
absolute paths where a base-relative form exists; the worker stays a
plain static script.

## Documentation Updates

- `DEPLOYMENT.md` - the "any static host" claim holds only once the
  nested-path probe passes; reconcile the wording in the same set.

## Type and State Updates

None.

## Step by Step Implementation

**Base-aware registration**

Register `${import.meta.env.BASE_URL}worker.js` instead of `/worker.js`
so nested deployments register the worker at the application path.

File to modify: `src/main.tsx`.

**Scope-relative worker URLs**

Replace the absolute `/` and `/index.html` constants with
`self.registration.scope`-relative URLs for the precache list and the
navigation fallback.

File to modify: `public/worker.js`.

**Probe both bases**

Serve the built site at `/` and at a nested path, install the worker,
go offline, and verify cold and returning navigation plus static asset
fetches at both bases.

## Implementation Order

1. Update documentation.
2. Registration change.
3. Worker URL changes.
4. Manual probe at both bases.
5. Verification loop.

## Testing Strategy

**Unit tests**

If URL resolution is factored into a helper, a unit test asserts the
resolved paths for root and nested scopes; the worker itself stays
unbundled so coverage stays at the registration/helper level.

**Integration tests**

Manual nested-path offline probe as above; `npm run test:e2e` keeps
passing at the default base.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`,
  `npm test` - all clean.
- Nested-path serve + offline navigation verified manually at both
  bases.
