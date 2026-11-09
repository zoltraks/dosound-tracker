# Migrate off Deprecated Toolchain Lines Implementation Plan

## Summary

| Field         | Value                                                                                |
| ------------- | ------------------------------------------------------------------------------------ |
| Intent        | Move lint and build onto supported release lines                                     |
| Key decisions | eslint 10.14 + `@eslint/js` 10, vite 8.3, `@vitejs/plugin-react` 6; vitest stays 4.x |
| Open risks    | rolldown-vite to vite 8 option drift; plugin behaviour under eslint 10               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.4.0/migrate-deprecated-toolchain-lines.md`.

## Analysis

Registry-verified on 2026-11-09. eslint 9 is EOL - eslint 10.14.0 is current
and the whole plugin chain (typescript-eslint 8.72.1, react-hooks 7.1.1,
react-refresh 0.5.7) accepts it. `rolldown-vite` is deprecated at 7.3.1 and
merged into vite 8.3.x. `@vitejs/plugin-react` 6 requires vite 8, so the
three move together and the `overrides` alias must go. vitest 5 was tried
and reverted in a previous window (recorded in `FUTURE.md`), so vitest stays
at 4.1.12 - it accepts vite 8.

## Documentation Updates

- `TESTING.md` — no change needed - gates stay the same commands.
- `ARCHITECTURE.md` — the rolldown-vite mention becomes vite 8.

## Step by Step Implementation

**Update ARCHITECTURE.md**

Rename the rolldown-vite bundler mention to vite 8.

**Update package.json**

- `eslint` `^9.39.5` to `^10.14.0` - `@eslint/js` `^9.39.5` to `^10.0.1`.
- `vite` `npm:rolldown-vite@7.3.1` to `^8.3.7` in `devDependencies` - delete
  the `overrides` block.
- `@vitejs/plugin-react` `^5.2.0` to `^6.3.0`.

**Install and verify**

`npm install`, then the full loop. Any vite 8 config drift in
`vite.config.ts` is fixed in place (deprecation warnings are findings).

## Testing Strategy

The full suite plus `npm run build` and `npm run test:e2e` are the gate -
the migration is toolchain-only and must not alter output behaviour.

## Verification

- `npm run typecheck`, `lint`, `format`, `build`, `test`
- `npm run test:e2e` (the smoke suite on the new vite)
- No deprecation warnings in install or build output
