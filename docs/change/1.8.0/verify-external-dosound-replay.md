# Verify DOSOUND output against an external player

**Type:** Chore

**Source:** Audit 2026-11-12 REC-12 (RISK-01)

## Summary

| Field         | Value                                                           |
| ------------- | --------------------------------------------------------------- |
| Intent        | Prove or honestly narrow the Atari DOSOUND compatibility claim  |
| Key decisions | none                                                            |
| Open risks    | Needs an original DOSOUND routine or an independently validated |
|               | compatible player - the blocker is external availability        |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The project claims 100 percent Atari XBIOS-compatible assembly output.
Export unit tests and browser downloads pass, but no original DOSOUND
routine, hardware replay, or independently checked reference stream has
ever validated the emitted command stream. The claim sits at `N-03` as
unknown, not passed or failed.

Produce a small published reference-song matrix - silence, looping,
all three channels, 50/60 Hz, both clocks, and every export strategy -
and replay the emitted streams through the original Atari DOSOUND
routine or an independently validated compatible player. Register and
time traces plus stop behavior compare byte by byte. Until that evidence
exists, `N-03` stays marked unknown; the alternative resolution is to
narrow the claim in `PROJECT.md` as a documented decision.

## Use Cases

- When the reference matrix replays, any divergence names the byte and
  the frame it appears at.
- When no player is obtainable, `PROJECT.md` records the narrowed claim
  instead of carrying an unproven one.

## Hints

- Any incompatibility the replay exposes routes to its own change
  record - this record produces evidence, not fixes.
- An emulator with a faithful DOSOUND replay path counts as
  independently validated only if its correctness is itself documented.
- Sites: `docs/PROJECT.md` (`N-03`), `docs/FORMAT.md` command-stream
  specification, `src/exports/asm.ts` output.

## Out of Scope

- Changing export output to match a player.
- Building a custom replay engine as part of this record.
