# Refactoring Proposal - 1.3.8 Window

## Summary

| Field         | Value                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------- |
| Intent        | consolidate the duplication this window's bounded-expansion work introduced                   |
| Key decisions | two behaviour-preserving steps: a shared import-size guard, then a shared run-length expander |
| Open risks    | `none` - both sites are covered by tests added in this window                                 |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Problem

The `bound-run-length-expansion` change introduced two repeated structures:

- The byte-cap guard `if (text.length > MAX_IMPORT_BYTES) throw new Error('... exceeds the maximum import size.')` is written four times across `songParser.ts`, `trackClipboard.ts`, `instrumentIO.ts`, and `midiConfiguration.ts`, differing only in the subject label.
- The bounded run-expansion loop is written twice per file in `songParser.ts` and `trackClipboard.ts` - four loops sharing the same `Math.min(rawCount, Math.max(0, capacity - expanded.length))` bound and `isOff`/`wait` shape, differing only in the pushed node literal.

## Goal

One shared guard and one shared expander consumed by all call sites, with byte-identical behavior and identical emitted/parsed data.

## Plan

**Extract the import-size guard**

Add `assertImportSize(text, subject)` to a shared utility; each parser calls it with its own subject label. Tidy step - no behavior change.

Files: `src/utils/validation/importSize.ts` (new), `src/utils/song/songParser.ts`, `src/utils/track/trackClipboard.ts`, `src/utils/instrument/instrumentIO.ts`, `src/utils/midi/midiConfiguration.ts`.

**Extract the run-length expander**

Add `expandRunNodes(rawNodes, capacity, makeWait, makeOff)` to a shared utility that encapsulates the numeric-run detection and the bounded push loop for both the pure-run and volume-run cases. `songParser.ts` passes `{ wait: true }`/`{ off: true }` factories, `trackClipboard.ts` passes `{ wait: true }`/`{ note: 'OFF' }` factories. Non-run nodes pass through unchanged.

Files: `src/utils/validation/importSize.ts` or a sibling `runLength.ts` (new), `src/utils/song/songParser.ts`, `src/utils/track/trackClipboard.ts`.

## Risk

Both loops are exercised by the bounded-expansion tests added this window (`songParserGaps.test.ts`, `trackClipboard.test.ts`) plus the 532-test baseline suite. The expander must preserve node-pass-through order and the `hasVolume`/`onlySpaceOrOff`/`onlySpaceOffVolume` key checks exactly.

## Acceptance Criteria

- `npm test` green, export output unchanged, zero new warnings.
- Four cap sites and four expansion loops collapse to one shared implementation each.
