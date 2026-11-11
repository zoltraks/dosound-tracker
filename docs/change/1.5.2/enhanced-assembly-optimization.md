# Enhance Assembly Export Optimization

**Type:** Feature

## Summary

| Field         | Value                                                                    |
| ------------- | ------------------------------------------------------------------------ |
| Intent        | Shrink DOSOUND assembly output further through register mapping, pattern |
|               | data compression, and instrument sharing                                 |
| Key decisions | New strategies join the existing simple/complex/optimized set as         |
|               | selectable options - current output stays reproducible                   |
| Open risks    | Aggressive size cuts must preserve byte-level replay fidelity on real    |
|               | DOSOUND playback - every optimization needs a verified equivalence       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The optimized assembly strategy today merges consecutive delays and skips
unchanged registers. Three further size reductions are candidates.

- **Custom register mappings** - reorder or pack register writes to
  shorten the emitted command stream where the DOSOUND format admits it.
- **Pattern data compression** - repeated pattern bodies emit once and
  are referenced, rather than unrolled per playlist occurrence.
- **Instrument sharing** - identical instrument states across channels
  collapse into shared data instead of per-channel duplication.

Each optimization is evaluated against the DOSOUND replay contract: the
emitted byte stream must drive the real XBIOS routine to the same audible
result. Optimizations that trade replay fidelity for size are declined.

New behaviour arrives as selectable strategy surface, so existing
exports keep their byte-identical output under the current strategies.

## Use Cases

- When a song repeats a pattern in the playlist, an eligible strategy
  emits the body once and the output shrinks.
- When the user exports with today's strategies, the produced bytes are
  unchanged.
- When a candidate optimization cannot prove replay equivalence, it is
  not offered.

## Hints

- `src/exports/asm.ts` holds the strategy dispatch; `FORMAT.md`
  documents the emitted stream and must describe any new encoding before
  code lands.
- The `test/exports/` fixtures are the equivalence harness - new
  strategies need fixtures covering loop points, silence runs, and mixed
  noise/tone channels.
- Measure wins on the bundled demo song and report them in the window
  review.

## Out of Scope

- Changes to the DOSOUND playback routine on the Atari side - only the
  emitted data changes.
- Optimizations that alter the audible result (lossy tricks).
