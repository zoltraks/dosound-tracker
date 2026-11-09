# 2026-11-09 - Minimatch Advisory Residual

## Context

`npm audit` reports 12 moderate advisories for `minimatch` (GHSA-g3hv-75wg-m249, glob-pattern denial of service, vulnerable range `>=7.0.0 <11.0.1`). Two installed instances are vulnerable: `minimatch@10.2.6` via `@typescript-eslint/typescript-estree` and `app-builder-lib`, and `minimatch@9.0.9` via `@electron/universal@2.3` through `app-builder-lib`. The 1.3.9 change record `clear-minimatch-advisory-chain` requires clearing them or documenting a residual.

## Alternatives

- `npm audit fix --force` - rejected: downgrades `electron-builder` to 25.x, a breaking change the record rejects.
- `overrides` forcing `minimatch@^11` on `^10`/`^9` edges - rejected: a forced resolution beyond what each chain admits, risking subtle breakage in the lint and packaging toolchains.
- `electron-builder@27.0.0-alpha` line - rejected: drops the `@electron/universal` edge but keeps `minimatch ^10.2.5` and is not stable.
- Document the residual - accepted.

## Decision

The 12 moderate `minimatch` advisories are accepted as a documented residual until upstream chains release compatible fixed versions.

## Rationale

Every consuming edge pins `^10` or `^9` ranges that cannot resolve `minimatch@11.0.1` or newer, and no stable upstream release widens those ranges. The advisory is a denial of service via crafted glob patterns; all reach is dev-only - `@typescript-eslint/typescript-estree` matches project-controlled tsconfig globs, and `app-builder-lib`/`@electron/universal` match project-controlled packaging patterns. No attacker-controlled input reaches the glob engine in this project's usage, and nothing ships to end users.

## Consequences

- The advisory set is re-verified at each version-bump security audit until upstream clears it.
- An upstream release that widens or bumps the minimatch ranges (typescript-eslint or electron-builder on `minimatch@11`/`@electron/universal@3`) removes the residual.
- `npm audit` keeps reporting 12 moderate advisories; this record is the accepted-deviation note for that output.

## Status

Accepted
