# Restore the Branch Coverage Gate Refactoring Assessment

## Summary

Overall result: complete.

The enforced `npm run test:coverage` branch threshold now passes at
80.08% across all files. The pre-window project-side deficit is closed
(79.47% to 80.08%), and the foreign in-flight script's mid-flight gap is
closed as well (35.43% to 80.31% branches) per a user decision during
execution.

| Item                                                 | Proposed | Achieved  |
| ---------------------------------------------------- | -------- | --------- |
| `resolveNextInstrument` extraction plus unit tests   | yes      | completed |
| `useSongLifecycleDialogs` demo-song characterization | yes      | completed |
| `persistenceMirror` reset and transaction edges      | yes      | completed |
| `EnvelopeSection` uncovered branches                 | yes      | completed |
| `MidiMonitorPanel` scroll and copy guard             | yes      | completed |
| `PlaylistLine` interaction branches                  | yes      | completed |
| `PlaylistHeader` render                              | yes      | skipped   |
| `PianoKeyboard` reachable subset                     | yes      | skipped   |
| `useTrackOperations` reachable subset                | yes      | skipped   |
| Foreign `retention-sweep.mjs` coverage               | no       | added     |
| All-in branch coverage >= 80%                        | yes      | 80.08%    |

## Proposal vs Implementation

**Extract the instrument-stepping resolver** - completed.

`src/utils/instrument/instrumentNavigation.ts` exports
`resolveNextInstrument` carrying the full fallback chain.
`src/App.tsx` delegates with the same dependency array.
`test/utils/instrument/instrumentNavigation.test.ts` pins reference
match, id match, slot-id fallback, hex clamp, non-hex fallback, and
wrap-around in both directions.

**Characterize the demo-song lifecycle paths** - completed.

`test/hooks/song/useSongLifecycleDialogs.test.tsx` now covers the
dirty-guard redirect, the clean open, the fetch success path, non-OK
rejection, `text/html` content-type rejection, fetch rejection, and the
always-closing picker.

**Characterize the remaining reachable branches** - partially completed.

Covered: `persistenceMirror` (four new tests, 100% branches),
`EnvelopeSection` (notes-region branches), `MidiMonitorPanel` (new
suite), `PlaylistLine` via `PlaylistPanel` (plain Enter commit, Escape
abandon). Added beyond the proposal: `PianoKey` handler matrix,
`trackUtils` clipboard and volume scans, `patternUtils` delete padding,
`midiUtils` note fallback.

Skipped: `PlaylistHeader` (zero uncovered branch paths, statements
only), `PianoKeyboard`, and `useTrackOperations` (threshold reached
without them; see Remaining Gaps).

**Measure and re-check** - completed, with a scope addition.

The proposal expected the project-side ratio alone to clear the gate.
The enforced threshold applies to the all-in figure, which still failed
at 79.04% because the foreign `scripts/retention-sweep.mjs` contributes
127 branch paths to the shared denominator. The user directed covering
the script itself, so `test/scripts/retentionSweepCoverage.test.ts`
adds classification, plan-edge, subprocess end-to-end, and in-process
`main()` coverage for it.

## Deviations and Rationale

**Covering the foreign script** - scope addition, user-directed.
Subprocess probes contribute zero v8 coverage, so `main()` is exercised
in-process by setting `process.argv` (including `--root <fixture>`)
before a fresh `import()` of the module. No source changes were made to
the foreign file; the suite lives in a separate test file to avoid
colliding with the other session's in-flight edits.

**Skipped heavy surfaces** - scope decision. `PianoKeyboard` and
`useTrackOperations` keep large uncovered regions, but crossing the
threshold no longer required them; their remaining branches are deep
interaction and playback paths better suited to a dedicated cycle.

**Corrected uncovered-region data** - incorrect analysis in the
proposal. `EnvelopeSection`'s real uncovered branches were the notes
status region (out-of-range index, missing entry `?? ''`, hidden
class, click forwarding), not the `sustainIndex` ternary named in the
proposal; tests were written against the measured lines instead.

**Unreachable tails left uncovered** - deliberate. `instruments[next]
?? null` in the new resolver, the `PIANO_SHOW_EXTRA_TOP_C` constant
block, and the `|| 'inst'` fallback in `exportFileNaming` are defensive
tails the public surfaces cannot reach; contriving them would violate
the no-tickling rule.

**Subprocess tests retained** - the spawned `node` runs contribute no
coverage but verify real exit codes and real file mutations end to end;
kept as behavioral e2e alongside the in-process coverage runs.

## Verification Results

| Check                    | Result                                |
| ------------------------ | ------------------------------------- |
| `npm run typecheck`      | clean                                 |
| `npm run lint`           | clean, no warnings                    |
| Prettier (touched files) | clean                                 |
| `npm run build`          | clean; pre-existing 600 kB chunk warn |
| `npm test`               | 154 files, 1415 tests, all pass       |
| `npm run test:coverage`  | all four thresholds pass              |

Coverage moved from 78.53% to 80.08% branches all-in; project-side
(ex-`scripts`) from 79.47% to 80.08%; `scripts/` row from 35.43% to
80.31%. Test count moved from 1354 (147 files) to 1415 (154 files).

## Remaining Gaps

`PianoKeyboard` (~45 uncovered branch paths), `useTrackOperations`
(~60), `PlaylistPanel` internals, `markdown.ts`, `songParser.ts`, and
`useUiStore` keep reachable-but-untested regions. Recommend a dedicated
characterization cycle for the two largest surfaces rather than
incremental tickling; they are interaction- and playback-heavy and need
the existing harness conventions, not ad-hoc renders.

Several files keep defensive tails (constant-flag blocks, `?? null`
and `||` fallbacks unreachable through public signatures). These are
accepted residual uncovered paths, not gaps to chase.

## Lessons Learned

The coverage denominator counts whatever test files import. A foreign
script entering `test/` mid-flight changed the all-in baseline; the
gate evaluation must always separate project debt from in-flight
contributions before planning yield.

CLI scripts under v8 coverage are invisible to subprocess runs.
Spoofing `process.argv` plus `vi.resetModules()` and a fresh `import()`
runs `main()` inside the instrumented process; fixtures under
`os.tmpdir()` keep git discovery honest (a fixture inside the repo
silently resolves the parent repository).

Uncovered-line censuses beat folder percentages for planning.
Two proposed targets (`PlaylistHeader`, the `sustainIndex` ternary)
dissolved on measurement, while unlisted small files (`PianoKey`,
`trackUtils`, `patternUtils`, `midiUtils`) offered cheaper paths.
