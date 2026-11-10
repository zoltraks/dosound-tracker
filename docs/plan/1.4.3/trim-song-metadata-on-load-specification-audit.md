# Specification Audit - Trim the Song Metadata Values on Load

## Document Information

|            |                                                                |
| ---------- | -------------------------------------------------------------- |
| Change     | `docs/change/1.4.3/trim-song-metadata-on-load.md`              |
| Plan       | `docs/plan/1.4.3/trim-song-metadata-on-load-implementation.md` |
| Audit Date | 2026-11-09                                                     |

## Completeness

| Requirement                                            | Covering step                                    |
| ------------------------------------------------------ | ------------------------------------------------ |
| Store the trimmed values the guard already computes    | Store the trimmed values in the parser           |
| Fix `title` and `author` together                      | Same step - both fields in one parse block       |
| Whitespace-padding characterization case               | Add the whitespace-padding characterization case |
| Decide whether `FORMAT.md` records the trim            | Record the load-path trim in the format document |
| Out of scope honored - no saver-side or `chip` changes | No such step exists                              |

No requirement lacks a covering step and no step lacks a requirement.

## Ambiguity

- "add a whitespace-padding case" - resolved to a case covering padded values loading trimmed plus a whitespace-only value still defaulting, so both branches of the guard are pinned.

## Implementability

- `src/utils/song/songParser.ts` lines 169-176 hold the guarded `title`/`author` block with untrimmed stores - verified.
- `docs/FORMAT.md` line 51 holds the loader default rule and line 61 the saver trim - verified.
- `test/utils/song/songParser.test.ts` and `songParserGaps.test.ts` exist and assert `song.title`/`song.author` - verified.
- `DEFAULT_SONG_TITLE`/`DEFAULT_SONG_AUTHOR` are already imported in the file - verified by the existing fallback expressions.

No step fails the check.

## Fidelity

- Enumeration fidelity - both fields enumerated; `chip` already handled and out of scope.
- Vocabulary freeze - the `FORMAT.md` wording mirrors the existing saver-trim phrasing.
- Cross-party parity - load-path now matches the save-path contract the saver already records.
- Constants completeness - no numeric bounds touched.
- Boundary decisions - whitespace-only values default rather than load empty - decided and recorded.

## Findings Returned to Planning

none
