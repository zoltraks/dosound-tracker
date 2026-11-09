# Specification Audit - Expand Bare Volume Clipboard Nodes

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

| Field      | Value                                                             |
| ---------- | ----------------------------------------------------------------- |
| Change     | `change/1.4.1/expand-bare-volume-clipboard-nodes.md`              |
| Plan       | `plan/1.4.1/expand-bare-volume-clipboard-nodes-implementation.md` |
| Audit Date | 2026-11-09                                                        |

## Verdict

The single behavioural requirement maps to one expansion branch and one spec line in each loader block - the shared-helper risk is named and discharged by downstream-parity verification.

## Completeness

| Requirement                                                        | Plan step                                       |
| ------------------------------------------------------------------ | ----------------------------------------------- |
| Treat a bare `volume`-only node like `wait: 1` carrying the volume | Expand the bare volume node in runLength.ts     |
| Restore round-trip idempotence                                     | Extend the characterization tests               |
| Verify against `runLength.ts` semantics before editing             | The branch lands inside `expandRunNodes` itself |
| Do not change emitted shapes or `applyClipboardToLines` tolerance  | Out of scope restated in the plan               |

## Ambiguity

- "like the `{wait: 1, volume: N}` form" - resolved to `makeWait(ln.volume)`, the exact factory the `wait: 1` path uses, so both spellings yield `{wait: true, volume: N}`.
- Condition wording: `hasVolume && keys.length === 1` - a node whose only key is `volume`. Nodes carrying `volume` beside `note`, `instrument`, `wait`, or `off` keep their existing paths.

## Implementability

- `src/utils/yaml/runLength.ts:20-57` holds the expansion loop - the fall-through push is the insertion point and `makeWait` is already a parameter.
- `expandRunNodes` has exactly two callers, `trackClipboard.ts:172` and `songParser.ts:250` - downstream of both, the bare and expanded shapes produce identical results (`parseVolumeNibble` applies volume in the song loader - `applyClipboardStepToLine` tolerates both in the clipboard path), so the shared edit introduces no behaviour change beyond node form.
- `FORMAT.md` documents both loader blocks and the saver's bare-`{volume}` emission, so the documented surface and the code stay consistent.
- `test/utils/track/trackClipboard.test.ts` lines ~204-220 and ~258-259 hold the pass-through assertions named in the record's hints.

## Fidelity

- Enumeration fidelity: one branch, two spec bullets, three test sites.
- Vocabulary freeze: "bare `volume`-only node", "wait row carrying the volume" reuse the record's language.
- Cross-party parity: `parseClipboardData` and `parseSongFromYaml` share `expandRunNodes` - both loader spec blocks in `FORMAT.md` gain the same rule so the two documented surfaces stay parity.
- Constants completeness: `MAX_PATTERN_LENGTH` capacity bounding is unchanged - a bare node expands to exactly one row.
- Boundary decisions: `applyClipboardToLines`, the generator's emission shapes, and saver behaviour stay untouched per Out of Scope.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    | -       | -                |
