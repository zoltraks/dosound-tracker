# TypeScript Conflict Engineering Standards

<!-- Version: 0.1.1 | Date: 2026-11-08 -->

## Purpose

This document defines the mandatory engineering standard for resolving merge conflicts in TypeScript
and Node.js repositories.

It extends the general merge-conflict standard with the toolchain's own detection and regeneration
machinery - the compiler, the linter, the lockfile,
and the formatter - which together decide what a resolution may look like.

This standard stacks on the TypeScript general standard.

## Scope

In scope are conflicted `.ts`, `.tsx`, `.mjs`, and `.cjs` sources, package manifests and lockfiles,
test and build configuration, generated contracts,
and locale or schema files shipped inside TypeScript packages.

Out of scope: non-TypeScript trees, and conflict classes the general merge-conflict standard already
covers without a TypeScript-specific rule.

## How To Use This Standard

### Order Of Operations

1. Classify each conflict per the general standard's taxonomy
2. Resolve source hunks to the API era the merged `package.json` pins
3. Resolve `package.json`, then reconcile the lockfile by the rules below
4. Run the package-pinned formatter on every hand-edited file
5. Let `tsc` and the linter act as oracles - duplicate identifiers and useless assignments surface
   the auto-merge's silent duplications.
6. Run the package's recorded gate before calling the merge resolved

### Precedence

When two rules conflict, apply the first matching source in this list.

| Rank | Source                                    | Example                                      |
| ---- | ----------------------------------------- | -------------------------------------------- |
| 1    | An explicit instruction from the user     | "Keep our version of the config"             |
| 2    | The project rules file                    | `AGENTS.md`, `docs/GUIDELINES.md`            |
| 3    | The existing convention in the repository | The dependency set the manifest pins         |
| 4    | The stacked TypeScript general standard   | Its code conventions                         |
| 5    | This standard                             | The rules this document defines              |
| 6    | General best practice                     | Anything the five sources above do not cover |

### Non-Negotiable Rules

- **Era consistency** - every resolved hunk uses the dependency API the merged manifest pins,
  never a blend of two majors' idioms.
- **Lockfile from the manifest** - the lockfile is reconciled against the merged `package.json` by
  comparison or regeneration, never by hand-merging hunks.
- **Compiler as oracle** - `tsc --noEmit` and the configured linter run on the merged tree before
  the resolution is reported.
- A violation of any of these rules is a defect, not a style preference

## Agent Intake Protocol

### Detection First

| Signal Found In Repository                | Inferred Decision                    | Confidence |
| ----------------------------------------- | ------------------------------------ | ---------- |
| `package.json` + `tsconfig*.json`         | A TypeScript package                 | High       |
| `package-lock.json` conflicted            | Reconcile by comparison, not by hunk | High       |
| Schema-library version bumped on one side | Era-mismatch resolution required     | High       |

### Existing Project

Confirm before editing: "This package pins its toolchain in `package.json` - I will resolve to the
merged manifest's API eras and verify with its gate."

### New Project

| Question           | Options                           | Default If Declined    |
| ------------------ | --------------------------------- | ---------------------- |
| Package manager    | npm, pnpm, yarn                   | Read from the lockfile |
| Compiler gate      | `tsc --noEmit`, `tsc -b --noEmit` | The package script     |
| Generated contract | OpenAPI spec, schema dump         | Detected from scripts  |

## Documentation

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) - type-system
  behavior at declaration conflicts.
- [TSConfig Reference](https://www.typescriptlang.org/tsconfig) - the compiler options
  the gate runs under.
- [typescript-eslint Rules](https://typescript-eslint.io/rules/) - the
  duplicate-and-shadow detection classes.
- [npm ci](https://docs.npmjs.com/cli/v10/commands/npm-ci) - the lockfile-exact
  install used to reconcile.

## Language Version

TypeScript 5.9 or later, with the Node.js LTS the project pins.

The schema-library era (for example Zod 3 versus Zod 4) is read from the merged `package.json`,
never assumed from the surrounding code style.

## Project Structure

```
<pkg>/
├── package.json          # Resolved first - it pins the API eras
├── package-lock.json     # Reconciled against the merged manifest
├── src/
│   ├── <merged sources>  # tsc + linter are the oracles
│   └── locales/*.json    # Additive-union catalog class
├── openapi.yaml          # Regenerate via the package script, never edit
└── vitest.config.ts      # Coverage/test policy - a product decision class
```

## Naming Conventions

| Element             | Convention                                      | Example                              |
| ------------------- | ----------------------------------------------- | ------------------------------------ |
| Era check           | Compare the merged manifest to each side's      | `zod: ^4.x` selects `z.strictObject` |
| Duplicate detection | Repeated top-level identifiers after auto-merge | `tsc` reports TS2300/TS2393          |
| Superset pick       | `git checkout --theirs` when a superset exists  | Worker files taken wholesale         |

## Code Conventions

- **Schema-era hunks** - a validator upgrade replaces every call-site idiom at once:
  `.object().strict()` becomes `z.strictObject`, `.default({})` becomes `.prefault({})`,
  `.string().url()` becomes `z.url()`. Keep the newer idiom in every hunk,
  and check the rest of the file already uses it.
- **Hook and module extractions** - when the incoming side moved logic into new hooks or modules,
  take its version and read the extracted file to confirm the branch's own deltas were already
  ported, rather than resurrecting the inline form.
- **Test-policy conflicts** - coverage thresholds, test budgets,
  and gate switches are product decisions.
  Check `git log -S <key>` for a deliberate removal commit before restoring your
  side's stricter setting.
- **Superset verification** - when one side's hunk contains the other's behavior plus more,
  take it wholesale, then grep the branch's own feature call-sites to prove they survived.

## Formatting and Linting

Run the package-pinned formatter (`<pkg>/node_modules/.bin/prettier --write`)
on every hand-resolved file - conflict resolutions routinely break the recorded style,
and `format:check` is part of the gate.

The linter's `no-useless-assignment` and the compiler's duplicate-identifier diagnostics are the
first detectors of silent auto-merge duplications.

## Testing

Resolution is proven by the package's recorded gate - for example lint with its warning ceiling,
`tsc --noEmit` (every configured project file), `vitest run`,
and the build - never by compiling the touched files alone.

## Build

Regenerate the declared contract before the build:
`npm run openapi:generate` (or the package's equivalent)
rebuilds `openapi.yaml` from the merged routes,
and a spec file that matches the incoming side's is evidence the route set converged.

## Dependencies

| Category | Library          | Purpose                                 |
| -------- | ---------------- | --------------------------------------- |
| Runtime  | typescript, node | Compile oracle and runtime              |
| Test     | vitest           | The recorded test gate                  |
| Lint     | eslint           | Duplicate and dead-assignment detection |
| Contract | Project's own    | `openapi:generate`, schema drift checks |

## Verification

| Check                    | Command Or Method                                              | Applies To        |
| ------------------------ | -------------------------------------------------------------- | ----------------- |
| Typecheck                | `npm --prefix <pkg> run typecheck`                             | Every merge       |
| Lint                     | `npm --prefix <pkg> run lint`                                  | Every merge       |
| Format gate              | `npm --prefix <pkg> run format:check`                          | Hand-merged files |
| Test suite               | `npm --prefix <pkg> run test`                                  | Every merge       |
| Manifest-lockfile parity | Compare dep names and spec strings, then `npm ci`              | Lockfile merges   |
| Duplicate scan           | `grep` repeated `const`/`function` identifiers in merged files | Auto-merged files |

## Definition of Done

### Correctness

- `tsc --noEmit` and the package lint pass on the merged tree with no duplicate identifiers,
  useless assignments, or era-mismatched calls remaining.
- Every generated artifact is regenerated and its drift check passes

### Structure

- The lockfile is reconciled by comparison or `npm ci`/`npm install`, never by hand-editing hunks
- Version fields in the manifests carry the mainline value

### Quality

- Each conflict resolved by its class rule, with upstream decisions preserved
- The branch's own feature call-sites are grep-proven present

### Hygiene

- Only files the merge touched were reformatted
- `git diff --check` is clean and no push ran without a named request

## General Principles

- The merged manifest pins the era. Resolve to it, never across eras
- The compiler and linter are the merge's oracles - silent duplications are their job to find
- Lockfiles and generated specs are rebuilt, not merged
- An evolved upstream refactor supersedes a local inline form
- A gate that fails inside the merged scope is a resolution defect to fix now

## Fed Patterns

Patterns proven in projects that adopted this standard and evolved their own conventions.

**Dep-set parity before lockfile choice.** When both sides changed the lockfile,
compare dependency names and spec strings between the merged `package.json` and each side's - an
identical dep set makes that side's lockfile exactly correct,
while any spec drift calls for `npm install` regeneration instead.

## Sources

- https://www.typescriptlang.org/docs/handbook/intro.html - TypeScript handbook.
- https://typescript-eslint.io/rules/ - lint rule reference for duplicate and dead-code classes.
- https://docs.npmjs.com/cli/v10/commands/npm-ci - lockfile-exact installation.
- https://zod.dev - schema-library era reference used in the era-mismatch examples.
