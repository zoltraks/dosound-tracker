# Specification Audit - Memoize the Track Rows During Playback

## Document Information

|            |                                                        |
| ---------- | ------------------------------------------------------ |
| Change     | `docs/change/1.4.4/memoize-track-rows.md`              |
| Plan       | `docs/plan/1.4.4/memoize-track-rows-implementation.md` |
| Audit Date | 2026-11-10                                             |

## Completeness

| Change-record requirement                                          | Covering plan step                   |
| ------------------------------------------------------------------ | ------------------------------------ |
| `TrackLine` memoization with stable props                          | Step 2                               |
| Class and style derivation moves inside the row                    | Steps 1-2                            |
| Props must be referentially stable to pay off                      | Analysis (per-prop stability audit)  |
| Style derivation moves verbatim - a visual diff is a regression    | Step 2 (verbatim expressions)        |
| Audio-critical principles apply - measure, do not assume           | Audio-Critical Requirements          |
| Out of Scope: panel-level restructuring or `App.tsx` decomposition | Respected - single component touched |

No requirement lacks a covering step. No step lacks a stated requirement.

## Ambiguity

"Stable props" admits passing `currentLine` for in-row derivation or a
pre-resolved boolean. The plan's `isCurrent` boolean is the only reading that
preserves the memo payoff - `currentLine` changes for every row every tick.

## Implementability

| Step | Check                                                                          | Result |
| ---- | ------------------------------------------------------------------------------ | ------ |
| 1    | `getTrackLineClass` sole caller is the panel loop                              | Pass   |
| 2    | Row is pure render - no hooks or state inside                                  | Pass   |
| 3    | `instrumentColorMap` and `getInstrumentColorForNote` already live in the panel | Pass   |
| 4    | Test passes `lineClassName` - updated to the new prop surface                  | Pass   |

## Fidelity

- Enumeration fidelity - all ten props are classified: seven stable, two replaced (`lineClassName`/`lineStyle` -> `isCurrent`/`instrumentColor`), one recomputed per row (`instrumentColor`).
- Vocabulary freeze - class strings (`track-line`, `current`, `beat-line`, `track-line-colored`) and the `--track-line-color` property are unchanged.
- Cross-party parity - `React.memo`'s `Object.is` comparison matches the prop types chosen.
- Constants completeness - no constants involved.
- Boundary decisions - the `'current'` class keeps its `isActive`-independent semantics via `isCurrent`; `noteIsActive`/`volumeIsActive` keep the `isActive` gate.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    | -       | -                |
