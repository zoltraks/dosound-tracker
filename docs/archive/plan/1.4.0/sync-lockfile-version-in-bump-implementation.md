# Sync the Lockfile Version Inside the Bump Script Implementation Plan

## Summary

| Field         | Value                                                                           |
| ------------- | ------------------------------------------------------------------------------- |
| Intent        | Make `scripts/bump-version.mjs` write the new version into `package-lock.json`  |
| Key decisions | Direct version-field write instead of `npm install` - deterministic and offline |
| Open risks    | `none`                                                                          |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.4.0/sync-lockfile-version-in-bump.md`.

## Best Practices

Follow TypeScript and general engineering standards from
`docs/standard/typescript-general-development.md` and
`docs/standard/bash-inline-development.md`:

- Keep the script synchronous and dependency-free, matching its current style.
- Fail loudly on a malformed lockfile instead of silently skipping the sync.
- Preserve the file's existing formatting convention (`JSON.stringify` output).

## Documentation Updates

Per project guidelines, update the active documentation set before any source
code modifications. Update only the files affected by this change.

- `VERSIONING.md` — the manual `npm install` step is absorbed by the bump
  script - the automated-bump section gains the lockfile sync.

No other pillar document changes. `PROJECT.md`, `ARCHITECTURE.md`,
`SPECIFICATION.md`, and `FORMAT.md` are unaffected.

## Type and State Updates

None. The change touches no types, stores, or application state.

## Step by Step Implementation

**Update VERSIONING.md**

Record the lockfile sync as part of the automated bump and keep the manual
procedure consistent with it.

File to modify: `docs/VERSIONING.md`.

**Sync the lockfile inside bump-version.mjs**

After the `package.json` write, read `package-lock.json`, update the root
`version` field and the `packages[""]` version field to the bumped version,
and write the file back with the same two-space formatting npm uses. A missing
or unparsable lockfile surfaces as an error instead of a silent skip.

File to modify: `scripts/bump-version.mjs`.

```javascript
const packageLockPath = resolve(__dirname, '..', 'package-lock.json');
const lock = JSON.parse(readFileSync(packageLockPath, 'utf8'));
lock.version = nextVersion;
if (lock.packages && lock.packages['']) {
  lock.packages[''].version = nextVersion;
}
writeFileSync(packageLockPath, JSON.stringify(lock, null, 2) + '\n', 'utf8');
```

## Implementation Order

Execute the steps above in this sequence.

1. Update `VERSIONING.md`.
2. Update `scripts/bump-version.mjs`.
3. Exercise the script against copied manifests in `work/`.
4. Run verification loop.

## Testing Strategy

**Unit tests**

No unit test is added: `scripts/` carries no Vitest coverage and the script is
a release tool, not application logic. Behaviour is verified by running the
script against copied `package.json` and `package-lock.json` files under
`work/` and asserting both versions equal the bumped value.

**Integration tests**

The real verification is the window close: `package-lock.json` version equals
`package.json` version after `npm run bump`.

## Verification

Run the verification loop in this order. The implementation is complete only
when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Run the copied-manifest harness under `work/` and confirm both version
  fields land on the bumped value
