# Trim song metadata values on load

**Type:** Fix

**Source:** 1.4.2 window review deviation analysis

## Summary

| Field         | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Intent        | Stop retaining surrounding whitespace in loaded song title and author values |
| Key decisions | align the loader with the saver-side trim landed in 1.4.2                    |
| Open risks    | songs intentionally authored with padded metadata lose padding on load       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`parseSongFromYaml` in `src/utils/song/songParser.ts` gates the `title` and `author` defaults on `songNode.title.trim()` / `songNode.author.trim()`, but keeps the untrimmed stored value in the resulting `Song`. A song file carrying `title: '  Padded  '` loads with the padding intact in memory, and the saver-side trim landed in 1.4.2 only removes it on the next save.

The change stores the trimmed values the guard already computes, so load-path metadata agrees with the save-path contract recorded in `FORMAT.md`.

## Hints

- The same pattern repeats for `title` and `author` in the song metadata parse block - fix both together.
- `test/utils/song/songParser.test.ts` and `songParserGaps.test.ts` are the characterization surface - add a whitespace-padding case.
- Decide whether `FORMAT.md` loader rules should record the trim alongside the existing empty-or-missing default rule.

## Out of Scope

- Saver-side trimming - delivered in 1.4.2.
- `chip` value trimming, which is already handled.
