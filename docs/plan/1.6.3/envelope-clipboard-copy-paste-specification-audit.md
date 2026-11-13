# Specification Audit - Envelope Copy and Paste

## Document Information

|            |                                                                   |
| ---------- | ----------------------------------------------------------------- |
| Change     | `docs/change/1.6.3/envelope-clipboard-copy-paste.md`              |
| Plan       | `docs/plan/1.6.3/envelope-clipboard-copy-paste-implementation.md` |
| Audit Date | 2026-11-13                                                        |

## Completeness

Every requirement in the change record maps to a plan step.

| Requirement                                                                | Plan step                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------ |
| CTRL+C copies the active envelope to the system clipboard                  | Clipboard hook - `handleCopyEnvelope`            |
| CTRL+V pastes into the same envelope type, including on another instrument | Clipboard hook - `handlePasteEnvelope`           |
| Clipboard carries the instrument-file YAML dialect                         | Envelope clipboard util - generate/parse         |
| Volume copies include the sustain index                                    | Util + hook - `sustain` round-trip               |
| Track CTRL+C/V behavior unchanged                                          | Dispatch - mutual exclusivity on `activeSection` |
| Clipboard failures report to the user                                      | Retitled shared clipboard-error modal            |
| Pastes are undoable                                                        | `updateInstrument` write path                    |

Requirements with no covering step: none. Steps with no stated requirement: none.

## Ambiguity

- "Same envelope type" - pinned to `EnvelopePanelType`, which is also the `Instrument` field name; a pitch payload cannot land on a volume panel.
- "Enters a different type on paste" - rejected with a modal error rather than silently pasted into the matching field; this is the recorded decision.
- Whether a pasted volume envelope without `sustain` clears the destination's sustain - decided: leave unchanged, since the clipboard key is absent.

## Implementability

| Check                                      | Evidence                                                                                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `navigator.clipboard` wrapper exists       | `getClipboardApiOrReport` in `src/utils/track/trackUtils.ts`                                                                                             |
| YAML field names match instrument dialect  | `instrumentIO.ts` writes `volume:`/`shift:`/`pitch:`/`noise:`/`mode:` arrays; `arpeggio:` is the read alias                                              |
| `activeSection` names equal envelope types | `NAVIGATION_ORDER` lists `mode`, `volume`, `shift`, `pitch`, `noise`; `getEnvelopeSectionName` returns the type                                          |
| CTRL+C/V dispatch is reachable             | `useKeyboardNavigation` matches `CTRL+C`/`CTRL+V` to the `copyTrack`/`pasteTrack` global callbacks; envelope panels only early-return on modifier chords |
| Error modal plumbing exists                | `trackClipboardError` flows `useTrackOperations` → `ModalContainer` → info modal                                                                         |
| `updateInstrument` records history         | `useDataManagement.ts` calls `recordHistory()` before applying updates                                                                                   |
| Clamp/expand helpers exist                 | `clampEnvelopeValue` in `envelopeTypes.ts`; `expandEnvelope` in `envelopeUtils.ts`                                                                       |

Steps that fail the check: none.

## Fidelity

- Enumeration fidelity: the plan covers every requirement; each of the five envelope types is named.
- Vocabulary freeze: the clipboard payload uses only instrument-file keys (`volume`, `shift`, `arpeggio` alias on read, `pitch`, `noise`, `mode`, `sustain`).
- Cross-party parity: generate emits what parse accepts - verified by round-trip tests.
- Constants completeness: `ENVELOPE_LENGTH` expansion and per-type clamping come from the same helpers the instrument loader uses, so clipboard and file paths share semantics.
- Boundary decisions: no changes to `trackClipboard.ts` or the track paste-mode prompt; CTRL+X deliberately not extended.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    |         |                  |
