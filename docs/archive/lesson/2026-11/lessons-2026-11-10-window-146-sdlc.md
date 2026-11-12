# Session Findings - 1.4.6 Window Run

## Window Worklet Emission

A dynamic `import()` of a `?worker&url` specifier compiles to a dangling
chunk reference under the rolldown build - the emitted `dist/js/` holds no
file for it and every static gate passes. The static `?worker&url` import
emits the self-contained worker bundle. Routed to `WORKFLOW.md` Tooling
Notes.

## Dev Server Shadowing the Preview Port

`playwright.config.ts` `reuseExistingServer` let a stale dev server on
:8008 answer e2e and probe traffic - dev-mode `?worker&url` wrappers and
`?worker_file` resources differ from the emitted `js/` names. Routed to
`WORKFLOW.md` Tooling Notes.

**Webkit File-Load Flake**

The `saves and loads a song file` webkit smoke case flaked under five
parallel workers and passed in isolation - a timing artifact, not a
regression. Routed to `TESTING.md`.

## Comment-Sweep Empty Bodies

Two delegated sweeps hit the same artifact: deleting the sole comment in a
`.then(() => {})` or an `else if` body leaves a dead link or trips
`no-empty`. Sweeps restore a deliberately-empty marker or collapse the
construct. Routed to `WORKFLOW.md` Tooling Notes.

## YM2149 Initial State Divergence

The constructor's literal `YMState` (`noiseEnabled: false`) disagrees with
`deriveYmState` on an all-zero register file (active-low bits decode
`true`). Observable through `getState()` before the first write - deferred
to a change record per the Deferral rule.
