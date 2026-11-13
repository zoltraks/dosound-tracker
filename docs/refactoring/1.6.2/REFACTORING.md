# Extract Bounded Orchestration Responsibilities

Change record: `docs/change/1.6.2/extract-bounded-orchestration-responsibilities.md`

## Problem

The 2026-11-12 audit measured a central orchestration root plus several
modules in the 650-1100 line range: `src/App.tsx`,
`src/hooks/midi/useMidiMessageProcessing.ts`, `src/exports/asm.ts`,
`src/hooks/song/useDataManagement.ts`, and
`src/hooks/song/useSongManagement.ts`. Each mixes several independently
testable responsibilities behind one file, which makes navigation the
cost named in `ARCHITECTURE.md`.

`useMidiMessageProcessing.ts` carries four coherent concerns: a
module-level debug-flag cache, the in/out monitor lists, the MIDI output
senders, and the device attach/detach effects.
`useSongManagement.ts` is a pure module holding two self-contained
commands - `optimizeSongData` and `renumberSongData` - beside the
schema-normalization and initialization helpers.
`useDataManagement.ts` holds the undo/redo history block beside the
song, instrument, and file operations.

`src/App.tsx` keeps the documented `react-hooks/exhaustive-deps`
suppression and is not touched this window, and `src/exports/asm.ts`
stays untouched - the byte-identical export surface is the riskiest
seam and the record directs the work to start elsewhere.

## Goal

Each named responsibility lives in its own module under its domain's
existing directory, with behavior identical before and after every
move. `useMidiMessageProcessing.ts` keeps the hook signature, the input
decode, and the composition only. `useSongManagement.ts` keeps the
migration, default, and restore helpers. `useDataManagement.ts` keeps
the song, instrument, and file operations and delegates history to a
dedicated hook. The public surface each module returns stays the same -
callers see no change.

## Plan

One bounded responsibility moves per step, and the verification loop
runs clean before the next step begins.

**Move the MIDI debug flag**

Extract the module-level cache, its `storage` and
`LOCAL_STORAGE_WRITE_EVENT` invalidation listeners, and
`isDebugEnabled` into `src/utils/midi/midiDebugFlag.ts`.
`useMidiMessageProcessing.ts` imports `isDebugEnabled` back.

**Move the monitor lists**

Extract the in/out monitor state, the entry appenders with the
`MAX_MONITOR_ENTRIES` truncation, the id counter, and `clearMonitors`
into `src/hooks/midi/useMidiMonitors.ts`. The parent hook composes it
and forwards the appenders.

**Move the MIDI output senders**

Extract `sendNoteMessage`, `sendNoteOn`, `sendNoteOff`,
`sendProgramChange`, and `sendSystemReset` into
`src/hooks/midi/useMidiOutput.ts`, carrying `sendBuffer` with them.
`bytesToHex` moves to `src/utils/midi/midiUtils.ts` so the input decode
and the senders share it. The hook takes the configuration, the output
device list, the out-monitor appender, and the output ref.

**Move the device attach effects**

Extract the input attach, output attach, and unmount cleanup effects
plus `isElectronEnv` into `src/hooks/midi/useMidiDeviceAttachments.ts`.
The hook owns the input and handler refs and returns the output ref the
senders consume; the parent wires `handleMidiMessage` and
`sendSystemReset` in.

**Move the optimize command**

Extract `optimizeSongData` and `OptimizeSongResult` into
`src/hooks/song/songOptimize.ts`. `useSongManagement.ts` re-exports
nothing - the single call site in `useDataManagement.ts` imports the
new module.

**Move the renumber command**

Extract `renumberSongData` and `RenumberSongResult` into
`src/hooks/song/songRenumber.ts` on the same pattern.

**Move the history block**

Extract the history ref, size state, `commitHistory`, `clearHistory`,
the position-bridge ref and sync effect, `snapshotCurrent`,
`recordHistory`, `undo`, `redo`, and the persisted-save handle into
`src/hooks/song/useEditHistory.ts`. The hook takes the live song,
instrument, the three setters, and the position bridge, and returns
`recordHistory`, `clearHistory`, `undo`, `redo`, `canUndo`, `canRedo`.

## Step Granularity

Seven moves, each confined to one responsibility and one new module.
No step mixes a move with a rename or a behavior change - the moved
code keeps its bodies, dependencies, and comments. The public return
shape of every touched hook is unchanged, so existing tests run
unmodified as the regression net.

## Risk

Hook wiring on the playback path is the named hazard: a `useCallback`
or `useEffect` dependency change can alter timing. Every move copies
dependency arrays verbatim and the broad `exhaustive-deps` suppression
in `App.tsx` is not in scope. The MIDI hook's returned object must keep
identity-stable callbacks, so each extraction preserves the original
`useCallback` dependencies. `useMidiMessageProcessing.test.tsx`,
`useMidiHandling.test.tsx`, the `useDataManagement` suites, and the
`songManagement` suites cover the moved surfaces - a regression shows
in the suite of the moved step.

## Acceptance Criteria

- `useMidiMessageProcessing.ts`, `useSongManagement.ts`, and
  `useDataManagement.ts` each shrink to their remaining
  responsibilities; the moved logic lives in the named new modules.
- Identical behavior on the manual smoke flows - MIDI monitor output,
  undo/redo across a reload, optimize and renumber summaries.
- Zero diff in produced export outputs for the supplied fixtures.
- The full verification loop passes after every move: typecheck, lint,
  format, build, and `npm test` clean with no regression against the
  coverage thresholds.
- The documented `SPECIFICATION.md` audio-critical lint suppressions
  are untouched.
