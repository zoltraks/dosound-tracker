# Specification Audit - Extract the Pattern-Id Normalization Helper

## Document Information

|            |                                                                      |
| ---------- | -------------------------------------------------------------------- |
| Change     | `docs/change/1.4.4/extract-pattern-id-normalization.md`              |
| Plan       | `docs/plan/1.4.4/extract-pattern-id-normalization-implementation.md` |
| Audit Date | 2026-11-10                                                           |

## Completeness

| Change-record requirement                                 | Covering plan step                                    |
| --------------------------------------------------------- | ----------------------------------------------------- |
| Survey every pattern-id site before defining the contract | Analysis (five sites enumerated)                      |
| Decide the contract                                       | Analysis (trim + uppercase, no `$`, no pad)           |
| Route `renumberSongData` sites through it                 | Step 3                                                |
| Route `songParser` and `remapPatternId` through it        | Steps 3-4                                             |
| Mirror the 1.4.3 approach                                 | Step 2 (helper mirrors `normalizeInstrumentId` shape) |
| Out of Scope: playlist `-`/`--` placeholder handling      | Respected - placeholders pass through                 |

No requirement lacks a covering step. No step lacks a stated requirement.

## Ambiguity

"Same single-contract treatment" admits copying the instrument contract
verbatim (`$` strip, hex pad) or defining the pattern domain's own contract.
The record's own risk note ("pattern ids may carry a different accepted-input
contract") plus the site survey resolve it: every current site applies only
`trim().toUpperCase()`, so that is the contract and the divergence is
recorded as deliberate.

## Implementability

| Step | Check                                                                                | Result |
| ---- | ------------------------------------------------------------------------------------ | ------ |
| 2    | `src/utils/pattern/patternUtils.ts` exists; `asPatternId`, `Formatter.hex` available | Pass   |
| 3    | Four `trim().toUpperCase()` idioms inside `renumberSongData` located                 | Pass   |
| 4    | `songParser.ts` `rawNumber` site under the string guard located                      | Pass   |

`Pattern.id` is a plain `string`, so the branded `PatternId` return assigns
without type changes. `patternIdMap` is `Record<string, string>` - a branded
key indexes it unchanged.

## Fidelity

- Enumeration fidelity - all five recorded sites map to plan steps; no sixth `trim().toUpperCase()` pattern-id site exists (`'OFF'` sentinel and chip normalization are different domains).
- Vocabulary freeze - the contract is stated once: strings `trim().toUpperCase()`, finite numbers `Formatter.hex`, otherwise `''`.
- Cross-party parity - writer sites (parser) and reader sites (renumber lookups) share the one contract after routing.
- Constants completeness - no new constants; `Formatter.hex` defaults (pad 2, uppercase) reused.
- Boundary decisions - raw `===` pattern lookups (`playbackSimulation`, `patternsById`) stay unnormalized; they key on already-normalized ids and are out of scope.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    | -       | -                |
