# Enhance Assembly Export Optimization

**Type:** Feature

## Summary

| Field         | Value                                                                    |
| ------------- | ------------------------------------------------------------------------ |
| Intent        | Shrink DOSOUND assembly output through a new `compact` strategy that     |
|               | packs register writes tighter than `optimized`                           |
| Key decisions | `compact` joins the strategy set as a fourth selectable option - simple, |
|               | complex, and optimized keep byte-identical output; pattern referencing   |
|               | and instrument sharing are declined because the DOSOUND stream carries   |
|               | no subroutine or pointer command                                         |
| Open risks    | Equivalence is proven only by the per-frame register-state tests in      |
|               | `test/exports/` - real-hardware replay confirmation stays outstanding    |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The optimized assembly strategy today merges consecutive delays and skips
unchanged registers. Analysis against the DOSOUND stream contract
(register-value pairs, `$FF,N` delays, `$FF,0` stop - no loop, subroutine,
or data-reference command exists) settled the three candidates.

- **Custom register mappings** - accepted, realized as a fourth strategy
  `compact` that packs register writes tighter: only the changed half of
  a tone-period pair emits, mixer writes key on audible-channel bits, the
  forced tone rewrite after playlist-position markers drops, merged
  delays split at the single-command 256-frame maximum, and the END
  block silences only channels not already muted.
- **Pattern data compression** - declined. Referencing a pattern body
  needs a pointer or subroutine command the stock replay routine does
  not decode, and Atari-side player changes are out of scope.
- **Instrument sharing** - declined for the same reason: the stream has
  no shared-data construct, only per-register writes.

The accepted optimization preserves the DOSOUND replay contract: the
emitted byte stream must drive the real XBIOS routine to the same audible
result. Optimizations that trade replay fidelity for size are declined.

New behaviour arrives as selectable strategy surface, so existing
exports keep their byte-identical output under the current strategies.

## Use Cases

- When a song carries fine-pitch movement, vibrato, or pitch envelopes,
  the `compact` strategy emits only the changed tone byte and the output
  shrinks.
- When a long silence run or quiet stretch merges into a delay beyond
  256 frames, `compact` splits it into legal single-byte delay commands.
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
- Wins measured on the bundled demo song: the compact stream lands a
  single-digit percentage under optimized, reported in the window review.

## Out of Scope

- Changes to the DOSOUND playback routine on the Atari side - only the
  emitted data changes.
- Optimizations that alter the audible result (lossy tricks).
