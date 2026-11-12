# Session Findings - 1.4.8 Window Run

## Stale Resolve Needs a Cancelled Earlier Run

A hook test for the `useAudioSetup` stale-guard first modeled "late engine"
as a pending `createSoundEngine` promise on the active effect run - but a
promise from the active run is not stale, it is the current creation and
lands correctly. Stale means a previous run's promise resolving after its
cleanup set `cancelled`. Testing the guard requires three runs: land the
first engine, start a pending second, start a landed third, then resolve
the second late and assert disposal. Recorded here; no durable rule needed.
