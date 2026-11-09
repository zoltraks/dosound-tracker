# Remove Dead Dependency and Fixtures Implementation Plan

## Summary

| Field         | Value                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| Intent        | Make the declared dependency and fixture inventories match what the suite uses         |
| Key decisions | `@testing-library/jest-dom` is uninstalled; the eight unreferenced fixtures are pruned |
| Open risks    | `none`                                                                                 |

## Change Request Reference

`change/1.4.1/remove-dead-dependency-fixtures.md`

## Best Practices

- Dependency hygiene per `standard/typescript-general-development.md`: a declared package with no import site is removed through the package manager, never by editing `package.json` alone, so `package-lock.json` stays in sync.
- Keep the diff minimal per `GUIDELINES.md` development principles: only the declaration, the lockfile, and the dead files change.

## Documentation Updates

No documentation update is required. `TESTING.md` describes `test/fixtures/` as the committed-fixture location without naming individual files, and no active document enumerates the fixture inventory or declares `@testing-library/jest-dom` as a project dependency. The vendored standards mention the package only as generic recommendation text.

## Type and State Updates

**Type definitions**

None.

**State store modifications**

None.

## Step by Step Implementation

**Verify the dependency is dead**

Confirm no import site exists before removal. `grep -rn "jest-dom" src/ test/ e2e/` returns no source reference; `test/setup.ts` and `test/setup-localstorage.ts` do not register it.

File to modify: none - verification only.

**Uninstall the unused declaration**

Run the package manager so the manifest and lockfile move together.

```bash
npm uninstall -D @testing-library/jest-dom
```

File to modify: `package.json`, `package-lock.json` (via npm).

**Prune the unreferenced fixtures**

Delete the eight files no test, source file, or e2e spec references. The two referenced fixtures stay.

```bash
rm test/fixtures/clean-check.song.yaml \
   test/fixtures/song-export-a4.yaml \
   test/fixtures/song-export-c4-long.yaml \
   test/fixtures/song-export-c4.yaml \
   test/fixtures/song-midi-check.yaml \
   test/fixtures/TEST_A_4_REFACTORING_1_2_3_GPT.vgm \
   test/fixtures/TEST_A_4_REFACTORING_1_2_3_SWE_BROKEN.vgm \
   test/fixtures/TEST_A_4_REFACTORING_1_2_3_SWE_FIX.vgm
```

File to modify: `test/fixtures/` contents. Kept: `song-vgm-noise.yaml`, `song-vgm-tone.yaml` (referenced by `test/exports/exportVgm.test.ts`, `test/exports/exportMax.test.ts`, `test/exports/exportWav.test.ts`, `test/utils/song/songParser.test.ts`).

**Run the verification loop**

The full loop per `TESTING.md`, since the suite itself is touched. `npm test` must stay green with the pruned fixtures gone and the dependency removed.

## Implementation Order

1. Documentation updates - none required.
2. Type updates - none.
3. Store updates - none.
4. Dependency removal.
5. Fixture pruning.
6. Verification loop.

## Testing Strategy

**Unit tests**

The existing suite is the test of record: `npm test` must pass with zero failures after removal. The export tests that consume the surviving fixtures (`test/exports/exportVgm.test.ts`, `test/exports/exportMax.test.ts`, `test/exports/exportWav.test.ts`, `test/utils/song/songParser.test.ts`) prove the keepers were identified correctly.

**Integration tests**

None - no component interaction changes.

## Verification

- `npm run typecheck` - `tsc -b` across the project graph.
- `npm run lint` - zero errors, zero warnings.
- `npm run format` - applied to the tree.
- `npm run build` - `tsc -b && vite build` clean.
- `npm test` - the full suite green without the removed package and fixtures.
