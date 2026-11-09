# Align instrument-id normalization

**Type:** Fix

**Source:** 1.4.3 session refactoring analysis

## Summary

| Field         | Value                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Intent        | Give instrument-id parsing one accepted-input contract instead of two divergent ones            |
| Key decisions | `normalizeInstrumentId` strips `$` and pads one-char hex; plain `trim().toUpperCase()` does not |
| Open risks    | tightening input acceptance can reject files the loose path currently loads                     |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Roughly ten call sites across `useSongManagement.ts`, `instrumentOperations.ts`, `songParser.ts`, `trackClipboard.ts`, and `trackRendering.ts` normalize instrument ids with `(id).trim().toUpperCase()`, while `normalizeInstrumentId` in `src/utils/playback/playbackUtils.ts` additionally strips `$` characters and pads single-character hex to two digits. The two paths accept and produce different ids, so a song can carry an id one path recognizes and another does not.

Decide the canonical contract and route every normalization site through it, keeping deliberate divergence documented where it exists (for example `getInstrumentColorForNote`, which intentionally does not pad).

## Hints

- The color lookup deliberately avoids padding; confirm whether that is semantic or incidental before unifying.
- Characterization tests for the loose-path inputs (`5`, `$0F`, `0f`) belong in the plan.

## Out of Scope

- Instrument-id schema changes - this aligns normalization, not the id format.
