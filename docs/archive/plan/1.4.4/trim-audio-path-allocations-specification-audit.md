# Specification Audit - Trim the Audio-Path Allocations

## Document Information

|            |                                                                 |
| ---------- | --------------------------------------------------------------- |
| Change     | `docs/change/1.4.4/trim-audio-path-allocations.md`              |
| Plan       | `docs/plan/1.4.4/trim-audio-path-allocations-implementation.md` |
| Audit Date | 2026-11-10                                                      |

## Completeness

| Change-record requirement                                                | Covering plan step                 |
| ------------------------------------------------------------------------ | ---------------------------------- |
| Replace the chain with one accumulating loop - identical sums, no arrays | Step 3                             |
| Table values come from `Math.pow` itself, never decimal literals         | Step 2 (`Array.from` + `Math.pow`) |
| Precomputed tables for the pow domains (`YM2149.ts` ~436/449)            | Step 4                             |
| Precomputed tables for `playbackSimulation.ts` ~374/377                  | Step 5                             |
| Verify with synth suites and `test/exports/` - no tolerance drift        | Testing Strategy                   |
| Out of Scope: register simulation, volume table, noise algorithm         | Respected - none touched           |

No requirement lacks a covering step. No step lacks a stated requirement.

## Ambiguity

"Domains small enough to precompute" admits two readings: table exactly the
editor's documented bounds (octaves 0-7, shifts -24..+24) or a wider domain.
The plan's generous-domain-plus-fallback reading is the only one that
reproduces `Math.pow` for every input - a clamped table without fallback
would alter fractional or out-of-range results, violating the record's
bit-identity hint.

## Implementability

| Step | Check                                                                     | Result |
| ---- | ------------------------------------------------------------------------- | ------ |
| 2    | `music.ts` hosts related constants; both consumers already import it      | Pass   |
| 3    | `.some()`/`.filter().map().reduce()` chain verified in `updateAudioNodes` | Pass   |
| 4    | Both `Math.pow` sites verified in `updateChannelWithInstrument`           | Pass   |
| 5    | Both `Math.pow` sites verified in `applyInstrumentToRegisters`            | Pass   |

The zero-sum/false-flag equivalence holds because `YM_LOG_VOLUME_TABLE[level]`
is positive for every level >= 1 and a contributing channel maps `volume > 0`
to `level >= 1` only when `volume | 0 >= 1` - sub-integer positive volumes map
to level 0, contributing 0, so a positive sum requires an originally counted
channel and vice versa for the `setValueAtTime(0)` result.

## Fidelity

- Enumeration fidelity - the record names two costs; both map to steps. The `asm.ts` pow sites exist but are outside the record's file list and are noted for deferral.
- Vocabulary freeze - table indexing is `value - MIN`; helpers return the same double `Math.pow` would for every input, in-domain or not.
- Cross-party parity - emulator and simulation stay twin-consistent: both route through the same helpers, preserving their existing divergence (integer vs raw shift) exactly.
- Constants completeness - table bounds (-8..+8 octaves, -48..+48 semitones) are enumerated in the plan.
- Boundary decisions - fractional and out-of-range input falls back to `Math.pow`; the boundary is decided, not implied.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    | -       | -                |
