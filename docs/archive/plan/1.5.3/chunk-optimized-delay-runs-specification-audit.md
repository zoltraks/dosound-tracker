# Specification Audit - Chunk Merged Delays in the Optimized Assembly Strategy

## Document Information

|            |                                                                |
| ---------- | -------------------------------------------------------------- |
| Change     | `docs/change/1.5.3/chunk-optimized-delay-runs.md`              |
| Plan       | `docs/plan/1.5.3/chunk-optimized-delay-runs-implementation.md` |
| Audit Date | 2026-11-11                                                     |

## Completeness

Every record requirement maps to a plan step:

- "optimized passes 256 like compact does" - the Bound-the-optimized-merge
  step collapses the ternary so both merging strategies pass `256`.
- "byte-identity broken only for out-of-range inputs" - the Testing
  Approach step requires existing `optimized` fixtures to pass unmodified.
- "the decode-and-compare equivalence test extends to optimized" - the
  Update-the-strategy-test step reuses `decodeFrames`/`delayValues` on the
  chunked output.

No requirement lacks a covering step and no step lacks a stated
requirement.

## Ambiguity

No wording admits more than one implementation. The change is a single
call-site constant; the test update asserts the two record use cases
directly.

## Implementability

- `combineDelayLines(asm, { maxFramesPerCommand })` exists at
  `src/exports/asm.ts` with the `maxFramesPerCommand` option, and the
  `256` bound is already exercised by `compact` - preconditions hold.
- The asserted old behaviour lives at
  `test/exports/exportAssemblyCompact.test.ts` in the long-run case, so
  the test edit target exists.
- `FORMAT.md` documents the optimized merge in the EXPORT DATA section -
  the documentation target exists.

No step fails the check.

## Fidelity

- Enumeration fidelity - the single-byte `$FF,N` bound (`N+1` frames, max 256) is stated identically in the record, `FORMAT.md`, and the code
  comment being updated.
- Cross-party parity - the emitter (`asm.ts`) and the documented format
  contract (`FORMAT.md`) move together; the replay side is out of scope
  and untouched.
- The plan defers nothing the record requires.

## Findings

No findings. The audit passes on completeness, ambiguity,
implementability, and fidelity.
