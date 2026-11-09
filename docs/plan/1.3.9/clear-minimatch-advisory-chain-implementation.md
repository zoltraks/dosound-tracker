# Clear the Minimatch Advisory Chain Implementation Plan

## Summary

| Field         | Value                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Intent        | Clear the 12 moderate `minimatch` advisories in dev-only transitive chains                           |
| Key decisions | compatible patch bump applied; residual documented because no compatible upgrade clears the advisory |
| Open risks    | residual advisory accepted pending upstream fixes                                                    |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.9/clear-minimatch-advisory-chain.md`.

## Analysis

`npm audit` reports 12 moderate `minimatch` advisories (GHSA-g3hv-75wg-m249, glob-pattern denial of service, vulnerable range `>=7.0.0 <11.0.1`). Two installed instances are vulnerable:

- `node_modules/minimatch@10.2.6` - required by `@typescript-eslint/typescript-estree` (`^10.2.2`) and `app-builder-lib` (`^10.2.5`).
- `node_modules/@electron/universal/node_modules/minimatch@9.0.9` - required by `@electron/universal@2.0.3` via `app-builder-lib`.

No compatible upgrade path exists:

- `electron-builder@26.18.1` (latest stable, applied) still resolves `@electron/universal@2.0.3` and `minimatch ^10.2.5`. The `27.0.0-alpha` line drops `@electron/universal`'s minimatch dependency but keeps `minimatch ^10.2.5` and is not a stable upgrade.
- `typescript-eslint@8.72.2` (published 2026-11-09, under seven days old) still pins `minimatch ^10.2.2` - it neither clears the advisory nor passes the age rule.
- `npm audit fix --force` downgrades `electron-builder` to 25.x - the record rejects this.
- An `overrides` entry forcing `minimatch@^11` on `^10`/`^9` edges is a forced resolution beyond what each chain admits - the record's out-of-scope boundary.

The residual is documented in `docs/decision/2026-11-09-minimatch-advisory-residual.md` with the reach analysis.

## Best Practices

- `npm audit fix` can no-op on peer-pinned chains - upgrade every member of a held chain explicitly (recorded `WORKFLOW.md` note, applied here).
- Prefer versions published at least seven days ago - `electron-builder@26.18.1` qualifies, `typescript-eslint@8.72.2` does not.

## Documentation Updates

- `docs/decision/2026-11-09-minimatch-advisory-residual.md` - new durable decision record carrying the residual and its reach analysis.

No project document changes - the advisory posture is environment state, not specification.

## Step by Step Implementation

**Apply the compatible electron-builder patch bump**

`npm install -D electron-builder@26.18.1` updates the whole `electron-builder` family (app-builder-lib, dmg-builder, electron-builder-squirrel-windows) to 26.18.1. Published 2026-10-26 - inside the age rule.

**Record the residual advisory**

Write the decision record with the affected chains, the reach analysis, and the conditions that clear it.

File to create: `docs/decision/2026-11-09-minimatch-advisory-residual.md`.

## Implementation Order

1. Apply the dependency bump.
2. Re-run `npm audit` and capture the residual.
3. Write the decision record.

## Testing Strategy

No tests - dependency and documentation change. The verification loop still runs because `package.json` and the lockfile changed.

## Verification

- `npm audit` output: 12 moderate advisories remain, all `minimatch` on dev-only chains - matches the recorded residual.
- Run `npm run lint` and `npm run build` after the bump to confirm the toolchain is unaffected.
- Run `npm test`.
