# Modal Prop Surface and Extraction Coverage Assessment

## Proposal Summary

The proposal carried two findings: collapse the duplicated modal prop surface in `ModalManager.tsx` into an interface extension with rest-spread forwarding, and characterise the thin direct coverage on the modules extracted during the 1.6.2 window.

## Implementation Summary

Both findings landed. `ModalManagerProps` now extends `ModalContainerProps` and declares only the picker, export, and paste members the manager renders itself; the body destructures those members and forwards the rest to `<ModalContainer {...containerProps} />`. Seven new suites characterise the extracted modules under `test/hooks/midi/` and `test/hooks/song/`.

One observation was deferred rather than absorbed: the mislabeled output-close warning in `useMidiDeviceAttachments` went to `docs/change/1.7.0/correct-midi-output-close-warning.md` per the Deferral rule, since a log-message correction is observable behaviour.

## Gap Analysis

| Item                                        | Proposed                      | Achieved                      |
| ------------------------------------------- | ----------------------------- | ----------------------------- |
| Modal prop interface extension              | Extend + own members only     | Done - 19 owned members       |
| Rest-spread forwarding                      | Replace verbatim block        | Done - single spread          |
| `useMidiDeviceAttachments` characterisation | Cover error and fallback arms | Done - residual compound arms |
| `useMidiMonitors` characterisation          | Cover truncation arms         | Done - full                   |
| `useMidiOutput` characterisation            | Cover guard and debug arms    | Done - full                   |
| `midiDebugFlag` characterisation            | Cover event and read guards   | Done - residual SSR guard     |
| `songRenumber` characterisation             | Cover guard chains            | Done - residual dead guards   |
| `songOptimize` characterisation             | Cover guard and boundary arms | Done - residual compound arms |
| `useEditHistory` characterisation           | Cover the empty-redo guard    | Done - full                   |

Residual uncovered regions are unreachable by construction or environment: the `!original` early return and the `updatedFromList ||` fallback in `songRenumber` cannot trigger because the ordered id list only holds map keys, and the `typeof window` server-side guard in `midiDebugFlag` cannot trigger under jsdom. The remaining partial arms in `useMidiDeviceAttachments` and `songOptimize` are compound conditions whose uncovered permutations need property-based rather than example-based inputs.

## Verification Results

| Check                   | Result | Evidence                               |
| ----------------------- | ------ | -------------------------------------- |
| `npm run typecheck`     | pass   | `tsc -b`, zero errors                  |
| `npm run lint`          | pass   | ESLint, zero errors and warnings       |
| `npm run format`        | pass   | Prettier applied                       |
| `npm run build`         | pass   | `tsc -b && vite build`                 |
| `npm test`              | pass   | 172 files, 1598 tests, zero failures   |
| `npm run test:coverage` | pass   | Totals above the 80 percent thresholds |
| `npm run test:e2e`      | pass   | 30 smoke tests on chromium and webkit  |

## Metrics Comparison

| Metric                                 | Before                 | After                  |
| -------------------------------------- | ---------------------- | ---------------------- |
| `ModalManager.tsx` size                | 463 lines              | 97 lines               |
| Shared-prop declaration count          | Two copies             | One                    |
| Test files                             | 165                    | 172                    |
| Tests                                  | 1529                   | 1598                   |
| `useMidiDeviceAttachments` line/branch | ~73 / ~74 pct          | ~94 / ~86 pct          |
| `useMidiMonitors` line/branch          | ~92 / ~50 pct          | 100 / 100 pct          |
| `useMidiOutput` line/branch            | ~88 / ~74 pct          | 100 / 100 pct          |
| `midiDebugFlag` line/branch            | ~83 / ~83 pct          | 100 / ~92 pct          |
| `songOptimize` line/branch             | ~95 / ~79 pct          | 100 / ~93 pct          |
| `songRenumber` line/branch             | ~98 / ~70 pct          | ~99 / ~88 pct          |
| `useEditHistory` line/branch           | ~98 / ~88 pct          | 100 / 100 pct          |
| Total line/branch/function coverage    | 86.9 / 80.1 / 84.9 pct | 87.3 / 80.9 / 85.0 pct |
| Production entry bundle                | ~599 kB                | ~593 kB                |

## Output Fidelity

No export path was touched. The emission goldens, export module sources, and synth emulation remain untouched, so produced outputs are byte-identical by construction.

## Behaviour Smoke Check

The rendered modal tree is identical by construction - the same values reach the same elements through one spread. The Playwright smoke suite exercised the live slice: settings modal open, commit, and persistence, the About and changelog modals, undo and redo entry, and every export flow - 30 tests passed on chromium and webkit.

## Conclusion

Pass. The duplicated prop surface is declared once, the fresh extractions carry direct coverage at or above gate level, and the verification loop is clean including the runnable-artifact slice. The deferred log-label fix sits in the 1.7.0 change group; the residual uncovered arms are documented as unreachable or property-based.
