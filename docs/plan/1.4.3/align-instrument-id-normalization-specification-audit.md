# Specification Audit - Align the Instrument-Id Normalization

## Document Information

|            |                                                                       |
| ---------- | --------------------------------------------------------------------- |
| Change     | `docs/change/1.4.3/align-instrument-id-normalization.md`              |
| Plan       | `docs/plan/1.4.3/align-instrument-id-normalization-implementation.md` |
| Audit Date | 2026-11-09                                                            |

## Completeness

| Requirement                                 | Covering step                                            |
| ------------------------------------------- | -------------------------------------------------------- |
| Decide the canonical contract               | Analysis records `normalizeInstrumentId` as the contract |
| Route every normalization site through it   | The six routing steps cover every loose and raw site     |
| Keep deliberate divergence documented       | The `{1,2}` hex gate stays, recorded in the plan         |
| Characterization tests for `5`, `$0F`, `0f` | Add the characterization tests                           |

No requirement lacks a covering step and no step lacks a requirement.

## Ambiguity

- "keeping deliberate divergence documented where it exists (for example `getInstrumentColorForNote`, which intentionally does not pad)" - resolved by survey: the missing pad is incidental-but-coupled to the map's key space, so both sides route together; the semantic divergence that survives is the non-hex gate, which is kept and recorded.
- The record names `src/utils/rendering/trackRendering.ts` - the real path is `src/utils/track/trackRendering.ts`, confirmed by listing.
- "Roughly ten call sites" - the survey enumerated the full set including raw-equality sites the record's count missed (`App.tsx` `instrumentsById`, `useSequencerIntegration`, `playbackSimulation`); all route, since the third contract is the same defect.

## Implementability

- `normalizeInstrumentId` exists at `src/utils/playback/playbackUtils.ts:7` with the surveyed contract - verified.
- Every site listed exists: `useSongManagement.ts` 355/357/372/529-530/537/554/575/608; `instrumentOperations.ts` 171/188; `useInstrumentActions.ts` 210; `songParser.ts` 277/323; `trackClipboard.ts` 224; `trackRendering.ts` 9/56-76; `useSequencerIntegration.ts` 266-279/412-416; `App.tsx` 271-281; `playbackSimulation.ts` 202/229 - verified by grep.
- `InstrumentId` is assignable to `string` - zero type errors at every routed site.
- `instrumentOperations.ts` already imports the function for its injected parameters - the new uses match the existing signature.

No step fails the check.

## Fidelity

- Enumeration fidelity - pattern-id, chip, volume-nibble, note-name, OFF-keyword, and display-only normalizations are enumerated as out of scope, so no sibling domain is accidentally routed.
- Vocabulary freeze - the stored ids and the `InstrumentId` brand are unchanged; the contract vocabulary is the existing function's.
- Cross-party parity - both sides of every key/lookup pair route together: parser store vs clipboard store, color map vs color lookup, `instrumentsById` vs its consumers, `instrumentIdMap` writers vs readers.
- Constants completeness - `$` strip is one leading character only, pad target is two digits, hex gate `^[0-9A-F]{1,2}$`, non-hex passthrough - all stated.
- Boundary decisions - `songParser.ts:323` decided: route and accept `$`/one-char inputs deliberately (recorded in `FORMAT.md`); `trackClipboard` numeric stays `'00'` via the kept string guard; exports stay byte-identical for canonical songs.

## Findings Returned to Planning

none
