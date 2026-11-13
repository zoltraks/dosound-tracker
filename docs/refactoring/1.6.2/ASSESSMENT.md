# Bounded Orchestration Extraction Assessment

## Summary

| Measure                      | Proposed | Achieved |
| ---------------------------- | -------- | -------- |
| Bounded responsibility moves | 7        | 7        |
| New modules                  | 7        | 7        |
| Hotspots reduced             | 3        | 3        |

`useMidiMessageProcessing.ts` went from 691 to 227 lines,
`useSongManagement.ts` from 651 to 296, and `useDataManagement.ts` from
657 to 564. `App.tsx` and `src/exports/asm.ts` were deliberately left
untouched per the change record's direction.

## Proposal vs Implementation

| Step                                                   | Result    |
| ------------------------------------------------------ | --------- |
| MIDI debug flag to `midiDebugFlag.ts`                  | completed |
| Monitor lists to `useMidiMonitors.ts`                  | completed |
| Output senders to `useMidiOutput.ts`                   | completed |
| Device attach effects to `useMidiDeviceAttachments.ts` | completed |
| `optimizeSongData` to `songOptimize.ts`                | completed |
| `renumberSongData` to `songRenumber.ts`                | completed |
| History block to `useEditHistory.ts`                   | completed |

Each move ran as its own step with the targeted verification loop clean
before the next began, and every moved body kept its logic and comments.

## Deviations and Rationale

- `currentOutputRef` was added to three dependency arrays in
  `useMidiOutput.ts` and to two in `useMidiDeviceAttachments.ts`, and
  the three setters to the `undo`/`redo` arrays in `useEditHistory.ts`.
  The original arrays relied on locally declared refs and setters that
  `react-hooks/exhaustive-deps` can prove stable; as incoming parameters
  they must be listed for the zero-warning lint gate. Refs and setters
  are identity-stable, so the subscriptions behave identically.
- `test/hooks/cross/songManagement.test.ts` was repointed to
  `songOptimize.ts` and `songRenumber.ts`. The proposal named
  `useDataManagement.ts` as the single call site and missed the test
  import - the suite still exercises the same code.
- `bytesToHex` landed in `src/utils/midi/midiUtils.ts` rather than a new
  module, since the input decode and the senders share it.

## Verification Results

- Targeted loop clean after every one of the seven moves.
- Full loop clean at close: typecheck, lint (zero warnings), Prettier,
  production build (entry chunk under the 600 kB warning limit), and
  `npm test` - 165 files, 1,529 tests, all passing.
- `npm run test:e2e` - 30/30 smoke tests pass on chromium and webkit,
  including the undo/redo and settings-persistence flows covering the
  moved surfaces.
- Export sources untouched; the export and YAML fixture suites pass,
  so emitted bytes show zero diff against the committed tree.
- The documented `SPECIFICATION.md` audio-critical lint suppressions are
  untouched, and no `useCallback`/`useMemo` dependency semantics changed
  on the audio path.

## Remaining Gaps

- `App.tsx` remains the largest file and the main navigation cost - a
  candidate for a later window under its own record.
- `src/exports/asm.ts` stays whole; any move there needs the
  byte-identical export-fixture gate from the start.
- `useMidiActions.ts`, `useMidiHandling.ts`, and `useMidi.ts` were out
  of this record's measured list and unchanged.

## Lessons Learned

- Parameter-boundary moves flip `exhaustive-deps` stability proofs:
  refs and setters that were free as locals must be listed as deps once
  they arrive as parameters. Listing them preserves behavior and keeps
  the zero-warning gate.
- Call-site surveys must include `test/` imports, not only `src/` -
  the test file was a second call site for both extracted commands.
- The per-move verification rhythm caught nothing broken but kept each
  step provably atomic; the composed-hook boundaries make the next
  window's seams easier to name.
