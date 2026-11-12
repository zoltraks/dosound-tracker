# Refactoring Assessment - 1.5.9

## Summary

Complete. The mandatory compliance steps and all seven optional polish waves
executed against the recorded layout convention. Two additional mixed
directories surfaced during execution - the new guard test caught them on its
first run - and were resolved under the same rules.

| Item                    | Proposed | Achieved |
| ----------------------- | -------- | -------- |
| Mandatory steps         | 4        | 4        |
| Optional waves          | 7        | 7        |
| Guard-surfaced fixes    | 0        | 2        |
| Files moved (`git mv`)  | ~75      | ~80      |
| Verification green      | yes      | yes      |

## Proposal vs Implementation

**Step 1 - `cross/` leaf for the multi-domain hook test** - completed.
`test/hooks/songManagement.test.ts` moved to `test/hooks/cross/`, specifiers
rewritten one level deeper.

**Step 2 - bundled song asset into a domain directory** - completed.
`src/assets/song.yaml` moved to `src/assets/song/song.yaml`, the `?raw`
specifier in `useSongManagement.ts` rewritten with the query preserved, and
citations updated in `FORMAT.md` and the standard's `Project Conventions`.

**Step 3 - record the `test/` root setup exemption** - completed in
`SPECIFICATION.md`, and extended beyond the written proposal - the
grouped-kinds sentence now names `components/` and `modals/`, records the
`cross/` leaf rule, and points at the guard test.

**Step 4 - structure-purity guard test** - completed.
`test/guard/directoryPurity.test.ts` walks `src/` and `test/` enforcing the
directories-only rule with the two recorded exemption lists.

**Waves O1-O7 - domain splits** - completed. `src/components/` is nine domain
directories (`shell`, `tracker`, `envelope`, `song`, `playlist`, `piano`,
`midi`, `modal`, `widgets`), `src/modals/` is eight (`instrument`,
`information`, `file`, `track`, `settings`, `midi`, `export`, `common`), and
`test/components/` plus `test/modals/` mirror them. `ModalManager` and
`ModalContainer` took the `modal/` domain with `DialogFrame` as proposed.

## Deviations and Rationale

**`test/utils/` cross-domain tests** - four flat test files
(`branchGaps`, `envelopeAndMidi`, `exportCoreAndValidation`,
`vgmAndTrackLine`) sat beside the domain mirrors, missed by the name-based
census. The guard test flagged them on its first run; they moved to
`test/utils/cross/` under rule R5. Addition by mechanical finding, not a
scope change.

**`test/fixtures/` root fixtures** - three song fixtures
(`bundled-song.yaml`, `song-vgm-noise.yaml`, `song-vgm-tone.yaml`) sat
beside `emission/` and `instrument/`, invisible to the TypeScript-file
census. They moved to `test/fixtures/song/` and every repo-relative
`readFileSync`/`readFixture` literal was rewritten. Same finding class.

**Empty `test/components/midi/` removed** - no test files exist for the
midi widgets, so the mirror carries no `midi/` leaf. `git mv` residue
cleanup, matching the empty-directory rule.

**Specifier rewriting ran through a codemod** - `relocate-codemod.mjs`
resolved each specifier against the importer's current location first and
its pre-move location as fallback, chasing targets through the cumulative
moves map. Two specifiers needed a re-run after an ordering fix; typecheck
confirmed the final state. The script lived in `work/` and stays out of the
commit.

## Verification Results

| Gate          | Result                                  |
| ------------- | --------------------------------------- |
| `typecheck`   | clean                                   |
| `lint`        | clean                                   |
| `test`        | 144 files, 1335 tests - all passing     |
| `build`       | clean - `?raw` payload resolves         |
| Purity guard  | green - fails on a seeded mixed dir     |

## Remaining Gaps

None against the proposal. `e2e` was not run - the moves are specifier-only
and the build plus suite cover the surface; run `npm run test:e2e` before
release if desired.

## Lessons Learned

Name-based census misses data fixtures and cross-domain batch tests - the
mechanical guard found both on its first run, which is the strongest
argument for landing enforcement before polishing.

A cumulative moves map plus resolve-current-then-pre-move ordering covers
every rewrite case - sibling joins, inbound fixups, and chains where both
ends moved in different waves.

The kind-domain `cross/` leaf was the right home for every batch test - the
file names (`envelopeAndMidi`, `vgmAndTrackLine`) already described the
crossing.
