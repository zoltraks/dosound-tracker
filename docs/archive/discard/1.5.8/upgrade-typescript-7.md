# Upgrade TypeScript to 7

**Type:** Chore

**Status:** Abandoned

**Abandonment reason:** The project owner discarded the record during the
1.5.8 window intake. The TypeScript 7 upgrade is no longer wanted work - the
upstream gate was measured as still closed (`typescript-eslint` 8.72.2 and
the canary line both declare `typescript <6.1.0`), and the owner chose to
abandon the record rather than carry it into a later window.

## Summary

| Field         | Value                                                             |
| ------------- | ----------------------------------------------------------------- |
| Intent        | Move to `typescript` 7 once the lint toolchain admits it          |
| Key decisions | Single dependency bump behind a hard external gate                |
| Open risks    | Blocked upstream - measured in the 1.5.8 window: `typescript`     |
|               | 7.0.2 is published, but `typescript-eslint` 8.72.2 (latest) and   |
|               | 8.72.3-alpha.8 (canary) both declare `typescript >=4.8.4 <6.1.0`, |
|               | so even the TypeScript 6 stable line is not yet admitted          |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`typescript` 7 is blocked by the lint toolchain: the installed
`typescript-eslint` range requires `typescript <6.1.0`, so bumping the
compiler today would break the lint stage of the verification loop.

The record waits in a later window for the upstream gate to open - a
`typescript-eslint` release whose declared TypeScript range admits the 7
line. When that lands, `typescript` bumps, the full verification loop
runs, and any new strictness diagnostics are resolved as part of the
upgrade.

TypeScript 7 (the native-compiler line) may also change build behaviour
beyond diagnostics - `tsc -b` project-graph behaviour, emit settings,
and the `erasableSyntaxOnly` constraint should be re-validated against
the new toolchain.

## Use Cases

- When `typescript-eslint` releases a range admitting TypeScript 7, the
  upgrade proceeds and the loop reports clean.
- When the upstream cap persists, the record stays blocked and reports
  the dependency state.

## Hints

- Check the `typescript-eslint` peer range first - it is the recorded
  gate, not the TypeScript release itself.
- `tsconfig.app.json` enables `erasableSyntaxOnly` and the build runs
  `tsc -b` - both are worth a focused check under a new compiler
  major.
- ESLint's own type-aware rules may re-flag existing suppressions under
  a new checker - audit the audio-critical lint exceptions against the
  new diagnostics.

## Out of Scope

- Replacing the lint toolchain to force the upgrade - the gate is
  upstream support, not a workaround.
- Dropping `tsc` for a third-party checker.
