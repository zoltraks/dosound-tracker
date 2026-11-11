# Upgrade js-yaml to 5 Implementation Plan

## Summary

| Field         | Value                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Intent        | Land `js-yaml` 5.x behind a new emitted-bytes equivalence harness -   |
|               | the upgrade proceeds only when every emitter produces byte-identical  |
|               | output                                                                |
| Key decisions | Golden emitted files under `test/fixtures/emission/` pin the exact    |
|               | text each YAML saver produces; a Vitest case compares emitted strings |
|               | against them                                                          |
| Open risks    | none - the harness passed byte-identically on `js-yaml` 5.5.0 after   |
|               | the `quotingType` to `quoteStyle` migration                           |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.3/upgrade-js-yaml-5.md`.

## Problem

`js-yaml` 4.3.2 is pinned in `package.json`. A prior 5.5.0 attempt reverted
because emitted song and instrument YAML drifted and 77 suite cases failed
(archived under `docs/archive/change/1.3.6/dependency-upgrade-majors.md`).
The suite asserts parsed values in most places, so it does not prove the
emitted text itself is stable.

Emitted YAML is a file-format contract: the same in-memory data must
produce the same bytes. The upgrade therefore needs a gate that pins the
emitted text, built and proven on 4.3.2 before the bump runs.

## Analysis

Every `yaml.dump` call site and its post-processing.

- `src/utils/song/songIO.ts` - `buildSongYamlForExport` dumps with
  `YAML_DUMP_OPTIONS` (`indent: 2`, `lineWidth: -1`, `quotingType: '"'`),
  then post-processes: flow-compression of the five envelope keys,
  `quoteYamlValues` on `A`/`B`/`C`, `note`, `base`, `number`, and `color`,
  a dedicated `title` quoting pass, and a separately dumped `stereo` node
  spliced ahead of `line:`.
- `src/utils/instrument/instrumentIO.ts` - `buildInstrumentYamlForExport`
  dumps with `indent: 2`, `lineWidth: -1`, `flowLevel: 2`, default quoting,
  then `quoteYamlValues` on `base`, `name`, and `color`.
- `src/utils/settings/settingsYaml.ts` - `buildSettingsYaml` dumps with
  `YAML_DUMP_OPTIONS`, no post-processing.
- `src/utils/midi/midiConfiguration.ts` - `buildMidiConfigurationYaml`
  dumps with `YAML_DUMP_OPTIONS`, no post-processing.
- `src/utils/track/trackClipboard.ts` - `generateClipboardData` dumps
  with `YAML_DUMP_OPTIONS`, then `quoteYamlValues` on `note`.

`js-yaml` 5.5.0 (published 2026-10-15, more than seven days before this
run) is the latest 5.x line. It bundles its own `dist/js-yaml.d.ts`
types, so `@types/js-yaml` is removed in the same change.

Two API breaks in the 5.x line needed adaptation, both outside the emit
surface:

- The default export is gone - every `import yaml from 'js-yaml'`
  becomes `import * as yaml from 'js-yaml'`, keeping the `yaml.dump` and
  `yaml.load` call sites unchanged.
- `quotingType` no longer exists in the dump options - it was silently
  ignored under 5.x (the `as const` object escapes excess-property
  checking, so `tsc` stayed quiet while the option did nothing). The
  successor is `quoteStyle: 'double'` in `YAML_DUMP_OPTIONS`, which
  restored byte-identical quoting on the first harness run.

## Best Practices

Follow TypeScript engineering standards from `docs/standard/typescript-react-development.md`:

- Keep pure functions pure - the harness only reads corpus files and calls
  the existing emitters.
- Preserve existing style and conventions - the harness is a Vitest case
  living beside the YAML utilities it guards.
- No abbreviations in identifiers.

## Audio-Critical Requirements

- No audio path is touched. The change covers a dependency version, a
  test, fixtures, and documentation only.
- Emitted YAML feeds `LOAD SONG`/`LOAD INST` and the export pipelines;
  byte identity is the acceptance that playback-relevant data is
  unchanged.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

- `TESTING.md` - records the emitted-YAML equivalence gate: the harness
  location, the corpus, and the rule that regenerating golden files
  re-baselines the format contract and needs owner review.
- `FORMAT.md` - notes under the YAML saver rules that the emitted text is
  a byte-level contract pinned by the equivalence test.
- `SPECIFICATION.md` - if it names the `js-yaml` version, align the
  mention (verify during implementation).

## Step by Step Implementation

**Add the emission corpus**

Committed fixtures join `test/fixtures/`:

- `test/fixtures/emission/` holds the golden emitted YAML files, one per
  corpus document. A new `.prettierignore` entry exempts the directory -
  `prettier --write` rewrites YAML and a `npm run format` pass must never
  rebase emitted bytes.
- `test/fixtures/instrument/` holds a copy of the repository instrument
  files from `public/repository/instrument/`, so the instrument corpus
  stays inside `test/` per the production-build constraint.

**Write the equivalence harness**

New file `test/utils/yaml/yamlEmission.test.ts` with the
`// @vitest-environment node` pragma.

For every corpus document the harness parses the input, emits through
the real saver, and asserts the emitted string equals the golden file
byte-for-byte:

- Song corpus - `test/fixtures/*.yaml` parsed via `parseSongFromYaml`,
  emitted via `buildSongYamlForExport`.
- Instrument corpus - `test/fixtures/instrument/*.yaml` parsed via
  `parseInstrumentFromText`, emitted via `buildInstrumentYamlForExport`.
- Constructed edge cases - an in-memory `Song` covering special
  characters in `title`, instrument `name`, and pattern `name` (colon,
  quotes, hash, brackets, unicode), a `midi` node, a `stereo` node, and
  envelopes exercising trimming; a `SettingsValues` document; a
  `MidiConfiguration` document with and without device ids; and a
  clipboard payload through `generateClipboardData` covering `note`,
  `OFF`, `wait` runs, and volume-only rows.

Byte comparison uses `expect(emitted).toMatchFileSnapshot(goldenPath)` -
Vitest writes the golden on first run and compares exact file contents on
every later run. Goldens are generated under `js-yaml` 4.3.2, then the
harness passes clean as the baseline proof. Regeneration through
`vitest --update` re-baselines the format contract and is a deliberate,
documented act.

**Bump js-yaml**

`npm install js-yaml@^5.5.0` updates `package.json` (caret range per the
project convention) and `package-lock.json`. `electron-builder` keeps its
own 4.x transitive copy; the bump touches the direct dependency only.
`@types/js-yaml` is removed since the bundled declarations cover the used
surface.

**Run the harness and the suite**

The harness runs first - any emitted-byte drift fails with a diff. The
full verification loop then runs. Byte-identical output lands the
upgrade; drift is analyzed line by line and either repaired in the
`src/utils/yaml/` quoting shim or the bump reverts and the record gains a
drift itemization for owner decision.

## Testing Approach

- The harness itself is the new test: every corpus document asserts
  emitted bytes against its golden.
- The existing `test/utils/` suite stays green untouched - it asserts
  parsed values and must survive the bump without edits, proving parse
  compatibility.
- Snapshot regeneration is never incidental: golden files change only
  through a deliberate, documented re-baseline.

## Verification

Run the standard verification loop from `TESTING.md`:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run format`
4. `npm run build`
5. `npm test`

All steps must pass with zero errors and zero warnings.
