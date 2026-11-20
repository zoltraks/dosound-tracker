# Reconcile confirmed live/offline playback divergences

**Type:** Fix

## Summary

| Field         | Value                                                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | The 1.6.8 parity contract pinned live-vs-export agreement and exposed four confirmed divergences plus secondary edges - each needs a keep-or-fix decision |
| Key decisions | Deferred from 1.6.8 per the deferral rule - discovered work never lands silently inside the window that found it                                          |
| Open risks    | Some divergences may be deliberate live behavior (mutes, loop) rather than export bugs - investigation must classify before fixing                        |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The `liveOfflineParity` contract tests added in the 1.6.8 window
(`test/utils/cross/liveOfflineParity.test.tsx`) compare the live
sequencer's register stream against `simulateSong` on identical songs.
Probing for the contract surfaced divergences the byte-verified export
goldens cannot see, because the goldens pin the simulation against
itself, not against live playback.

Confirmed divergences:

- **Playlist-boundary sustain** - the simulation resets pattern-channel
  state at each playlist position; live playback deliberately carries
  notes, sustain, and released state across positions (only `subTick`
  realigns).
- **Tone-inactive first-row period writes** - the simulation writes
  R0-R5 through `isNewNote` when the mode disables tone;
  `channelInstrument` writes the period only while `toneActive`.
- **Mixer `|| 0x38` resurrection** - the simulation's
  `regs[0x07] || 0x38` fallback diverges from the live register file once
  the mixer reaches `0x00` and a channel stops updating.
- **Instrument-id resolution** - an empty note instrument falls back to
  `currentInstrument`/`firstInstrument` and plays live; the simulation
  stays silent.

Secondary edges recorded for the same investigation: noise-envelope R6
write asymmetry, `speed`/`length: 0` defaults, duplicate pattern-id
first/last-wins, simulation-only `retriggerBehavior`, and live-only
mutes/`song.loop`.

For each divergence the change determines whether live or export is
correct - a tracker export should reproduce what the user hears - then
aligns the wrong side or documents the difference as intentional. The
parity contract's preconditions (unmuted, single non-looping pass,
aligned initial registers, row-0 retrigger at boundaries) widen as each
divergence closes.

## Use Cases

- When a song plays live and exports to DOSOUND/WAV/VGM, the register
  stream matches what the listener heard.
- When the parity contract's precondition list shrinks, each removed
  precondition is a verified alignment, not an assumption.

## Hints

- `docs/plan/1.6.8/live-offline-parity-contract-implementation.md`
  Refinements carries the full divergence analysis with reproduction
  notes.
- `src/utils/playback/playbackSimulation.ts` is the export side;
  `src/hooks/sequencer/useSequencerIntegration.ts` plus
  `src/synth/channelInstrument.ts` are the live side.
- Audio-path timing rules apply - any shared-logic extraction must not
  add per-tick work on the render path.

## Out of Scope

- The parity contract tests themselves - they already exist and pass
  under their documented preconditions.
- New export formats or format-spec changes.
