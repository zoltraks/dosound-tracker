# Trim the Song Metadata Values on Load Implementation Plan

## Summary

| Field         | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Intent        | Stop retaining surrounding whitespace in loaded song title and author values |
| Key decisions | `FORMAT.md` records the load-path trim alongside the existing default rule   |
| Open risks    | Songs intentionally authored with padded metadata lose the padding on load   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.3/trim-song-metadata-on-load.md`.

## Analysis

`parseSongFromYaml` in `src/utils/song/songParser.ts` (lines 169-176) gates the `title` and `author` defaults on `songNode.title.trim()` / `songNode.author.trim()` but stores the untrimmed value in the resulting `Song`. The saver-side trim landed in 1.4.2, so a padded value survives in memory until the next save. `FORMAT.md` records the saver trim at line 61 and the loader default rule at line 51 without mentioning the load-path trim.

## Documentation Updates

- `FORMAT.md` — the loader rule for `title` and `author` records that string values are trimmed of surrounding whitespace, with empty-or-missing still defaulting.

## Step by Step Implementation

**Record the load-path trim in the format document**

Extend the `title`, `author` loader bullet so it states that string values load trimmed, matching the saver contract already recorded in the file.

File to modify: `docs/FORMAT.md`.

**Store the trimmed values in the parser**

Store the trimmed string the guard already computes for both `title` and `author`.

File to modify: `src/utils/song/songParser.ts`.

```typescript
const title =
  typeof songNode.title === 'string' && songNode.title.trim()
    ? songNode.title.trim()
    : DEFAULT_SONG_TITLE;
const author =
  typeof songNode.author === 'string' && songNode.author.trim()
    ? songNode.author.trim()
    : DEFAULT_SONG_AUTHOR;
```

**Add the whitespace-padding characterization case**

Add a case to the parser characterization surface proving `title: '  Padded  '` and a padded `author` load trimmed, and that a whitespace-only value still falls to the default.

File to modify: `test/utils/song/songParser.test.ts` (or `songParserGaps.test.ts` if the case fits the gaps file better).

## Implementation Order

1. Update `FORMAT.md`
2. Update `songParser.ts`
3. Add the characterization case
4. Run the verification loop

## Testing Strategy

The new characterization case runs inside the existing parser suite - no new test file.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test` targeted at the song parser suite, then the full suite
