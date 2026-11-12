# Restore the Branch Coverage Gate Refactoring Proposal

## Problem

`npm run test:coverage` fails the configured 80% branch threshold: 78.53%
across all files, 79.47% when the in-flight `scripts/` entry is excluded.
The breach predates this window - the landed records only added tests.

The gap sits in surfaces with reachable but untested branches:

- `src/hooks/song/useSongLifecycleDialogs.ts` - 2/13 branches; the
  demo-song click dirty-guard and the `handlePickDemoSong` fetch chain
  (HTTP error, HTML content-type rejection, success path) are uncovered.
- `src/utils/storage/persistenceMirror.ts` - 18/22 branches.
- `src/components/envelope/EnvelopeSection.tsx` - 7/12 branches; the
  `sustainIndex` ternary and the five `EnvelopePanel` `onChange`
  closures are uncovered.
- `src/components/midi/MidiMonitorPanel.tsx` - 4/6 branches; the scroll
  effect and the empty-copy guard are uncovered.
- `src/components/playlist/PlaylistLine.tsx` - 20/25 branches.
- `src/components/playlist/PlaylistHeader.tsx` - 3/8 statements.
- `src/components/piano/PianoKeyboard.tsx` - 31/96 branches.
- `src/hooks/song/useTrackOperations.ts` - 36/125 branches.

A second finding: `handleNavigateInstrument` in `src/App.tsx` embeds the
instrument-stepping algorithm - reference lookup, id fallback, slot-id
fallback for unsaved slots, and modulo wrap - as a component callback
with no unit-level test access.

Files the refactoring touches: `src/App.tsx`,
`src/utils/instrument/instrumentNavigation.ts` (new),
`test/utils/instrument/instrumentNavigation.test.ts` (new),
`test/hooks/song/useSongLifecycleDialogs.test.tsx`,
`test/utils/storage/persistenceMirror.test.ts`,
`test/components/envelope/`, `test/components/midi/`,
`test/components/playlist/` suites as needed.

## Goal

`npm run test:coverage` measures at least 80% branch coverage on the
project side of the tree (the `scripts/` row is a foreign session's
mid-flight file and is reported separately), with every added test
asserting real behavior on reachable branches - no contrived
branch-tickling. The instrument-stepping algorithm lives as a pure
function under `src/utils/instrument/` with unit tests, and `App.tsx`
delegates to it.

## Findings

**Issue**

`test:coverage` fails the enforced branch gate: `4739/6034` covered
branch paths (78.53%). Verified-reachable uncovered regions cluster in
the surfaces listed under Problem.

**Impact**

An enforceable gate is red on the tree - any production-ready or
release-bound check that runs `test:coverage` reports failure, and real
behavior in demo-song loading, envelope editing, and monitor panels is
uncharacterized.

**Recommendation**

Add characterization tests to the verified-reachable regions, ordered by
yield per file. No source changes inside this finding - tests only.

**Risk Level**

Major

**Breaking Change Assessment**

No Breaking Change

**Issue**

`handleNavigateInstrument` in `src/App.tsx` holds a multi-fallback
lookup algorithm (reference match, then `id` match, then
`normalizeInstrumentId` slot decode for unsaved slots, then modulo wrap)
inside a `useCallback`.

**Impact**

Business logic sits in a component, reachable only through component
tests; the fallback chain has no direct unit coverage.

**Recommendation**

Extract the resolver into `src/utils/instrument/instrumentNavigation.ts`
as a pure function and delegate the callback to it, with unit tests
pinning each fallback and the wrap-around.

**Risk Level**

Minor

**Breaking Change Assessment**

No Breaking Change

**Example**

Before:

```ts
let index = instruments.findIndex((inst) => inst === currentInstrument);
if (index === -1) {
  index = instruments.findIndex((inst) => inst.id === currentInstrument.id);
}
```

After:

```ts
const target = resolveNextInstrument(instruments, currentInstrument, delta);
```

**Issue**

The IPC channel literals `app-close-requested`, `app-close-confirmed`,
and `app-close-cancelled` are duplicated across `electron/main.cjs` and
`electron/preload.cjs`.

**Impact**

Two-file literal duplication - below the Rule-of-Three threshold; the
renderer consumes a typed `ElectronApi` and never sees the literals.

**Recommendation**

Defer - recorded for completeness, no change this cycle.

**Risk Level**

Suggestion

**Breaking Change Assessment**

No Breaking Change

## Plan

**Extract the instrument-stepping resolver**

Create `src/utils/instrument/instrumentNavigation.ts` exporting
`resolveNextInstrument(instruments, currentInstrument, delta)` carrying
the exact fallback chain from `App.tsx`. Replace the callback body in
`App.tsx` with a delegation that keeps the same dependency array. Add
`test/utils/instrument/instrumentNavigation.test.ts` covering reference
match, id match, slot-id fallback, wrap in both directions, and the
empty-instrument early return.

**Characterize the demo-song lifecycle paths**

Extend `test/hooks/song/useSongLifecycleDialogs.test.tsx` for
`handleDemoSongClick` dirty-guard redirection and `handlePickDemoSong`:
HTTP-error rejection, `text/html` content-type rejection, and the
success path through `loadSongFromText` plus `setPosition`. Fetch stubs
return the full Response surface (`ok`, `headers.get()`, `text()`) per
the recorded testing rule.

**Characterize the remaining reachable branches**

Add or extend suites for `persistenceMirror` reset/transaction edges,
`EnvelopeSection` sustain ternary and panel `onChange` closures,
`MidiMonitorPanel` scroll and empty-copy guard, `PlaylistHeader` render,
`PlaylistLine` interaction branches, and the reachable subset of
`PianoKeyboard` and `useTrackOperations` needed to cross the threshold.
Each suite registers `afterEach(() => cleanup())` per component-test
hygiene and respects the audio-critical principles - no
`AudioContext`-dependent assertions on the piano surface beyond what
existing suites already establish.

**Measure and re-check**

Run `npm run test:coverage`, confirm the project-side branch ratio
crosses 80%, and record the all-in figure with the `scripts/` row
attributed to the foreign session's in-flight work.

## Step Granularity

The extraction step lands alone with its own tests before the coverage
suites start, so a regression from the only source change is obvious in
isolation. Coverage work proceeds one file at a time with a targeted
test run after each suite.

## Risk

- `useSongLifecycleDialogs` needs a fetch stub with the full Response
  surface - a stub missing `headers.get()` fails as a TypeError, not an
  assertion.
- `EnvelopeSection` and `MidiMonitorPanel` are component suites - the
  mandatory `afterEach` cleanup applies, and `MidiMonitorPanel`'s scroll
  effect must be asserted through behavior, not timers.
- `PianoKeyboard` and `useTrackOperations` are large surfaces - cover
  only the reachable subset needed for the threshold; do not chase
  defensive guards the public surface cannot reach.
- `persistenceMirror` tests may already exist from the prior window -
  extend rather than duplicate.

## Acceptance Criteria

- `resolveNextInstrument` extracted, all call behavior identical, unit
  tests green.
- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`,
  `npm test` - all clean.
- `npm run test:coverage` project-side branch coverage at or above 80%;
  the `scripts/` in-flight file's contribution reported separately.
- No behavior change: every edit outside `test/` is the single
  extraction, and `App.tsx` keeps its prop surface unchanged.
