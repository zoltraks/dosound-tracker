# Extract the Pattern-Id Normalization Helper Implementation Plan

## Summary

| Field         | Value                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------- |
| Intent        | Give pattern ids the same single-contract treatment instrument ids received in 1.4.3               |
| Key decisions | The pattern contract is trim + uppercase only - no `$` strip, no hex padding unlike instrument ids |
| Open risks    | none                                                                                               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.4/extract-pattern-id-normalization.md`.

## Analysis

Five sites carry the `trim().toUpperCase()` pattern-id idiom: four inside `renumberSongData` in `src/hooks/song/useSongManagement.ts` (the `patternById` map key, the `addPatternId` playlist-ref normalizer, the unreferenced-pattern `idNorm`, and the `patternIdMap` lookup inside `remapPatternId`) plus the `number` field parse in `src/utils/song/songParser.ts`.

The contract survey shows pattern ids deliberately diverge from instrument ids. No site strips a leading `$` and no site pads a one-character hex id - a file-loaded pattern id `'a'` normalizes to `'A'`, not `'0A'`. Playlist references are not normalized at parse time at all, and pattern ids may be arbitrary non-hex strings (`'IP'`, `'BASS'`), which matches the unquoted passthrough the instrument contract also keeps. The shared contract is therefore exactly `value.trim().toUpperCase()` for strings, `Formatter.hex` for finite numbers (mirroring `normalizeInstrumentId`), and `''` otherwise.

`remapPatternId`'s output asymmetry is preserved: unmapped refs return the trimmed input unchanged and `'--'` placeholders pass through - only the map _lookup key_ routes through the normalizer.

## Documentation Updates

- `SPECIFICATION.md` — record `normalizePatternId` in the Shared Utilities list with its contract, including the deliberate divergence from `normalizeInstrumentId` (no `$` strip, no padding).

## Step by Step Implementation

**Record the canonical helper**

Document `normalizePatternId` in `SPECIFICATION.md` under Shared Utilities.

File to modify: `docs/SPECIFICATION.md`.

**Add the helper**

Add `normalizePatternId(value?: string | number | null): PatternId` to `src/utils/pattern/patternUtils.ts`, mirroring the `normalizeInstrumentId` shape: finite numbers format through `Formatter.hex`, strings normalize to `trim().toUpperCase()`, everything else returns `''`. The result brands through `asPatternId`.

File to modify: `src/utils/pattern/patternUtils.ts`.

**Route the renumber sites**

Replace the four `trim().toUpperCase()` idioms inside `renumberSongData` with `normalizePatternId` calls: the `patternById` key, the `addPatternId` normalizer, the unreferenced-pattern `idNorm`, and the `patternIdMap` lookup in `remapPatternId`. The fallback that returns the trimmed raw ref stays untouched.

File to modify: `src/hooks/song/useSongManagement.ts`.

**Route the parser site**

Replace `rawNumber.trim().toUpperCase()` with `normalizePatternId(rawNumber)` under the existing `typeof === 'string' && rawNumber.trim()` guard - the numeric-YAML fallback to positional `Formatter.hex` is unchanged.

File to modify: `src/utils/song/songParser.ts`.

## Implementation Order

1. Update documentation
2. Add `normalizePatternId` to `patternUtils.ts`
3. Route `useSongManagement.ts` sites
4. Route `songParser.ts` site
5. Add unit tests
6. Run verification loop

## Testing Strategy

**Unit tests**

Extend `test/utils/pattern/patternUtils.test.ts` with `normalizePatternId` cases: `'ab'` -> `'AB'`, `'  cd '` -> `'CD'`, `'a'` -> `'A'` (no padding - the contract divergence), `'--'` passthrough, `'bass'` -> `'BASS'`, `5` -> `'05'`, empty and blank strings -> `''`, `null`/`undefined` -> `''`.

Test file to update: `test/utils/pattern/patternUtils.test.ts`.

**Integration tests**

The existing `renumberSongData` and `songParser` suites cover the routed sites end to end - they are the regression guard that routing changed nothing observable.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Confirm `test/utils/pattern/` plus the renumber and parser suites pass unchanged in behavior
