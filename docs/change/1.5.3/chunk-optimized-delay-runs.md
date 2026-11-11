# Chunk Merged Delays in the Optimized Assembly Strategy

**Type:** Fix

## Summary

| Field         | Value                                                                    |
| ------------- | ------------------------------------------------------------------------ |
| Intent        | Bound merged delay commands in the `optimized` assembly strategy so a    |
|               | delay count never exceeds the single-byte `$FF,N` token                  |
| Key decisions | `combineDelayLines` already accepts `maxFramesPerCommand` - `optimized`  |
|               | passes `256` like `compact` does; byte-identity is intentionally broken  |
|               | only for inputs that were emitting an out-of-range count                 |
| Open risks    | `optimized` output bytes change for songs with merged delay runs beyond  |
|               | 256 frames - the regression fixtures must confirm only those inputs move |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The DOSOUND delay command is `$FF,N` where `N` delays `N+1` frames and `N`
is one byte, so a single command can express at most a 256-frame run.
`combineDelayLines` in `src/exports/asm.ts` merges consecutive `DL` lines
with no upper bound: a silence or static run longer than 256 frames emits
`dc.b $FF,$<count>` with a count above `$FF` - an out-of-range byte that
the assembler truncates or rejects, shortening or corrupting the delay on
hardware replay.

The defect surfaced while the `compact` strategy was designed in the 1.5.2
window. `compact` passes `maxFramesPerCommand: 256` and splits long runs
into legal commands; `optimized` was deliberately left unbounded to keep
its emitted bytes identical inside that window. This record closes the
gap: `optimized` adopts the same chunking, accepting a byte change only
for inputs that previously produced an invalid token.

## Use Cases

- When a song holds a static run longer than 256 frames and is exported
  with the `optimized` strategy, the delay stream splits into legal
  single-byte commands instead of emitting one out-of-range count.
- When a song has no run beyond 256 frames, `optimized` output stays
  byte-identical to its current form.

## Hints

- The mechanism is already shipped: `combineDelayLines` takes
  `maxFramesPerCommand`, and the call site reads
  `strategy === 'compact' ? 256 : Infinity`. The fix narrows the
  condition - `optimized` passes `256` too.
- The `test/exports/` fixtures lock `optimized` bytes on the fixture
  song; a fixture covering a long merged run proves the split, and the
  existing fixtures prove everything shorter is untouched.
- The decode-and-compare equivalence test added under `compact` extends
  to `optimized` - chunked delays are replay-equivalent by construction.

## Out of Scope

- Replay-side changes to the DOSOUND playback routine - the emitted data
  changes, not the consumer.
- Revisiting `simple` or `complex` - neither merges delays.
