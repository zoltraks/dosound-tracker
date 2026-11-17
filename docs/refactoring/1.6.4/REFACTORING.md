# Dual-Chip Song Data Refactoring Proposal

## Problem

The `dual-chip-song-data` change extended the song model to six channels
(`docs/change/1.6.4/dual-chip-song-data.md`). The implementation introduced a
repeated literal `['D', 'E', 'F']` for the second-chip channel keys in five
places, and a parallel `['A', 'B', 'C', 'D', 'E', 'F']` literal in
`src/utils/song/songStereo.ts` where `SONG_CHANNEL_IDS` already existed.

Files touched by the duplication:

- `src/utils/song/songChips.ts` (`CHIP2_CHANNEL_KEYS`)
- `src/utils/song/songParser.ts` (two loops)
- `src/hooks/song/useSongManagement.ts` (stored-song line migration)
- `src/hooks/song/songRenumber.ts` (playlist remap)
- `src/utils/song/songStereo.ts` (two channel-key loops)

## Goal

One canonical channel vocabulary in `src/constants/song.ts` -
`SONG_CHANNEL_IDS`, `SECOND_CHIP_CHANNEL_IDS`, and the chip-count helpers -
consumed everywhere the channel set is enumerated, so a future channel-model
change edits one list.

## Findings

**Issue**

`['D', 'E', 'F'] as const` is redeclared in four modules and
`['A', 'B', 'C', 'D', 'E', 'F'] as const` twice in `songStereo.ts`, while
`SONG_CHANNEL_IDS` already carries the same six letters.

**Impact**

Minor. The literals agree today, but a channel-set change (for example a
seventh channel or a rename) would have to find every copy; a missed copy
silently drops second-chip data on that path.

**Recommendation**

Export `SECOND_CHIP_CHANNEL_IDS` beside `SONG_CHANNEL_IDS` in
`src/constants/song.ts` and route every enumeration through the constants.

**Risk Level**

Minor

**Breaking Change Assessment**

No Breaking Change - internal constant extraction only.

**Example**

Before: `for (const key of ['D', 'E', 'F'] as const)` in four modules.
After: `for (const key of SECOND_CHIP_CHANNEL_IDS)` with the constant defined
once in `src/constants/song.ts`.

## Plan

1. Add `SECOND_CHIP_CHANNEL_IDS` to `src/constants/song.ts`.
2. Replace the literals in `songChips.ts`, `songParser.ts`,
   `useSongManagement.ts`, `songRenumber.ts`, and `songStereo.ts`.
3. Re-run typecheck, lint, and the song/playback test files.
