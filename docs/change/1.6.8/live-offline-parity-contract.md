# Close the live/offline playback drift surface

**Type:** Refactor

**Source:** AUDIT-1.7 REC-003 — FND-ARC-001 (related: FND-ARC-002)

## Summary

| Field         | Value                                                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | The tick/envelope/sub-tick state machine and instrument-to-register translation exist twice - live playback vs export simulation - and can drift silently            |
| Key decisions | Open: either extract the shared tick/envelope logic into a common module, or add contract tests asserting `playbackSimulation` parity with `useSequencerIntegration` |
| Open risks    | Extraction touches the audio-critical playback path; the deliberate live/offline split is a documented trade-off - parity tests are lower risk but keep duplication  |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Live playback and export simulation implement the same register-driving
logic twice. `src/hooks/sequencer/useSequencerIntegration.ts` carries the
live tick/envelope/sub-tick machine, while
`src/utils/playback/playbackSimulation.ts` reimplements it for offline
export rendering. The instrument-to-register translation is likewise
duplicated between `src/synth/channelInstrument.ts` and the simulation,
and `patternsById`/`mapSongLineToPlaylistEntries` appear in both trees.
A same-named `updateChannelWithInstrument` exists on both sides,
compounding the reading hazard.

The offline mirror is deliberate - exports must be deterministic and
independent of the AudioWorklet clock - and today's byte-verified export
golden tests prove the two paths agree. The risk is silent future drift:
a behavior change landed on one path only would not be caught until an
export diff or a listener notices.

The change closes the drift surface by one of two routes, decided in the
implementation plan:

- Extract the shared tick/envelope and translation logic into a common
  module both paths consume, or
- Add contract tests that replay identical songs through both paths and
  assert identical register streams, pinning parity without restructuring
  the audio path.

## Use Cases

- When a future change alters tick or envelope behavior on one path, the
  shared module or the parity contract fails loudly instead of drifting.
- When an export is produced, its register stream matches what live
  playback would have generated for the same song.

## Hints

- `synth/channelInstrument.ts` already hosts the shared translation both
  paths can reach - it is React-free by layer rule.
- The live path's AudioWorklet clock must stay on the render thread;
  whatever is extracted must not pull main-thread work into the audio
  callback.
- `docs/ARCHITECTURE.md` records the live/offline split as deliberate -
  the record preserves the split, it does not remove it.

## Out of Scope

- Changing export formats, the offline-mirror architecture, or the
  worklet clock placement.
- The layer-boundary variances in FND-ARC-002 (the `midiConfiguration`
  type cycle, the `utils -> synth` `YM_CLOCK` edge, JSX in the hooks
  tree) unless the chosen approach absorbs them naturally.
