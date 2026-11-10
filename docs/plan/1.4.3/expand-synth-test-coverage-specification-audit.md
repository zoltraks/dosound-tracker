# Specification Audit - Expand the Synth and Worker Test Coverage

## Document Information

|            |                                                                |
| ---------- | -------------------------------------------------------------- |
| Change     | `docs/change/1.4.3/expand-synth-test-coverage.md`              |
| Plan       | `docs/plan/1.4.3/expand-synth-test-coverage-implementation.md` |
| Audit Date | 2026-11-09                                                     |

## Completeness

| Requirement                                                              | Covering step                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------ |
| Characterization tests for emulator register writes and the volume table | Pin the register and volume surfaces                   |
| Noise LFSR coverage                                                      | Pin the noise generator                                |
| Sequencer worker message protocol and position tracking                  | Pin the sequencer worker protocol                      |
| Modal behaviors likely to regress                                        | Pin the selected modal behaviors                       |
| Pin YM2149 against `SPECIFICATION.md` formulas before restructuring      | Register, noise, and instrument steps pin the formulas |
| No refactoring of the emulator or worker                                 | No source step exists - tests only                     |

No requirement lacks a covering step. The `TESTING.md` gap-list update is the
documentation-first step required by the workflow, not a record requirement.

## Ambiguity

- "Modal behaviors likely to regress" admits any subset - resolved to the nine dialogs whose behaviors are pin-able headlessly; `MidiModal` and `MarkdownModal` defer to a later window because their verification needs clipboard, FileReader, and layout stubs that jsdom cannot fully provide.
- "SoundDriver" surfaces - `src/synth/SoundDriver.ts` is types-only; the runtime surfaces are `YM2149` and `playbackUtils`, which the plan covers.

## Implementability

- `test/synth/YM2149.test.ts` exists and exports the `createAudioContextStub`/`makeInstrument` patterns the new files reuse - verified.
- `src/workers/sequencerWorker.ts` registers a `self` `message` listener and posts `tick`/`update`/`stop` payloads - verified; jsdom `self === window` accepts `dispatchEvent` and a `postMessage` spy.
- `vitest.config.ts` include glob `test/**/*.{test,spec}.{ts,tsx}` covers the new `test/workers/` and `test/modals/` directories - verified.
- `TESTING.md` records the `src/workers/` and `src/modals/` gap lines the plan rewrites - verified at lines 284-289.
- The modal components named exist under `src/modals/` - verified by directory listing.

No step fails the check.

## Fidelity

- Enumeration fidelity - the pinned constants come from `SPECIFICATION.md`: `f = clock / (16 * period)`, A-4 periods 284/142, `YM_LOG_VOLUME_TABLE`, the active-low mixer bit map, `tick = 1000 / frame`, envelope every 2 ticks noted as integration-owned.
- Vocabulary freeze - worker message types `start`/`stop`/`update`/`setParams` and `tick`/`update`/`stop` match the module verbatim.
- Cross-party parity - the worker test drives the same `MessageEvent`/`postMessage` pair the hook consumes.
- Constants completeness - `ticksPerRow` 3, `patternLength` 64, `tickInterval` 20 ms defaults and the clamp values 20/20000/4095 are enumerated.
- Boundary decisions - `useSequencer` is decided untestable headlessly (real `Worker` construction) and the worker module test substitutes for it; `FilePickerModal.test.tsx` stays in place.

## Findings Returned to Planning

none
