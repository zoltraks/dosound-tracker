# Pin Live/Offline Playback Parity with Contract Tests Implementation Plan

## Summary

| Field         | Value                                                                                                                                                                                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Take the contract-tests route of REC-003: pin the register/tick/envelope parity between live playback (`useSequencerIntegration`) and export simulation (`simulateSong`) with deterministic tests, leaving the deliberate live/offline split and every `src/` file untouched                                            |
| Key decisions | Drive the live hook through `renderHook` against a register-capture `SoundEngine` fake that delegates to the shared `channelInstrument` translation; diff per-tick register files and playback-state refs against `SimulationFrame` streams; scope fixtures to the domain where the two machines are specified to agree |
| Open risks    | The contract covers the agreeing domain only - probing during implementation confirmed four genuine live/offline divergences (boundary sustain semantics, tone-inactive first-row period writes, mixer-fallback resurrection, instrument-id fallback) that stay silent until reconciled                                 |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.6.8/live-offline-parity-contract.md` (REC-003, finding
FND-ARC-001, evidence EVD-022 and EVD-039 in
`docs/report/1.6.7/AUDIT-1.7.md`).

## Best Practices

Test-only change - no production code moves, honoring the record's
pre-made decision that extraction would touch the audio-critical path
while the live/offline split is a documented deliberate architecture
(`docs/ARCHITECTURE.md` "AudioWorklet for timing" and "Export Pipeline").
The suite is deterministic: the sequencer callback is invoked with an
explicit `SequencerState` sequence mirroring the worklet's emission order
(playlist position outer, line middle, tick inner), no audio context, no
timers, and no real engine exists. Console output appears only inside
`catch` blocks around assertions per `TESTING.md`. The file lands in
`test/utils/cross/` because its subject spans `src/hooks/sequencer/`,
`src/utils/playback/`, and `src/synth/` - the cross-domain bucket the test
tree reserves for multi-subject contracts.

## Audio-Critical Requirements

The change adds tests and documentation only - it modifies no audio path,
render timing, `useCallback`/`useMemo` dependency, state management, the
YM2149 emulator, or the SoundDriver contract, so manual playback
verification is not required. The suite itself is the playback-simulation
proof the record asks for: it runs the real sequencer-integration machine
and the real export simulation over identical songs and asserts identical
register output, which is strictly stronger than a listening check for
drift detection. `SPECIFICATION.md`'s audio-critical principles are
untouched.

## Documentation Updates

- `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, `FORMAT.md` - no
  update required; the change adds a test contract and alters no
  requirement, boundary, format, or documented behavior.
- `TESTING.md` - no update required; `test/utils/cross/` already exists
  and the directory roster lists domains, not files.

## Type and State Updates

None - no source types or stores change. The test file introduces only
local fixture helpers and a `SoundEngine`-shaped fake cast through
`as unknown as SoundEngine`, matching the existing
`test/hooks/sequencer/useSequencerIntegration.test.tsx` convention.

## Step by Step Implementation

**Choose the contract-tests route and fix the seam**

The record offered extraction or contract tests; extraction was rejected
up front because it restructures the audio-critical playback path for a
MEDIUM finding whose duplication is deliberate. The strongest feasible
seam without `src/` edits is the hook's own callback: `useSequencerIntegration`
returns `sequencerCallback(state)`, which existing tests already drive
with hand-built `SequencerState` values. The engine side is faked with a
register-capture object implementing the `SoundEngine` surface the hook
uses (`writeRegister`, `beginBatch`/`endBatch` as no-ops, `silenceAll`,
and `updateChannelWithInstrument` delegating to the real shared
`channelInstrument.updateChannelWithInstrument` at a configurable clock -
the same delegation `YM2149` and `AyumiEngine` perform). This exercises
the live tick/envelope/sub-tick machine, the `playbackUtils` instrument
resolution, and the shared register translation exactly as production
does, while `simulateSong` runs unmodified on the same song.

File to create: `test/utils/cross/liveOfflineParity.test.tsx`.

```typescript
const createRegisterEngine = (clock: number) => {
  const registers = new Array<number>(REGISTER_COUNT).fill(0);
  registers[MIXER_REGISTER] = INITIAL_MIXER; // 0x38, the simulation's own initial mixer
  const io = {
    readRegister: (register: number) => registers[register] ?? 0,
    writeRegister: (register: number, value: number) => {
      registers[register] = value & 0xff;
    },
    beginBatch: () => {},
    endBatch: () => {},
  };
  const engine = {
    /* ... */
    updateChannelWithInstrument: (channel, inst, noteData, envelopeTick, volumeModifier) =>
      applyChannelInstrument(io, clock, channel, inst, noteData, envelopeTick, volumeModifier),
  } as unknown as SoundEngine;
  return { registers, engine };
};
```

**Drive one full pass and snapshot per tick**

`driveLivePlayback` renders `usePlaybackSimulation` +
`useSequencerIntegration` through `renderHook`, then invokes
`sequencerCallback` for every `(playlistIndex, lineIndex, tick)` triple in
the worklet's order - `song.speed || 6` ticks per row, `song.length || 64`
rows per position, one pass over `song.line`. After each callback it
snapshots both chips' 16-register files plus the playback-state refs
(`channelEnvelopeStepRef`, `channelSubTickRef`, `channelSustainRef`,
`channelReleasedRef`, `channelVolumeModifierRef`, `lastNotesRef`). Two
chips are covered by supplying `ym2149Ref2` and `channelCount: 6`.

**Diff against `simulateSong` frames**

`collectSimulationFrames` gathers `SimulationFrame`s via the public
`simulateSong(song, callback, { clock })`. `collectParityMismatches`
asserts frame-count equality, per-frame coordinate sanity
(playlist/line/tick), all 16 registers on chip 1 (and chip 2 when
`registers2` is present - the sparse `RegisterState` reads absent keys as
0, matching the zeroed file), and per-channel state: note identity,
`envelopeStep`, `subTick`, `sustainIndex`, `released`, `volumeModifier`.
The simulation's `isNewNote` flag has no live counterpart and is excluded
by design. Mismatches are capped at 100 and printed only on failure.

**Cover the meaningful cases**

Five deterministic cases pin the contract:

- Single-chip song (`speed: 4`, `length: 8`): three instruments exercising
  a decaying volume envelope, pitch deltas, a sustain point with
  note-off release, a mode-2 tone+noise instrument with nonzero noise
  steps, note retriggers, rests, `===` hard mutes on a sustain-less
  instrument, and per-row volume-column values.
- Two-chip song (`chipCount: 2`, `speed: 3`, two playlist positions): all
  six channels carry patterns, every position after the first re-opens
  each channel with an explicit note on row 0, and `--` slots appear
  mid-song - register streams on both chips plus channel state.
- Sustained note edge: a two-step pattern under `length: 6` sustains one
  note across rest rows while `--` channels stay silent.
- Empty playlist edge: all slots `--` produce identical silent streams.
- Non-default clock: the single-chip song re-run at `clock: 1000000`
  pins the period math's clock dependence (`song.clock` feeds both the
  live engine and the exporter option identically).

## Implementation Order

1. Read the record, audit finding, and both implementations; map the
   agreeing domain and probe candidate divergences.
2. Create `test/utils/cross/liveOfflineParity.test.tsx` with the
   register-capture engine, live driver, simulation collector, and the
   five parity cases.
3. Run `npx vitest run` on the file until green; adjust fixtures only
   inside the documented contract domain.
4. Run `npx tsc -b`, `npx eslint`, and `npx prettier --write` on the
   touched file.
5. Record divergences and preconditions in this plan's Refinements.

## Testing Strategy

**Unit tests**

The deliverable is itself a contract suite - there are no new utility
functions to unit test. `test/utils/cross/liveOfflineParity.test.tsx`
asserts, per tick, equality of: the full 16-register file on each chip,
frame coordinates, and the six-field channel state projection shared by
both machines.

Test file created: `test/utils/cross/liveOfflineParity.test.tsx`.

```typescript
expectParity(paritySongSingleChip(), 3);
expectParity(paritySongTwoChips(), 6);
expectParity(paritySongSustained(), 3);
expectParity(paritySongEmpty(), 3);
expectParity(paritySongSingleChip(), 3, 1000000);
```

**Integration tests**

The suite is the integration proof: it drives the real
`useSequencerIntegration` callback through `renderHook` with the real
`usePlaybackSimulation` state refs, the real `playbackUtils` instrument
resolution, and the real shared `channelInstrument` register translation,
against the real `simulateSong`. MIDI helpers are stubbed (the contract
is register output, not MIDI) and `isDebugMode` is off.

## Verification

- `npx vitest run test/utils/cross/liveOfflineParity.test.tsx` - 5 tests,
  all passing.
- `npx tsc -b` - clean across the project graph.
- `npx eslint test/utils/cross/liveOfflineParity.test.tsx` - zero errors,
  zero warnings.
- `npx prettier --write` applied to the touched file; `--check` clean.
- The full `npm test`, `npm run build`, and `npm run test:e2e` loops were
  not run in this session per the change scope; the touched surface is a
  single new self-contained test file verified by the targeted commands
  above.
- Audio playback verification is not applicable - no audio-path code
  changed.

## Refinements

Adjustments and findings recorded during implementation.

- **Route confirmed: contract tests.** Extraction was rejected per the
  record's own risk note - it would restructure the audio-critical
  playback path for a MEDIUM finding whose duplication is deliberate.
  The contract keeps both implementations and makes drift loud.
- **Contract preconditions.** The parity claim holds for identical songs
  under these fixed conditions, all encoded in the test header comment:
  channel mutes off (mute is live-only; exports ignore it), a single
  non-looping pass (`simulateSong` never loops; `song.loop` is live-only),
  the register file starting from the simulation's own initial state
  (mixer `0x38`, tones on, noise off - seeded into the fake so both sides
  share initial conditions), and pattern channels re-opening each
  playlist position after the first with an explicit note.
- **Probed divergences - the contract's honest boundary.** Temporary
  probe suites (since removed) confirmed four genuine live/offline
  divergences that fixture design avoids; each is a candidate future
  record, not something this change may fix under `src/`:
  1. _Playlist-boundary sustain semantics._ `simulateSong` resets
     pattern-channel state (`note`, `envelopeStep`, `subTick`,
     `sustainIndex`, `released`) at every playlist position;
     `useSequencerIntegration` deliberately carries `lastNotes`,
     sustain, and released state across positions (only `subTick`
     realigns on pattern change, per its own comment). A note or release
     ringing into the next position keeps evolving live but freezes or
     hard-mutes in the export stream. `===` on row 0 of a later position
     diverges the same way (stale live sustain index turns it into a
     release; the simulation's reset state hard-mutes), as does a `--`
     channel sustaining across the boundary (live resets `subTick`, the
     simulation does not).
  2. _Tone-inactive first-row period writes._ For a note whose envelope
     step disables the tone (mode 1 or 3), `simulateSong` still writes
     tone-period registers while `isNewNote` is set; the shared
     `channelInstrument.updateChannelWithInstrument` writes period only
     when `toneActive`. Confirmed on a mode-1 noise instrument: R0/R1
     diverge for the whole attack row.
  3. _Mixer `|| 0x38` resurrection._ `applyInstrumentToRegisters` reads
     `regs[0x07] || 0x38`, so once the mixer reaches `0x00` (every channel
     tone+noise active, e.g. mode 2 throughout) a channel that stops
     updating the mixer (mute or rest) inherits resurrected idle bits in
     the simulation while the live register file keeps the cleared bits.
     Confirmed: after a hard mute the streams differ on R7.
  4. _Instrument-id resolution._ A note with an empty instrument id falls
     back through `currentInstrument`/`firstInstrument` in the live
     `playbackUtils` wrapper and plays; the simulation resolves `''` to
     nothing and stays silent. An unresolvable non-empty id diverges
     differently: the simulation writes nothing (frozen registers) while
     the live wrapper writes volume 0.
- **Secondary edges documented, not probed.** Noise envelope steps of 0
  or an empty noise array: the live `applyNoiseEnvelopeValue` writes R6
  unconditionally when noise is active (0 for a zero step, 15 for a
  missing envelope) while the simulation writes R6 only when the computed
  period is positive. `speed: 0` or `length: 0` hit different `||`
  defaults on the two paths (live clamps to 1 via the worklet params,
  simulation defaults to 6/64). Duplicate pattern ids resolve
  last-wins in the live `patternsById` map but first-wins in
  `buildPatternLookup`. `retriggerBehavior: 'new_note_only'` is a
  simulation-only option no caller uses; the contract pins the `'always'`
  behavior both paths share.
- **State-field scope.** `envelopeStep`, `subTick`, `sustainIndex`,
  `released`, `volumeModifier`, and note identity are asserted every tick
  because both machines maintain them identically inside the contract
  domain. The simulation's `isNewNote` flag is excluded - the live path
  encodes the same idea inside `channelInstrument`'s `toneActive` gate
  (divergence 2 above). `toneMeta`, `isFirstFrame`, and frame labels are
  simulation-only artifacts with no live counterpart.
- **File placement.** `test/utils/cross/` matches the mirrored
  test-tree convention for a contract spanning hooks, utils, and synth;
  the file carries no `@vitest-environment` pragma because `renderHook`
  needs the default jsdom environment.
