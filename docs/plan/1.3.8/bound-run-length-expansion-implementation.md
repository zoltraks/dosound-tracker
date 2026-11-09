# Bound Run-Length Expansion Implementation Plan

## Summary

| Field         | Value                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| Intent        | bound run-length expansion to the remaining pattern length and cap import size                                   |
| Key decisions | silent truncation to capacity (not rejection); `MAX_IMPORT_BYTES` enforced at parse entry and at file-read sites |
| Open risks    | `none`                                                                                                           |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.8/bound-run-length-expansion.md`.

## Best Practices

Follow TypeScript engineering standards from `docs/standard/typescript-general-development.md`:

- Strict typing, no `any`.
- Shared limit constants, no magic numbers.
- Unit tests for every changed utility.

## Documentation Updates

- `FORMAT.md` - loader rules gain the import byte cap and the expansion bound.
- `SPECIFICATION.md` - the Constants section gains `import.ts`, and `music.ts` gains the maximum pattern length mention.

## Step by Step Implementation

**Add the limit constants**

`MAX_PATTERN_LENGTH = 256` beside `PATTERN_LENGTH` in `music.ts`; `MAX_IMPORT_BYTES = 1024 * 1024` in a new `src/constants/import.ts`. One MiB sits well above the documented under-100KB typical-song target.

Files to modify or create: `src/constants/music.ts`, `src/constants/import.ts`.

**Bound the song-parser expansion loops**

In `songParser.ts` both run-expansion loops push `count` objects with `count` unvalidated. Replace the raw count with `Math.min(count, Math.max(0, clampedLength - expandedLineNodes.length))`, and replace the literal `256` in the length clamp with `MAX_PATTERN_LENGTH`. Add the byte cap at the entry of `parseSongFromYaml`.

File to modify: `src/utils/song/songParser.ts`.

**Bound the clipboard expansion loops**

In `trackClipboard.ts` `parseClipboardData` the same two loops expand unbounded. Bound each to `MAX_PATTERN_LENGTH - expandedSteps.length`, and add the byte cap at the entry.

File to modify: `src/utils/track/trackClipboard.ts`.

**Cap the instrument and MIDI config parsers**

Add the same `MAX_IMPORT_BYTES` entry check to `parseInstrumentFromText` and `parseMidiConfigurationFromYaml`.

Files to modify: `src/utils/instrument/instrumentIO.ts`, `src/utils/midi/midiConfiguration.ts`.

**Pre-check file size before reading**

Reject oversized `File` objects before `readAsText` at the song load site (`useDataManagement.ts`, error through `setSongError`) and the MIDI config site (`MidiModal.tsx`, error through `onLoadError`). The instrument file input has no error channel and is covered by the parse-level cap.

Files to modify: `src/hooks/song/useDataManagement.ts`, `src/modals/MidiModal.tsx`.

**Add tests**

- `songParserGaps.test.ts`: a `wait: 1000000` run expands to at most the pattern length; oversized file content throws.
- New `trackClipboard.test.ts`: bounded expansion and the byte cap on `parseClipboardData`.

Files to modify or create: `test/utils/song/songParserGaps.test.ts`, `test/utils/track/trackClipboard.test.ts`.

## Implementation Order

1. Update `FORMAT.md` and `SPECIFICATION.md`.
2. Add the constants.
3. Bound the parser and clipboard loops and add parse-level caps.
4. Add the file-size pre-checks.
5. Add the tests.
6. Run the targeted verification loop.

## Testing Strategy

**Unit tests**

- `test/utils/song/songParserGaps.test.ts` - `wait: 1000000` in a pattern of length 64 produces at most 64 steps; content over `MAX_IMPORT_BYTES` throws.
- `test/utils/track/trackClipboard.test.ts` - `wait: 500` expands to at most 256 steps; oversized clipboard text throws; a small valid payload still parses.

## Verification

Run the targeted verification loop. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test -- test/utils/song test/utils/track`
