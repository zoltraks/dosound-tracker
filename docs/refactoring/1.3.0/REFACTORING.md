# Window 1.3.0 Refactoring Proposal

## Problem

The volume-nibble clamp `Math.max(0, Math.min(0x0f, …))` is written out inline at twelve
sites across eleven files, in three truncation dialects (`| 0`, `Math.floor`, and none for
already-integral inputs). The duplication is past the Rule of Three several times over, and
each new site re-decides how out-of-range and fractional input is coerced.

Sites carrying the truncating form:

- `src/utils/playbackSimulation.ts` (lines 222, 357)
- `src/utils/trackUtils.ts` (line 20)
- `src/utils/songIO.ts` (line 163)
- `src/utils/songParser.ts` (lines 93, 108)
- `src/utils/trackClipboard.ts` (lines 51, 288)
- `src/utils/trackPanelUtils.ts` (line 74, integral input via `parseInt`)
- `src/exports/asm.ts` (line 348)
- `src/components/TrackLine.tsx` (line 45)
- `src/hooks/useMidiHandling.ts` (line 139, input already truncated)
- `src/hooks/useSequencerIntegration.ts` (lines 243, 392, 427)
- `src/synth/SoundDriver.ts` (`clampVolume`, `Math.floor` form)

Files the refactoring touches: the eleven above plus the new `src/utils/volumeUtils.ts` and
its test.

## Goal

A single `clampVolumeNibble(value)` helper in `src/utils/volumeUtils.ts` implements
`Math.max(0, Math.min(0x0f, Math.trunc(value)))`, matching the dominant `| 0` dialect.
`Math.trunc` and `| 0` agree for every input magnitude seen here, and `Math.floor` differs
only on negative fractions, which both forms clamp to `0` - so the consolidation is
behaviour-preserving at every migrated site.

Two sites keep their inline form deliberately: `playbackSimulation.ts` line 349 clamps
`volumeEnv[volIdx] || 0` without truncation and migrating would alter fractional input, and
`SoundDriver.clampVolume` keeps its non-finite guard that defaults to `0x0f` while delegating
the numeric clamp to the helper.

## Plan

**Add the shared helper**

Create `src/utils/volumeUtils.ts` with `clampVolumeNibble` and `test/utils/volumeUtils.test.ts`
covering integral input, out-of-range values, fractional input, and negative fractions.

**Migrate the pure utilities**

Replace inline clamps in `trackUtils.ts`, `songIO.ts`, `songParser.ts` (two sites),
`trackClipboard.ts` (two sites), and `trackPanelUtils.ts`.

**Migrate components, exports, and non-audio hooks**

Replace inline clamps in `TrackLine.tsx`, `asm.ts`, and `useMidiHandling.ts` (folding its
pre-truncation into the call).

**Migrate the audio-path sites**

Replace inline clamps in `playbackSimulation.ts` (lines 222 and 357 only) and
`useSequencerIntegration.ts` (three sites), and delegate the numeric clamp inside
`SoundDriver.clampVolume`. Pure function calls only - no hook, dependency-array, or
state-flow changes, so audio timing is unaffected.

## Risk

Low. The helper is a pure function; every migrated site used an equivalent clamp. The
deferred sites (`playbackSimulation.ts:349`, and the `SoundDriver.clampVolume` guard) are the
only places semantics could drift, and they are handled explicitly. Export output is exercised
by the fixture tests, which must stay byte-identical.

## Acceptance Criteria

- Zero remaining inline `Math.max(0, Math.min(0x0f, …))` volume clamps at migrated sites.
- `npm test` passes with the new `volumeUtils` suite included.
- Export fixture tests pass with byte-identical output.
- The full verification loop is clean: typecheck, lint, format, build, test.
