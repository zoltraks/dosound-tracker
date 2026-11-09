# YAML Coercion and Loader Hygiene Refactoring Proposal

## Problem

The YAML load path repeats one idiom seven times - accept a finite `number`, or a non-empty `string` that trims to a finite `Number()`, else fall back - each copy followed by local floor or clamp math. Two formatter methods have no non-test callers, three emitters duplicate the same `yaml.dump` options object, and two loaders construct the note-off literal inline instead of calling the existing factory.

Files touched: `src/utils/song/songParser.ts`, `src/utils/instrument/instrumentIO.ts`, `src/utils/yaml/yamlUtils.ts`, `src/utils/format/formatters.ts`, `src/utils/song/songIO.ts`, `src/utils/track/trackClipboard.ts`, `src/utils/track/trackPanelUtils.ts` (read only), `src/utils/midi/midiConfiguration.ts`, plus the matching test files.

The analysis surveyed `docs/FUTURE.md`, the 1.4.1 assessment deferrals, and all of `src/utils/`, then verified every cited site against the tree.

## Goal

`coerceYamlNumber(value: unknown): number | null` lives once in `src/utils/yaml/yamlUtils.ts` and every loader site calls it, keeping its local floor, clamp, and default math. `Formatter.instrumentId` and `Formatter.instrumentSlot` are gone. Three emitters share one dump-options constant. Note-off construction goes through `createNoteOff()`.

## Findings

**Issue**

Seven near-verbatim copies of the number-or-numeric-string coercion. `src/utils/song/songParser.ts` holds five: `loop` (lines 182-194), instrument `octave` (lines 347-360), `sustain` (lines 376-394), `midi.channel` and `midi.program` (lines 404-430). `src/utils/instrument/instrumentIO.ts` holds two: `octave` (lines 130-143) and `sustain` (lines 145-163). Representative fragment:

```typescript
if (typeof rawLoop === 'number' && Number.isFinite(rawLoop)) {
  loop = Math.max(0, Math.floor(rawLoop));
} else if (typeof rawLoop === 'string') {
  const trimmed = rawLoop.trim();
  if (trimmed) {
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      loop = Math.max(0, Math.floor(parsed));
    }
  }
}
```

**Impact**

Seven copies of one parsing rule drift independently - a future fix to string handling must be made seven times and can silently land in only some. Roughly 45 duplicated lines.

**Recommendation**

Extract `coerceYamlNumber(value: unknown): number | null` into `src/utils/yaml/yamlUtils.ts` beside `quoteYamlValues` and `expandRunNodes`. The helper returns the finite number, or `null` for anything else - floor, clamp, and default math stay at each call site because they differ per field. The `year` parse at `songParser.ts:178` uses bare `Number()` with different semantics (`null` coerces to 0) and stays untouched.

**Risk Level**

Minor

**Breaking Change Assessment**

No Breaking Change

**Example**

Before: the `loop` fragment above.
After:

```typescript
const coercedLoop = coerceYamlNumber(songNode.loop);
if (coercedLoop !== null) {
  loop = Math.max(0, Math.floor(coercedLoop));
}
```

**Issue**

`Formatter.instrumentId` and `Formatter.instrumentSlot` at `src/utils/format/formatters.ts:86-113` have zero non-test callers - only `test/utils/format/formatters.test.ts:72-95` exercises them. `formatInstrumentSlotId` in `src/utils/instrument/instrumentSelection.ts` is the live equivalent.

**Impact**

Dead public surface invites misuse - `instrumentSlot` emits `INST 0F` while the rest of the UI uses bare slot ids.

**Recommendation**

Delete both methods and their describe blocks, matching the 1.3.9 dead-export removal precedent.

**Risk Level**

Suggestion

**Breaking Change Assessment**

No Breaking Change

**Example**

Before: `static instrumentSlot(slotIndex: number): string { return \`INST ${...}\`; }`
After: method and test block removed.

**Issue**

`{ indent: 2, lineWidth: -1, quotingType: '"' }` is byte-identical at three emitters: `src/utils/song/songIO.ts:295-299`, `src/utils/track/trackClipboard.ts:128-132`, `src/utils/midi/midiConfiguration.ts:37-41`.

**Impact**

A canonical-options change would have to be made in three places - the fourth emitter `instrumentIO.ts:77-81` deliberately differs (`flowLevel: 2`, no `quotingType`) and stays as is.

**Recommendation**

Export `YAML_DUMP_OPTIONS` from `src/utils/yaml/yamlUtils.ts` and spread it at the three identical sites.

**Risk Level**

Suggestion

**Breaking Change Assessment**

No Breaking Change

**Example**

Before: `yaml.dump(exportData, { indent: 2, lineWidth: -1, quotingType: '"' })`
After: `yaml.dump(exportData, YAML_DUMP_OPTIONS)`

**Issue**

The note-off literal `{ note: '===', octave: 0, instrument: '00' }` is constructed inline at `src/utils/song/songParser.ts:271-276` and `src/utils/track/trackClipboard.ts:214` while `createNoteOff()` at `src/utils/track/trackPanelUtils.ts:64` returns the same object.

**Impact**

Two more places that can drift from the canonical key-release shape.

**Recommendation**

Call `createNoteOff()` at both sites.

**Risk Level**

Suggestion

**Breaking Change Assessment**

No Breaking Change

**Example**

Before: `line.note = { note: '===', octave: 0, instrument: '00' };`
After: `line.note = createNoteOff();`

## Plan

**Remove dead formatter methods**

Delete `Formatter.instrumentId` and `Formatter.instrumentSlot` from `src/utils/format/formatters.ts` and their two describe blocks from `test/utils/format/formatters.test.ts`. Tidy step - addresses the dead-export finding.

**Add the coercion helper**

Add `coerceYamlNumber` to `src/utils/yaml/yamlUtils.ts` with unit tests in `test/utils/yaml/yamlUtils.test.ts` covering finite numbers, numeric strings, padded strings, empty and whitespace strings, non-numeric strings, `null`, `undefined`, and non-finite numbers. No call sites change yet.

**Migrate songParser sites**

Rewrite the five coercion blocks in `src/utils/song/songParser.ts` (loop, instrument octave, sustain, midi channel, midi program) to call `coerceYamlNumber`, keeping each site's post-processing.

**Migrate instrumentIO sites**

Rewrite the two coercion blocks in `src/utils/instrument/instrumentIO.ts` (octave, sustain) to call `coerceYamlNumber`.

**Share the dump options constant**

Export `YAML_DUMP_OPTIONS` from `src/utils/yaml/yamlUtils.ts` and use it at `songIO.ts`, `trackClipboard.ts`, and `midiConfiguration.ts`. `instrumentIO.ts` keeps its own options.

**Deduplicate note-off construction**

Replace the inline literals at `songParser.ts` and `trackClipboard.ts` with `createNoteOff()` imported from `src/utils/track/trackPanelUtils.ts`.

## Step Granularity

The tidy step (dead exports) runs first and touches no file the structural steps touch. The helper lands before any call site migrates, and the two loader migrations are separate steps so a regression localizes to one file. Lint runs after every step to catch orphaned imports - the targeted loop runs after each file's migration.

## Risk

The load path is the only surface at risk: a mis-migrated site could change accepted input shapes. `test/utils/song/songParser.test.ts`, `songParserGaps.test.ts`, `test/utils/instrument/instrumentIO.test.ts`, and `branchGaps.test.ts` pin the string/number/garbage input matrix with ~45 cases. The dump-options and note-off steps are pinned by the songIO, trackClipboard, and midiConfiguration suites. No audio-path, hook, `src/synth/`, or `src/exports/` code is touched.

## Acceptance Criteria

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, and `npm test` pass with zero errors and zero warnings.
- `yaml.load(parseSongFromYaml(x))` output is identical for the same input across the migration, proven by the unchanged parser and serializer suites.
- Saved-song, clipboard, and MIDI-configuration YAML bytes are unchanged for the same inputs.
- Coverage stays at or above the `vitest.config.ts` thresholds.
