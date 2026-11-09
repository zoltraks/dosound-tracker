# Trim song metadata values on save

**Type:** Fix

**Source:** 1.4.1 window refactoring analysis

## Summary

| Field         | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Intent        | Stop persisting surrounding whitespace in saved song title and author fields |
| Key decisions | the guarded write stores the trimmed value the guard already computed        |
| Open risks    | existing songs saved with padded titles keep their padding until re-saved    |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`buildSongYamlForExport` in `src/utils/song/songIO.ts` computes `trimmedTitle` and `trimmedAuthor` to decide whether the values are non-empty, but then writes the untrimmed `currentSong.title` and `currentSong.author` into the document node. A title entered as `"  My Song  "` serializes with its padding, which is almost certainly unintended - the guard's whole purpose is to test the trimmed content.

The change writes the trimmed values the guard already computed, so a non-empty check and the stored value agree.

## Hints

- The same pattern repeats for `title` (lines ~261-264) and `author` (~266-269); fix both together.
- `test/utils/song/songIO.test.ts` is the characterization surface; add a whitespace-padding case.
- The deferred run-length compression deduplication between `trackClipboard.ts` and `songIO.ts` is a refactoring candidate for a later cycle - this record is the behaviour fix only.

## Out of Scope

- `year`, `chip`, `frame`, `clock`, `speed` normalization - already handled.
- Loader-side whitespace handling.
