# 1.4.3 Refactoring Proposal

## Problem

The 1.4.3 window made `normalizeInstrumentId` the canonical instrument-id contract, but it lives in `src/utils/playback/playbackUtils.ts` while twelve of its thirteen importers are non-playback files - `utils/instrument`, `utils/track`, `utils/song`, and several hooks all reach into the playback domain for an instrument-id helper, a backwards domain edge.

Inside `src/utils/instrument/instrumentOperations.ts`, three functions (`countInstrumentUsage` line 32, `clearInstrumentAndNotes` line 229, `clearInstrumentOnly` line 309) accept `normalizeInstrumentId` as an injected parameter that shadows the module-level import every caller already passes - dependency-injection dead weight from an earlier decomposition.

Two small leftovers complete the picture: `test/components/FilePickerModal.test.tsx` tests a component in `src/modals/` while its nine sibling modal tests now live in `test/modals/` - the only violation of the `test/` to `src/` domain-mirror convention - and two dead annotations remain: a dead `normalizeInstrumentId` dep-array entry in `useTransposeDialog.ts` (line 146, file disables exhaustive-deps) and a stale `// added dependency` comment in `useSequencerIntegration.ts` (line 536).

Files to be touched:

- `src/utils/playback/playbackUtils.ts`, `src/utils/instrument/instrumentSelection.ts`, `src/utils/instrument/instrumentOperations.ts`
- Thirteen import sites of `normalizeInstrumentId` across `src/` plus `test/utils/instrument/instrumentOperations.test.ts`
- `src/hooks/instrument/useInstrumentActions.ts` (three call sites)
- `test/components/FilePickerModal.test.tsx`, `src/hooks/modal/useTransposeDialog.ts`, `src/hooks/sequencer/useSequencerIntegration.ts`

## Goal

`normalizeInstrumentId` lives in `src/utils/instrument/instrumentSelection.ts` beside `formatInstrumentSlotId` and `stepInstrumentId` - the instrument domain owns the instrument-id contract. `playbackUtils.ts` keeps `updateChannelWithInstrument` and imports the normalizer. `instrumentOperations.ts` calls the module binding directly with no shadowing parameters. `test/modals/` holds every modal test. No dead dep entries or stale annotations remain. Behavior is identical at every step.

## Plan

**Tidy the modal test mirror and dead annotations**

Move `test/components/FilePickerModal.test.tsx` to `test/modals/FilePickerModal.test.tsx` (same-depth move, its `../../src/modals/FilePickerModal.tsx` specifier still resolves). Delete the dead `normalizeInstrumentId` dep-array entry in `useTransposeDialog.ts` and the stale comment in `useSequencerIntegration.ts`. Zero-behavior tidy, verified by the suite alone.

**Relocate the canonical normalizer**

Move the `normalizeInstrumentId` body from `playbackUtils.ts` into `instrumentSelection.ts`, which already imports it. Repoint all thirteen specifiers: `App.tsx`, `useSequencerIntegration.ts`, `useSongManagement.ts`, `useDataManagement.ts`, `useTransposeDialog.ts`, `useInstrumentManagement.ts`, `useInstrumentActions.ts` (if present), `playbackSimulation.ts`, `instrumentOperations.ts`, `instrumentIO.ts`, `trackRendering.ts`, `trackClipboard.ts`, `songParser.ts`, and `playbackUtils.ts` itself (which keeps `updateChannelWithInstrument` and needs the normalizer locally). Strip the now-dead `Formatter` and branded-type imports from `playbackUtils.ts`. Move the `describe('normalizeInstrumentId')` block from `instrumentOperations.test.ts` into a new `test/utils/instrument/instrumentSelection.test.ts`.

**De-inject the normalizer in instrumentOperations**

Drop the shadowing `normalizeInstrumentId` parameter from `countInstrumentUsage`, `clearInstrumentAndNotes`, and `clearInstrumentOnly` - the functions call the module binding. Update the three call sites in `useInstrumentActions.ts` and the six test call sites in `instrumentOperations.test.ts`. The hook keeps its own direct uses of the function; removing it from the hook's args object is deferred because it would break the typed-parameter-object convention for orchestration hooks.

## Risk

All three steps are import-specifier and signature mechanics enforced by `tsc -b`. The normalizer's eight-case contract block moves intact, so no new characterization tests are needed - `instrumentOperations.test.ts` already pins all three de-injected functions. `playbackSimulation.ts` feeds the export paths, but only its import specifier changes, so `src/exports` byte-identity is unaffected. The audio-critical surfaces are untouched: no hook dependency arrays, prop mirroring, or memoization patterns change - the only dep-array edit removes a dead module-binding entry in a file that disables the rule anyway.

Out of scope: merging `instrumentLookup` with `instrumentsById` (divergent duplicate-key semantics), `TransposeOptions.normalizeInstrumentId` (deliberate stub contract in tests), a `normalizePatternId` helper (below Rule of Three confidence), the `yamlUtils` quote-strip (recorded in `FUTURE.md`), and all audio-critical patterns.

## Acceptance Criteria

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, and `npm test` all pass with zero errors and zero warnings.
- `test/exports/` output stays byte-identical for the supplied fixtures.
- No `normalizeInstrumentId` import specifier still points at `utils/playback` outside `playbackUtils.ts` itself.
- `test/modals/` holds every modal test file and `test/components/` holds only `src/components/` mirrors.
- No regression against the `vitest.config.ts` coverage thresholds.
