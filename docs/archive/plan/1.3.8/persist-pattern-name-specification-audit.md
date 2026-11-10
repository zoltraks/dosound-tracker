# Specification Audit - Persist Pattern Name

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

|            |                                                          |
| ---------- | -------------------------------------------------------- |
| Change     | `docs/change/1.3.8/persist-pattern-name.md`              |
| Plan       | `docs/plan/1.3.8/persist-pattern-name-implementation.md` |
| Audit Date | 2026-11-09                                               |

## Verdict

The plan is ready for implementation. Its single requirement maps to a single verified code site, the loader-side contract already exists, and no ambiguity blocks the edit.

## Completeness

The change record states one requirement: custom pattern names survive a save/load round-trip, written only when different from the default. The plan's `songIO.ts` step covers the write path, and its test step covers the round-trip. No uncovered requirements and no orphan steps.

## Ambiguity

`name` emission is decided by comparison to `Pattern <number>` using the emitted `number` value - one interpretation, matching the parser fallback at `songParser.ts` and the creation sites in `useTrackPattern.ts`, `useDataManagement.ts`, and `usePatternManagement.ts`. A name differing only in letter case is still emitted, which round-trips harmlessly.

## Implementability

Verified against the tree:

- `src/utils/song/songIO.ts` builds `patternNode` at lines 241-249 with `number` and `step` - the insertion point exists.
- `Pattern.name` is `string` per `src/synth/SoundDriver.ts` - test fixtures already pass `name`.
- `src/utils/song/songParser.ts` reads `patternNode.name` with the `Pattern ${number}` fallback - the parser needs no change.
- `test/utils/song/songIO.test.ts` exists with a `song()` factory carrying `name: 'P'` - the existing fixture name `P` differs from `Pattern 00` and will now be emitted - assertions on emitted keys must tolerate the new key.

## Fidelity

- Constants completeness: the default-name formula `Pattern <number>` is stated once and used identically by saver, parser, and creation sites.
- Cross-party parity: the saver emits `name` as an optional string the parser already accepts - both ends specified.
- Boundary decisions: files saved before this change carry no `name` and load with generated defaults - unchanged behavior.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| `none`  | `none`  | `none`           |
