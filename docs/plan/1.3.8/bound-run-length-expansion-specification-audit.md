# Specification Audit - Bound Run-Length Expansion

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

|            |                                                                |
| ---------- | -------------------------------------------------------------- |
| Change     | `docs/change/1.3.8/bound-run-length-expansion.md`              |
| Plan       | `docs/plan/1.3.8/bound-run-length-expansion-implementation.md` |
| Audit Date | 2026-11-09                                                     |

## Verdict

The plan is ready for implementation. Every requirement maps to a verified code site, both expansion loops are located, and the cap value derives from the documented typical-song target.

## Completeness

The change record requires bounded expansion at both sites plus a byte cap on file, fetch, and clipboard imports. The plan covers: both loops in `songParser.ts` and `trackClipboard.ts`, parse-entry caps that cover fetch-based imports centrally, and `file.size` pre-checks where an error channel exists. The record's edge cases - non-numeric counts, just-over-cap files, boundary-exact runs - are handled by the unchanged numeric guards and the truncation bound.

## Ambiguity

"Rejected through the existing error-modal path" has one reading: the parse functions throw and the existing catch sites surface the error. Silent truncation versus rejection for oversized runs is resolved by REC-001's condition wording - `count` is bounded, not rejected.

## Implementability

Verified against the tree:

- `songParser.ts` lines 270-272 and 281-285 hold the two unbounded loops; `clampedLength` is computed at line 159 before use.
- `trackClipboard.ts` lines 187-189 and 197-199 hold the matching loops; `MAX_PATTERN_LENGTH` bounds pastes beyond any pattern length.
- `useDataManagement.ts` `loadSong` has `setSongError` in scope; `MidiModal.tsx` `handleFileChange` has `onLoadError` in scope.
- The instrument file input passes only text to `onLoadInstrument` - no error channel exists, so the parse-level cap is the only check there, as the plan states.
- `parseMidiConfigurationFromYaml(text, currentConfiguration)` and `parseInstrumentFromText(content, id)` both take the raw text first - entry checks fit.

## Fidelity

- Constants completeness: `MAX_IMPORT_BYTES = 1 MiB` and `MAX_PATTERN_LENGTH = 256` are enumerated; the 256 value matches the existing parser clamp `Math.min(256, ...)`.
- Boundary decisions: a run truncated at capacity leaves later sibling nodes pushed but unread - harmless single allocations; documented behavior stays "expansion bounded to remaining length".
- Cross-party parity: the saver never emits runs beyond pattern length, so truncation only affects malformed input.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| `none`  | `none`  | `none`           |
