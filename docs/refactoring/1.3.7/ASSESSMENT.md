# Refactoring Assessment

**Proposal:** `docs/refactoring/1.3.7/REFACTORING.md` - dead-code removal in `src/synth/` plus even-speed normalization consolidation

## Summary

Complete. Both focus areas landed as proposed.

|| Item | Proposed | Achieved |
|| ------------------------------------- | -------- | -------- |
|| `SoundDriver` class and event pipeline | remove | removed |
|| `EventOptimizer.ts` | remove | removed |
|| `SequencerEngine.ts` | remove | removed |
|| Dead-code test files | remove 3 | removed |
|| `VBLANK_RATE` constant duplication | collapse | removed |
|| `normalizeSongSpeed` extraction | 3 sites | 3 sites |
|| `songSpeed` unit test | add | added |
|| Documentation sync | update | updated |

## Proposal Versus Implementation

- `src/synth/SoundDriver.ts` was slimmed to a types-only module holding
  `Song`, `Pattern`, `Step`, `Note`, `Line`, and `Instrument` at the
  existing import path, so none of the type-import sites changed. The
  `SoundDriver` class (`convertSongToSoundEvents`, `playEvents`,
  `exportToAssembly`, `stop`, `isCurrentlyPlaying`), the `SoundEvent`
  interface, and the `DOSOUND_REGISTER_WRITE`, `DOSOUND_END_MARKER`,
  `VBLANK_RATE`, and `MIN_DELAY_CYCLES` constants were deleted; the only
  `src/` consumers of the constants were the deleted class members.
- `src/synth/EventOptimizer.ts` and `src/synth/SequencerEngine.ts` were
  deleted. `optimizeEvents` was consumed only by the removed
  `convertSongToSoundEvents`, and `SequencerEngine` was an unreferenced
  stub whose `processFrame` was a placeholder body.
- `test/synth/SoundDriver.test.ts`, `test/synth/EventOptimizer.test.ts`,
  and `test/synth/SequencerEngine.test.ts` were deleted; they exercised
  only the removed code.
- The three `VBLANK_RATE` value imports in `exportWav.test.ts`,
  `exportMax.test.ts`, and `exportVgm.test.ts` now alias
  `DEFAULT_SONG_FRAME` from `src/constants/song.ts`, removing the
  duplicated 50 Hz constant.
- `normalizeSongSpeed` was extracted to `src/utils/song/songSpeed.ts` as
  a verbatim lift of the four-line idiom and is reused by
  `songParser.ts`, `exports/asm.ts`, and `useSongManagement.ts`. The new
  `test/utils/song/songSpeed.test.ts` adds 6 tests covering pass-through,
  odd-value rounding, fractions, the minimum, the fallback, and numeric
  strings.
- `ARCHITECTURE.md` and `SPECIFICATION.md` were updated first so the
  documented playback path, speed normalization, and test-coverage gaps
  match the tree.

## Deviations

None in scope. Two findings adjusted the shape but not the plan:

- The investigation confirmed the claim under verification: `new
SoundDriver(` appears only in the dead-module test, and the live
  `exportToAssembly` is the module function in `src/exports/asm.ts`
  (three-strategy signature), so the removal proceeded.
- `SequencerEngine` was found dead during the same sweep - an
  additional removal inside the stated focus, recorded in the proposal
  rather than discovered mid-flight.

## Verification

- `npx tsc -b`: clean.
- `npm run lint`: zero errors, zero warnings.
- `npx prettier --write` on every touched file: all unchanged.
- `npm test`: 72 files, 532 tests, all pass. Baseline was 74 files and
  555 tests; the delta is the three deleted dead-code test files (-3)
  and the new `songSpeed` test file (+1).
- `npm run build`: production bundle emitted, index.js shrank from
  570.74 kB to 570.66 kB.
- Export output stability: the `exportAsmStrategies`,
  `exportAssemblyOptimized`, `exportVgm`, `exportMax`, `exportWav`, and
  `exportBinary` suites all pass unchanged, and `exportToAssembly` in
  `src/exports/asm.ts` was not modified.

## Remaining Gaps

- `TESTING.md` still lists `SoundDriver` among the coverage-gap modules
  and names `test/synth/` generically; the file carried concurrent
  edits during this cycle and was left untouched - a one-line follow-up
  remains.
- The `src/synth/SoundDriver.ts` filename no longer describes a driver;
  renaming it to `src/types/song.ts` (or similar) is deferred because it
  rewrites every type-import specifier across the tree, including files
  under concurrent edit.
- `InformationPanel.tsx` keeps its inline speed clamp, which
  deliberately lacks the default-6 fallback - a candidate only if its
  contract is revisited.

## Lessons

- Dead code hid behind a wall of `import type` references: the module
  looked load-bearing because a hundred files name it, but every import
  was type-only. Grepping for the constructor and for each exported
  value symbol separately was what actually resolved the question.
- Deleting a dead class exposes dead siblings: `EventOptimizer` and the
  `SequencerEngine` stub had no callers once the driver went away, so
  dead-code sweeps should always re-grep after the first removal.
- The specification's "rounded up to the next even number" claim for
  speed had drifted from the code's `& ~1` round-down; the consolidation
  surfaced and corrected that documentation drift.
