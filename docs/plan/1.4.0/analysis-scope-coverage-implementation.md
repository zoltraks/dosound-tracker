# Bring Configs, e2e, and Electron Inside Analysis Scope Implementation Plan

## Summary

| Field         | Value                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------- |
| Intent        | Make lint and typecheck report on every source file and make e2e always preview a fresh build |
| Key decisions | `typecheck` becomes `tsc -b`; `.cjs` files take the lint gate; `pretest:e2e` runs the build   |
| Open risks    | newly scoped files may surface lint findings that need resolution inside the same change      |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.4.0/analysis-scope-coverage.md`.

## Best Practices

Follow general engineering standards from
`docs/standard/typescript-general-development.md`:

- One tsconfig per toolchain domain - extend `tsconfig.node.json` rather than
  adding a third project.
- ESLint flat-config blocks stay minimal: parser and globals per file kind,
  no rule duplication.
- npm lifecycle pre-scripts carry build preconditions, not chained commands
  inside `webServer`.

## Documentation Updates

Per project guidelines, update the active documentation set before any source
code modifications. Update only the files affected by this change.

- `TESTING.md` — the type-check section drops the no-op note and describes
  `tsc -b` scope - the e2e sections record the automatic build precondition.

`PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, and `FORMAT.md` are
unaffected.

## Type and State Updates

None. The change touches no types, stores, or application state.

## Step by Step Implementation

**Update TESTING.md**

Rewrite the type-checking bullets so `npm run typecheck` runs `tsc -b` across
`src/`, `test/`, the config files, and `e2e/`. Update the e2e passages so the
build precondition is recorded as automatic.

File to modify: `docs/TESTING.md`.

**Make typecheck a real gate**

Change the `typecheck` script to `tsc -b`, the same project graph the build
already type-checks.

File to modify: `package.json`.

```json
"typecheck": "tsc -b"
```

**Extend the node tsconfig**

Add the config files and the e2e suite to `tsconfig.node.json`. The `.cjs`
files stay out of TypeScript scope - `tsc` does not check CommonJS sources
under the project's emit-free setup, so ESLint is their gate.

File to modify: `tsconfig.node.json`.

```json
"include": ["vite.config.ts", "vitest.config.ts", "playwright.config.ts", "e2e"]
```

**Extend the ESLint scope**

Remove the three config files from `globalIgnores`. Add a TypeScript block for
`*.config.ts` and `e2e/**/*.ts` with `tsconfig.node.json` in the parser
project list. Add a CommonJS block for `electron/**/*.cjs` and
`scripts/**/*.cjs`, and a module block for `scripts/**/*.mjs` and
`eslint.config.js`, both with Node globals and `js.configs.recommended`.

File to modify: `eslint.config.js`.

**Add the e2e build precondition**

Register an npm pre-script so `npm run test:e2e` always previews a fresh
`dist/`.

File to modify: `package.json`.

```json
"pretest:e2e": "npm run build"
```

## Implementation Order

Execute the steps above in this sequence.

1. Update `TESTING.md`.
2. Update `package.json` scripts.
3. Update `tsconfig.node.json`.
4. Update `eslint.config.js`.
5. Resolve any findings the widened scope reports.
6. Run verification loop.

## Testing Strategy

**Unit tests**

None. Toolchain and configuration change only.

**Integration tests**

`npm run typecheck` reporting on the new surface and `eslint .` covering every
file are the verification. `npm run test:e2e` proves the build precondition
runs before the preview.

## Verification

Run the verification loop in this order. The implementation is complete only
when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Confirm lint now reports on `e2e/`, `electron/`, `scripts/`, and the config
  files by inspecting `eslint --debug` scope or a targeted `eslint` run
