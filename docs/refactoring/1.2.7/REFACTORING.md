# DOSOUND Tracker v1.2.7 - Refactoring Proposal

## Problem

The v1.2.7 implementation cycle introduced dynamic replay rate and chip clock support across the playback path, preview timers, and all export formats. The resulting code contains several duplications and structural issues that crossed the Rule-of-Three threshold during this cycle. The analysis below covers `src/hooks/`, `src/utils/`, `src/exports/`, `src/components/`, and `src/App.tsx`.

**Off-limits areas**

The following modules are strictly excluded from this refactoring because accurate playback timing is the highest priority:

- `src/synth/YM2149.ts` - chip emulation and register manipulation
- `src/synth/SoundDriver.ts` - audio event processing
- `src/synth/SequencerEngine.ts` - pattern processing and timing
- `src/synth/EventOptimizer.ts` - audio optimization
- `src/workers/sequencerWorker.ts` - real-time timing cycles
- All envelope processing used by audio generation
- All code executing within the frame-rate tick cycle

**Duplicated patterns**

Five patterns have crossed the Rule-of-Three threshold:

1. **Timer clear pattern** (16 occurrences across 6 files): `if (ref.current !== null) { window.clearInterval(ref.current); ref.current = null; }` repeated in `useInstrumentActions.ts`, `useMidiActions.ts`, `useMessageSystem.ts`, `App.tsx`, `HeaderPanel.tsx`, `TrackPanel.tsx`.

2. **localStorage init+persist pattern** (40 localStorage calls across 8 files): `useState(() => { try { localStorage.getItem(key) } catch { default } })` paired with `useEffect(() => { try { localStorage.setItem(key, value) } catch {} })` in `useAppState.ts`, `useTheme.ts`, `useInstrumentWarnings.ts`, `useMidi.ts`, `App.tsx`, `useSongManagement.ts`, `uiStore.ts`, `useMidiMessageProcessing.ts`.

3. **Pitch delta formatting** (6 occurrences in `asm.ts`): `delta ? \` ${delta > 0 ? '+' : ''}${delta}\` : ''` repeated at lines 131, 135, 209, 213, 507, 558.

4. **Instrument preview export pattern** (3 occurrences): `buildInstrumentPreviewSong(instrument, song); return exportSongToFormat(previewSong)` in `vgm.ts:308`, `max.ts:268`, `wav.ts:175`.

5. **Empty instrument creation** (3 occurrences): zero-filled envelope arrays constructed inline in `instrumentOperations.ts:23`, `instrumentPanelUtils.ts:4`, and `useDataManagement.ts:143`.

**Thin wrapper files**

Two files are trivial wrappers that add no value:

- `hexFormatting.ts` (5 lines) - wraps `Formatter.hex`
- `valueFormatting.ts` (6 lines) - wraps `Formatter.envelopeValue`

**Obvious comments**

46 comments across `src/hooks/`, `src/utils/`, and `src/components/` restate code, mark sections redundantly, or reference now-dynamic values with hardcoded descriptions. Examples: `// Clone lines to avoid mutation` before a spread, `// Instrument section` inside `InstrumentSection.tsx`, `// 1. Device Management` section markers in `useMidi.ts`.

**Efficiency issues**

- `envelopeUtils.ts:7-9,32-34` - double iteration (`map` then `filter`) that can be a single `reduce`
- `useMidiMessageProcessing.ts:60` - `Array.from(event.data)` allocates on every MIDI message
- `useMidiMessageProcessing.ts:70-72,265-267` - `data.map(...).join(' ')` allocates intermediate array for hex formatting on every MIDI message
- `transposeUtils.ts:101` - maps all patterns even when only a subset is transposed
- `instrumentOperations.ts:43` - `forEach` with no early exit when usage is already confirmed

## Goal

After this refactoring:

- A `clearIntervalRef` utility eliminates all 16 timer-clear duplications
- A `useLocalStorageState` hook eliminates the localStorage init+persist boilerplate
- A `formatPitchDelta` function in `exports/core.ts` consolidates the 6 asm.ts duplications
- A generic `exportInstrumentWith` wrapper in `exports/core.ts` consolidates the 3 instrument preview export patterns
- A single `createEmptyInstrument` factory replaces the 3 inline constructions
- `hexFormatting.ts` and `valueFormatting.ts` are deleted; call sites use `Formatter` directly
- 46 obvious comments are removed
- 5 efficiency hotspots are optimized without changing behaviour
- All export outputs remain byte-identical for existing fixtures
- All 207 tests pass without modification

## Plan

**Remove obvious comments**

Delete comments that restate code, mark sections redundantly, or reference now-dynamic hardcoded values.

Files to modify:

- `src/components/InstrumentSection.tsx`
- `src/components/PlaylistHeader.tsx`
- `src/components/SongSection.tsx`
- `src/components/TrackerSection.tsx`
- `src/hooks/useMidi.ts`
- `src/hooks/useMidiDeviceManagement.ts`
- `src/hooks/useMidiActions.ts`
- `src/hooks/useSequencer.ts`
- `src/hooks/useSequencerIntegration.ts`
- `src/hooks/useStorage.ts`
- `src/utils/instrumentOperations.ts`
- `src/utils/patternUtils.ts`
- `src/utils/playbackSimulation.ts`
- `src/utils/songFormat.ts`
- `src/utils/songParser.ts`
- `src/utils/songIO.ts`
- `src/utils/trackClipboard.ts`
- `src/utils/trackRendering.ts`
- `src/utils/validation.ts`

Do not remove comments inside `src/synth/` or `src/workers/`. Do not remove comments that explain non-obvious timing decisions or audio-critical constraints.

**Delete thin wrapper files**

Remove `src/utils/hexFormatting.ts` and `src/utils/valueFormatting.ts`. Update all 7 import sites to use `Formatter` directly from `formatters.ts`.

Files to modify:

- `src/utils/hexFormatting.ts` (delete)
- `src/utils/valueFormatting.ts` (delete)
- All files importing from these two modules

**Extract clearIntervalRef utility**

Create `src/utils/timerUtils.ts` with:

```typescript
export function clearIntervalRef(
  ref: { current: number | null }
): void {
  if (ref.current !== null) {
    window.clearInterval(ref.current);
    ref.current = null;
  }
}
```

Replace all 16 inline timer-clear blocks across:

- `src/hooks/useInstrumentActions.ts` (2 sites)
- `src/hooks/useMidiActions.ts` (5 sites)
- `src/hooks/useMessageSystem.ts` (3 sites)
- `src/App.tsx` (2 sites)
- `src/components/HeaderPanel.tsx` (2 sites)
- `src/components/TrackPanel.tsx` (2 sites)

Add unit test for `clearIntervalRef`.

**Extract useLocalStorageState hook**

Create `src/hooks/useLocalStorageState.ts` with a generic hook that handles init from localStorage and persistence via useEffect. The hook must accept a key, default value, and optional parser/serializer.

Migrate call sites in:

- `src/hooks/useAppState.ts` (8 states)
- `src/hooks/useTheme.ts` (1 state)
- `src/hooks/useInstrumentWarnings.ts` (1 state)

Do not migrate `useMidi.ts` or `useMidiMessageProcessing.ts` in this step — their localStorage access includes migration logic and debug-mode reads that are not simple init+persist patterns. Those remain as-is.

Add unit test for `useLocalStorageState`.

**Extract formatPitchDelta to exports/core.ts**

Add to `src/exports/core.ts`:

```typescript
export function formatPitchDelta(delta: number): string {
  return delta ? ` ${delta > 0 ? '+' : ''}${delta}` : '';
}
```

Replace all 6 occurrences in `src/exports/asm.ts` (lines 131, 135, 209, 213, 507, 558).

Add unit test verifying positive, negative, and zero deltas.

**Extract exportInstrumentWith wrapper to exports/core.ts**

Add to `src/exports/core.ts`:

```typescript
export function exportInstrumentWith<T>(
  instrument: Instrument,
  song: Song,
  exporter: (song: Song) => T
): T {
  const previewSong = buildInstrumentPreviewSong(instrument, song);
  return exporter(previewSong);
}
```

Replace the 3 instrument export functions in `vgm.ts`, `max.ts`, `wav.ts` to use this wrapper.

Verify byte-identical output against existing export test fixtures.

**Consolidate createEmptyInstrument**

Delete `createClearedInstrument` from `instrumentOperations.ts`. Update `instrumentPanelUtils.ts` `createEmptyInstrument` to accept an optional `InstrumentId` parameter so it can serve all 3 call sites. Update `useDataManagement.ts` to use the shared factory.

Add unit test for `createEmptyInstrument` with and without explicit slot ID.

**Optimize envelopeUtils double iteration**

Replace the `map().filter()` pattern in `expandEnvelope` and `expandLoopingEnvelope` with a single `reduce` that filters and converts in one pass.

Files to modify: `src/utils/envelopeUtils.ts`.

Verify existing `songParser.test.ts` and `instrumentIO.test.ts` still pass.

**Optimize MIDI message hex formatting**

In `useMidiMessageProcessing.ts`, replace `Array.from(event.data)` with direct `Uint8Array` indexing. Replace `data.map(...).join(' ')` with a pre-allocated string concatenation loop.

Files to modify: `src/hooks/useMidiMessageProcessing.ts`.

This is a hot path — every MIDI message triggers this code. The optimization reduces per-message allocations.

**Optimize transposeUtils pattern filtering**

In `transposeUtils.ts:101`, filter `song.pattern` to only patterns referenced by the transposed track before mapping. This avoids mapping all patterns when only a subset is affected.

Files to modify: `src/utils/transposeUtils.ts`.

**Optimize instrumentOperations early exit**

In `instrumentOperations.ts:43`, replace `forEach` with `some()` to enable early exit when instrument usage is confirmed.

Files to modify: `src/utils/instrumentOperations.ts`.

## Risk

**Audio timing regression**

The `clearIntervalRef` extraction touches timer-clear blocks in `useMidiActions.ts` and `useInstrumentActions.ts` which are audio-critical paths. The extraction is a pure rename — the function body is identical to the inline code. No dependency arrays, memoization, or timing patterns change.

**Export output regression**

The `formatPitchDelta` and `exportInstrumentWith` extractions touch `exports/asm.ts`, `exports/vgm.ts`, `exports/max.ts`, `exports/wav.ts`. The existing export tests (`exportVgm.test.ts`, `exportMax.test.ts`, `exportWav.test.ts`, `exportAssemblyOptimized.test.ts`) verify byte-identical output. These tests must pass unchanged after refactoring.

**localStorage state regression**

The `useLocalStorageState` hook changes how 10 state values are initialized and persisted. The existing `useMidi.test.tsx`, `useDataManagement.test.ts`, and `uiStore.test.ts` tests cover localStorage-dependent state. These must pass unchanged.

**Thin coverage areas**

`envelopeUtils.ts` has no direct unit tests — it is tested indirectly through `songParser.test.ts` and `instrumentIO.test.ts`. The double-iteration optimization must preserve identical output for all envelope expansion cases.

## Acceptance Criteria

- All 207 existing tests pass without modification
- Export output is byte-identical for all test fixtures (`song-vgm-tone.yaml` and related fixtures)
- `npm run typecheck` passes with zero errors
- `npm run lint` passes with zero errors and zero warnings
- `npm run build` succeeds
- No new files are created in `src/synth/` or `src/workers/`
- No existing comments in `src/synth/` or `src/workers/` are modified
- `hexFormatting.ts` and `valueFormatting.ts` are deleted
- The `clearIntervalRef` utility is used at all 16 timer-clear sites
- The `useLocalStorageState` hook is used at all migrated localStorage sites
- `formatPitchDelta` is used at all 6 pitch-delta formatting sites in `asm.ts`
- `exportInstrumentWith` is used in `vgm.ts`, `max.ts`, and `wav.ts` instrument export functions
- `createClearedInstrument` is deleted from `instrumentOperations.ts`
- `envelopeUtils.ts` uses single-pass iteration for both expand functions
- `useMidiMessageProcessing.ts` does not call `Array.from()` on MIDI message data
