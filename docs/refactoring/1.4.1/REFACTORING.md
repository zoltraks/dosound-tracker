# Refactoring Proposal - 1.4.1

## Problem

Three leftover surfaces surfaced while the window's records landed.

- The MIDI channel and program clamps are inlined at eight guarded sites:
  `Math.max(1, Math.min(16, Math.floor(v)))` and
  `Math.max(0, Math.min(127, Math.floor(v)))` repeat across
  `songParser.ts` (channel and program in the number and string
  branches), `songIO.ts`, and `InstrumentMidiModal.tsx`. The codebase
  already centralizes domain clamps (`clampVolumeNibble`, `clampOctave`)
  in the owning `utils/` domain, but `midi/` has none.
- `trackClipboard.ts` carries ~34 lines of stale narrative comments in
  `applyClipboardToLines` narrating removed `trackA`/`trackB`/`trackC`
  fields that the single-track model no longer has, plus a local
  `quoteNoteValues` helper duplicating `quoteYamlValues(text, 'note')`
  from `yaml/yamlUtils.ts` - the shared helper songIO already uses.
- `transposeUtils.performTranspose` and `patternUtils`
  `insertPatternStep`/`deletePatternStep` are pure, branch-dense
  functions with zero dedicated tests - index shifting, scope
  combinations, and clip counters are all uncharacterized.

Seen but not planned: the run-length _compression_ logic in
`trackClipboard.ts` and `songIO.ts` is near-verbatim at only two sites,
so the Rule of Three holds back a shared `compressRunNodes` for now;
and `songIO.ts` writes the untrimmed `title`/`author` while checking the
trimmed value - a behaviour question, deferred to a change record under
a later window.

## Goal

- `clampMidiChannel` and `clampMidiProgram` in
  `src/utils/midi/midiUtils.ts`, with the eight guarded sites calling
  them and the `Number.isFinite` guards staying local.
- `trackClipboard.ts` free of archaeology comments and reusing the
  shared YAML quoter.
- Characterization tests pinning the current transpose and
  insert/delete-step semantics so future structural work has a floor.

## Plan

**Drop the stale paste-mode comments**

Delete the ~34-line narrative block inside `applyClipboardToLines`
that documents the removed multi-track fields. No code moves.

File to modify: `src/utils/track/trackClipboard.ts`.

**Reuse the shared YAML quoter**

Replace the local `quoteNoteValues` with
`quoteYamlValues(text, 'note')` and remove the helper. The shared
function additionally escapes `\` and `"`, which note values
(`C-4`-style) can never contain - output is identical on the real
domain.

File to modify: `src/utils/track/trackClipboard.ts`.

**Extract the MIDI clamp helpers**

Add `clampMidiChannel` and `clampMidiProgram` beside
`MAX_MONITOR_ENTRIES` in `midiUtils.ts`, then replace the eight
inlined sites. The `| 0`-truncation sites in the live-MIDI hooks stay
as they are - `NaN | 0` and `Math.floor(NaN)` diverge, so unifying them
would be a behaviour change.

File to modify: `src/utils/midi/midiUtils.ts`,
`src/utils/song/songParser.ts`, `src/utils/song/songIO.ts`,
`src/modals/InstrumentMidiModal.tsx`.

```typescript
export const clampMidiChannel = (value: number): number =>
  Math.max(1, Math.min(16, Math.floor(value)));

export const clampMidiProgram = (value: number): number =>
  Math.max(0, Math.min(127, Math.floor(value)));
```

**Characterize the transpose and pattern utils**

Add `test/utils/transpose/transposeUtils.test.ts` and
`test/utils/pattern/patternUtils.test.ts` pinning current semantics:
scope/track/instrument filtering, `'==='` skip, clip counters, index
clamping, and end-of-pattern shift behaviour. Characterization only -
the tests document what the code does today.

File to add: `test/utils/transpose/transposeUtils.test.ts`,
`test/utils/pattern/patternUtils.test.ts`.

## Risk

Low. The comment and quoter items are Tidy with identical output; the
clamp extraction is mechanical against guarded inputs; the tests add
coverage without touching source. The full suite plus typecheck is the
regression gate. Audio paths are untouched - the `| 0` MIDI sites stay
local by design.

## Acceptance Criteria

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`,
  `npm test` all pass with zero errors and zero warnings.
- Export output unchanged: the clamp helpers return identical values on
  every guarded input, and no `src/exports/` file is edited.
- Clipboard YAML output byte-identical for the documented fixtures.
- New characterization tests pass and raise coverage on the two
  previously untested modules.
