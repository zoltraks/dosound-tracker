# Script the Document Retention Sweep Implementation Plan

## Summary

| Field         | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Intent        | Implement `docs/change/1.6.0/retention-sweep-script.md` as `scripts/retention-sweep.mjs` |
| Key decisions | Pure classification core, single git exec seam, `test/scripts/` suite on fixtures        |
| Open risks    | Boundary-day flat files are surfaced, never auto-decided                                 |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.6.0/retention-sweep-script.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- No abbreviations in identifiers (use full words)
- Explicit interfaces for module shapes - tests load the script through `createRequire` and cast to an interface, never `any`
- Small, single-purpose functions - classification stays pure and separately testable
- Preserve the `bump-version.mjs` script conventions - Node ESM, `fileURLToPath` for `__dirname`, plain console output, non-zero exit on failure

The script is plain `.mjs` and sits outside the TypeScript graph - ESLint is its static gate per `TESTING.md`. No top-level await so `createRequire` can load it.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications. Update only the files affected by this change.

- `WORKFLOW.md` — the Document Retention "Sweep procedure" names the scripted entry point `npm run retention` and its flags (`--apply`, `--repoint`, `--json`); the agent-run path stays recorded for judgment items
- `TOOLING.md` — a note recording the script's existence, flags, and output contract for shell/sweep work
- `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, `FORMAT.md` — no changes required; the tool automates an existing recorded procedure and touches no runtime or format surface

## Type and State Updates

**Type definitions**

None. The script is outside `src/`; the test file declares its own module interface.

**State store modifications**

None.

## Step by Step Implementation

**Update the sweep procedure**

Record the scripted entry point and flags in the Document Retention section of `docs/WORKFLOW.md`, and add the usage note to `docs/TOOLING.md`. The procedure steps themselves stay unchanged - the script encodes them.

**Add the retention sweep script**

Create `scripts/retention-sweep.mjs` implementing the recorded sweep.

File to create: `scripts/retention-sweep.mjs`.

```text
pure core (exported):
  parseVersion            "X.Y.Z" -> { major, minor, patch }
  versionTokenFromName    filename -> version | null  (handles compact "146" tokens)
  classifyVersionDir      dirname vs boundary -> retire | stay
  classifyFlatFile        filename + familyStart -> retire | stay (token beats date)
  planSweep               listings -> { moves, provisions, gitkeepActions, reports }

exec seam (not exported):
  git(args) -> spawnSync output
  resolveFamilyStart  bump commit date vs earliest X.Y.* artifact date
  applyPlan           git mv, mkdir, touch/rm .gitkeep
  linkCheck           grep active doc set for candidate paths

cli:
  default dry-run prints the plan
  --apply executes, --repoint rewrites staying-file references, --json emits the plan
```

**Wire the npm script**

Add the entry point beside the existing script entries.

File to modify: `package.json`.

```json
"retention": "node scripts/retention-sweep.mjs"
```

**Add the unit suite**

Create the `test/scripts/` domain for repo-script tests, mirroring the `test/electron/` precedent for `electron/` modules.

File to create: `test/scripts/retentionSweep.test.ts`.

```typescript
// @vitest-environment node
// load scripts/retention-sweep.mjs through createRequire, cast to an explicit
// module interface, and exercise the exported pure functions; a fixture git
// repository under work/ exercises the apply path inside try/finally cleanup
```

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation
2. Implement `scripts/retention-sweep.mjs`
3. Wire `npm run retention` in `package.json`
4. Add `test/scripts/retentionSweep.test.ts`
5. Run verification loop

## Testing Strategy

**Unit tests**

Pure-function coverage of the classification core: version parsing, compact-token normalization (`window-146-sdlc` -> `1.4.6`, `1.4.5-window` -> `1.4.5`), versioned-dir retirement against the boundary, flat-file token-beats-date and date-before-start rules, and `.gitkeep` reconciliation decisions on synthetic directory listings.

Test file to create or update: `test/scripts/retentionSweep.test.ts`.

```typescript
describe('retention sweep classification', () => {
  it('retires versioned directories below the current family', () => { ... });
  it('keeps the current family and later windows', () => { ... });
  it('retires flat files by version token regardless of date', () => { ... });
  it('retires flat files dated before the family start', () => { ... });
  it('keeps boundary-day files and surfaces their version references', () => { ... });
  it('reconciles .gitkeep markers in both directions', () => { ... });
});
```

**Integration tests**

A fixture repository built under `work/` inside `try/finally` - temp directories, fake `docs/` roles, `git init`, and an `--apply` run asserting the moved files, the archive layout, and the placed `.gitkeep` markers.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Dry-run `npm run retention` against the real repository and confirm the plan reproduces the recorded sweep outcome - no moves expected while the tree is already swept, and the classification summary matches the post-sweep state
