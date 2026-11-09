# Add a Mechanical Toolchain Floor Implementation Plan

## Summary

| Field         | Value                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Intent        | Encode the README-declared Node and npm floor mechanically at install time                     |
| Key decisions | `engines` floor plus `.nvmrc` pin; `engine-strict` in `.npmrc` when the dependency tree allows |
| Open risks    | a transitive package's engine range may reject Node 26 under `engine-strict`                   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.4.0/add-toolchain-floor.md`.

## Best Practices

Follow general engineering standards from
`docs/standard/typescript-general-development.md`:

- Declare floors with `>=` ranges so newer toolchains stay admitted.
- Keep the exact-version pin in `.nvmrc` only, matching nvm conventions.
- Prefer manifest declarations over documentation prose for enforcement.

## Documentation Updates

Per project guidelines, update the active documentation set before any source
code modifications. Update only the files affected by this change.

- `README.md` — Development Environment section points at the mechanical
  declarations.
- `DEPLOYMENT.md` — build prerequisites note the enforced floor.

`PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, and `FORMAT.md` are
unaffected.

## Type and State Updates

None. The change touches no types, stores, or application state.

## Step by Step Implementation

**Update README and DEPLOYMENT**

Keep the declared versions and add a short note that the floor is enforced by
`package.json` `engines` and `.nvmrc`.

Files to modify: `README.md`, `docs/DEPLOYMENT.md`.

**Declare the engines floor**

Add an `engines` block to `package.json` admitting the declared versions and
newer.

File to modify: `package.json`.

```json
"engines": {
  "node": ">=26.13.0",
  "npm": ">=11.20.0"
}
```

**Pin the toolchain for nvm**

Create `.nvmrc` carrying the exact Node version.

File to create: `.nvmrc`.

```text
26.13.0
```

**Enforce the floor at install time**

Create `.npmrc` with `engine-strict=true` so `npm install` and `npm ci` fail
below the floor instead of warning. If a transitive dependency's engine range
rejects the current toolchain under strict mode, omit this step and record the
decision in the summary block.

File to create: `.npmrc`.

```text
engine-strict=true
```

**Refresh the lockfile**

Run `npm install` so the lockfile records the new `engines` field under
`packages[""]` and verifies the tree installs under the floor.

## Implementation Order

Execute the steps above in this sequence.

1. Update `README.md` and `DEPLOYMENT.md`.
2. Add `engines` to `package.json`.
3. Create `.nvmrc`.
4. Create `.npmrc` when the tree permits.
5. Run `npm install` and inspect the lockfile delta.
6. Run verification loop.

## Testing Strategy

**Unit tests**

None. Manifest and configuration change only.

**Integration tests**

`npm install` under the declared floor is the install-time verification. The
record's `npm ci` check is exercised at the next clean-environment install.

## Verification

Run the verification loop in this order. The implementation is complete only
when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Confirm `npm install` succeeds and the lockfile records the engines block
