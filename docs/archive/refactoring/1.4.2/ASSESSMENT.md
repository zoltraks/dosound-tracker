# YAML Coercion and Loader Hygiene Refactoring Assessment

## Proposal Summary

The proposal targeted four findings: seven duplicated number-or-numeric-string YAML coercion blocks across `songParser.ts` and `instrumentIO.ts`, two dead `Formatter` methods, three byte-identical `yaml.dump` options objects, and two inline note-off literals that bypassed the `createNoteOff()` factory.

## Implementation Summary

All four findings were implemented as proposed.

- `coerceYamlNumber` and `YAML_DUMP_OPTIONS` were added to `src/utils/yaml/yamlUtils.ts` - the new helper is unit-tested in `test/utils/yaml/yamlUtils.test.ts`.
- All seven coercion sites migrated - five in `songParser.ts` (loop, octave, sustain, midi channel, midi program), two in `instrumentIO.ts` (octave, sustain). Local floor, clamp, and default math stayed at each call site.
- `Formatter.instrumentId` and `Formatter.instrumentSlot` were deleted along with their five test cases.
- `YAML_DUMP_OPTIONS` replaced the inline options at `songIO.ts`, `trackClipboard.ts`, and `midiConfiguration.ts` - `instrumentIO.ts` keeps its own options as planned.
- `createNoteOff()` replaced both inline literals.

## Gap Analysis

Nothing missed. The `year` parse in `songParser.ts` was left untouched per the proposal because it uses bare `Number()` with different semantics. The run-length compression duplication between `trackClipboard.ts` and `songIO.ts` remains deferred - only two sites exist, below the Rule-of-Three threshold.

## Verification Results

| Check               | Result |
| ------------------- | ------ |
| `npm run typecheck` | pass   |
| `npm run lint`      | pass   |
| `npm run format`    | pass   |
| `npm run build`     | pass   |
| `npm test`          | pass   |

## Metrics Comparison

| Metric                 | Before | After |
| ---------------------- | ------ | ----- |
| Coercion blocks        | 7      | 0     |
| Dump-option copies     | 3      | 1     |
| Dead Formatter methods | 2      | 0     |
| Test files             | 78     | 79    |
| Tests                  | 621    | 620   |

The test count dropped by one net - five dead-code cases removed, four new `coerceYamlNumber`/`YAML_DUMP_OPTIONS` cases added.

## Output Fidelity

Saved-song, clipboard, and MIDI-configuration YAML output is unchanged for the same inputs - the shared options object is byte-identical to the three replaced literals, and `instrumentIO.ts` was not touched. Parser output is unchanged: the same numeric and string inputs produce the same clamped values, proven by the unmodified parser suites.

## Behaviour Smoke Check

The full suite of 620 tests passes with no modifications to existing assertions, including the ~45 parser cases that pin the string/number/garbage input matrix for every migrated site.

## Conclusion

Pass. The duplication is eliminated on the load path with identical observable behaviour. Recommendation for a later window: re-evaluate the run-length compression deduplication if a third site appears, and decide whether the loader-side padded-metadata asymmetry in `songParser.ts` should follow the saver-side trim delivered this window.
