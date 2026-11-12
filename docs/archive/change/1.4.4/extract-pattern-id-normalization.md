# Extract a pattern-id normalization helper

**Type:** Enhancement

**Source:** 1.4.3 window refactoring survey

## Summary

| Field         | Value                                                                           |
| ------------- | ------------------------------------------------------------------------------- |
| Intent        | Give pattern ids the same single-contract treatment instrument ids got in 1.4.3 |
| Key decisions | The `trim().toUpperCase()` idiom recurs across about five pattern-id sites      |
| Open risks    | Pattern ids may carry a different accepted-input contract than instrument ids   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The instrument-id alignment routed every instrument-id site through `normalizeInstrumentId` and deliberately left pattern ids on the loose `trim().toUpperCase()` idiom - `renumberSongData` uses it about three times, `songParser` and `remapPatternId` once each. A `normalizePatternId` helper would give the pattern-id domain the same single-contract guarantee, but it is a new abstraction over a different domain and needs its own contract analysis first.

## Hints

- Survey every pattern-id site before defining the contract - playlist line references may accept different input than pattern numbers.
- Mirror the 1.4.3 approach: decide the contract, then route sites through it.

## Out of Scope

- Playlist line `-` placeholder handling.
