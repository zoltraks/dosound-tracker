# Clear the minimatch dependency advisories Implementation Plan

## Summary

| Field         | Value                                                                                |
| ------------- | ------------------------------------------------------------------------------------ |
| Intent        | Return `npm audit` to a clean exit by clearing the moderate `minimatch` chain        |
| Key decisions | Scoped `overrides` force minimatch `^11.0.5` under the five vulnerable parent chains |
| Open risks    | minimatch 10.x/9.x to 11.x under dev tooling - verified green, watch upstream        |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.5/clear-minimatch-advisories.md`.

## Best Practices

- `npm audit fix --force` is rejected: it downgrades eslint to 9.39.5, a
  breaking regression against the 1.4.1 eslint-10 migration.
- No fixed release exists inside the declared parent ranges (parents cap
  `minimatch` at `^10.2.2`, the advisory covers 7.0.0-11.0.0, fix ships in
  11.0.1+), so the recorded chain-upgrade note's scoped-override form applies.

## Documentation Updates

`VERSIONING.md` already documents the residual path; none needed - the advisory
is fully cleared, so no residual note is required. No pillar document changes.

## Step by Step Implementation

**Add scoped overrides**

File to modify: `package.json`.

```json
"overrides": {
  "@typescript-eslint/typescript-estree": { "minimatch": "^11.0.5" },
  "@eslint/config-array": { "minimatch": "^11.0.5" },
  "@electron/universal": { "minimatch": "^11.0.5" },
  "eslint": { "minimatch": "^11.0.5" },
  "app-builder-lib": { "minimatch": "^11.0.5" }
}
```

The five parents are the complete set of chains npm audit flagged. Scoped
overrides pin `minimatch` to the patched `11.x` line only under those parents;
unrelated `minimatch@3.x`/`5.x` resolutions are untouched.

**Regenerate the lockfile resolution**

`npm install` rewrites `package-lock.json` so the five parents resolve
`minimatch@11.0.5`. `npm audit` then exits 0.

## Implementation Order

1. Add overrides to `package.json`
2. `npm install`
3. `npm audit` - must exit 0
4. Run verification loop (lint and test prove the 11.x line under dev tooling)

## Testing Strategy

No new tests - the change is dependency resolution only. The existing suite
plus eslint itself are the regression net for a minimatch major bump under
dev tooling.

## Verification

- `npm audit` exits 0 (observed: `found 0 vulnerabilities`)
- `npm run lint` clean - eslint runs on minimatch 11
- `npm run typecheck`, `npm run build` clean
- `npm test` - 100 files, 792 tests pass
