# Refactoring Proposal

**Focus:** Dead-code removal in `src/synth/` plus even-speed normalization consolidation

## Problem

`src/synth/SoundDriver.ts` still carries the `SoundDriver` class, its
`playEvents`/`exportToAssembly`/`convertSongToSoundEvents` event pipeline, the
`SoundEvent` interface, and the `DOSOUND_REGISTER_WRITE`, `DOSOUND_END_MARKER`,
`VBLANK_RATE`, and `MIN_DELAY_CYCLES` constants. The class has no live caller:
`new SoundDriver(` appears only in `test/synth/SoundDriver.test.ts`, every
`src/` import of the module is `import type`, and live playback runs through
`useSequencerIntegration` and `utils/playback/` while assembly export runs
through `src/exports/asm.ts`. The only value import outside the dead pipeline
is `VBLANK_RATE` in three export tests, duplicating `DEFAULT_SONG_FRAME` from
`src/constants/song.ts`.

Two sibling modules are dead for the same reason. `src/synth/EventOptimizer.ts`
is consumed only by the dead `convertSongToSoundEvents`, and
`src/synth/SequencerEngine.ts` is an unreferenced stub whose `processFrame`
body is a "will be implemented later" placeholder.

A secondary duplication crosses the Rule-of-Three threshold: the four-line
even-speed normalization idiom (`Number`, `floor` with default 6, `max(2)`,
`& ~1`) is repeated verbatim in `src/utils/song/songParser.ts`,
`src/exports/asm.ts`, and `src/hooks/song/useSongManagement.ts`.

## Goal

`src/synth/` contains only live code: `YM2149.ts` plus a types-only
`SoundDriver.ts` holding the `Song`, `Pattern`, `Step`, `Note`, `Line`, and
`Instrument` interfaces at their existing import path. `EventOptimizer.ts` and
`SequencerEngine.ts` are removed together with their dedicated tests, and the
`VBLANK_RATE`/`DEFAULT_SONG_FRAME` constant duplication collapses onto
`src/constants/song.ts`. The even-speed idiom lives once as
`normalizeSongSpeed` in a new `src/utils/song/songSpeed.ts`, reused by the
three identical sites. The `InformationPanel` inline clamp keeps its distinct
no-default contract and is not converted.

## Plan

1. Update `ARCHITECTURE.md` and `SPECIFICATION.md` so the documented playback
   path and data-model references match the tree being produced.
2. Tidy `src/synth/SoundDriver.ts`: delete the `SoundDriver` class, the
   `SoundEvent` interface, and the four DOSOUND constants, leaving the six
   model interfaces untouched at the same path so every type-import site is
   unchanged. Repoint the three `VBLANK_RATE` test imports
   (`exportWav`, `exportMax`, `exportVgm`) to `DEFAULT_SONG_FRAME` from
   `src/constants/song.ts`.
3. Delete `src/synth/EventOptimizer.ts`, `src/synth/SequencerEngine.ts`,
   `test/synth/SoundDriver.test.ts`, `test/synth/EventOptimizer.test.ts`, and
   `test/synth/SequencerEngine.test.ts`.
4. Extract `normalizeSongSpeed` into `src/utils/song/songSpeed.ts` and route
   `songParser.ts`, `asm.ts`, and `useSongManagement.ts` through it; add
   `test/utils/song/songSpeed.test.ts`.
5. Run the full verification loop.

## Risk

Low. Every deleted symbol is provably unreferenced in `src/`; the surviving
interfaces keep their module path so no import specifier changes. The
`normalizeSongSpeed` extraction is a verbatim lift of an identical idiom, so
parsed songs, restored songs, and the assembly step cap produce identical
values. The main regression surface is a missed `import type` or test-only
value import, which `npx tsc -b` catches immediately. `InformationPanel.tsx`
keeps its own variant because its input is pre-guarded and lacks the
default-6 fallback - merging it would change the accepted range.

## Acceptance Criteria

- No `SoundDriver`, `EventOptimizer`, or `SequencerEngine` runtime code
  remains; all `src/` imports of `synth/SoundDriver.ts` are type-only and
  resolve against the slimmed module.
- Identical behaviour: parsed, restored, and exported songs carry the same
  `speed` values, and export fixtures produce byte-identical output.
- Typecheck, lint, build, and the test suite all pass with zero warnings;
  the suite loses only the three deleted dead-code test files and gains the
  `songSpeed` unit test.
