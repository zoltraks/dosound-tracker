# Version 1.5.3 Review

## Document Information

|             |                                                                     |
| ----------- | ------------------------------------------------------------------- |
| Version     | 1.5.3                                                               |
| Review Date | 2026-11-13                                                          |
| Commands    | git log, git status, git diff, npm test, npm run test:e2e, grep, ls |

## Scope

The eleven change records under `change/1.5.3/` plus the window's
refactoring pair under `refactoring/1.5.3/`. Three records
(`rename-midi-export-label`, `rename-worklet-dist-assets`,
`restrict-changelog-edits`) were filed retroactively during this review
to cover user-requested changes that landed without records.

## Recorded Work

| Document                                                    | Kind        | Result                                                                    |
| ----------------------------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| change/1.5.3/chunk-optimized-delay-runs.md                  | Fix         | merged delays split at the 256-frame single-command bound                 |
| change/1.5.3/upgrade-js-yaml-5.md                           | Chore       | js-yaml 5.5.0 behind a 19-golden byte-equivalence harness                 |
| change/1.5.3/remove-eq-pan-buttons.md                       | Removal     | EQ pan buttons out; file-declared pans still honored                      |
| change/1.5.3/remove-song-info-chip-stereo-toggles.md        | Removal     | Chip/Stereo toggles out, label colons dropped; file fields still applied  |
| change/1.5.3/fix-sequencer-params-dropped-before-context.md | Fix         | mount-time params queue through `pendingMessagesRef` until the node lands |
| change/1.5.3/drop-optimized-strategy.md                     | Removal     | strategy ladder SIMPLE/COMPLEX/TIGHT; export-modal line height restored   |
| change/1.5.3/rename-btn-class-suffix.md                     | Refactor    | `-btn` classes and derived custom properties renamed to `-button`         |
| change/1.5.3/rename-compact-strategy-to-tight.md            | Refactor    | `COMPACT` strategy and identifiers renamed to `TIGHT`                     |
| change/1.5.3/rename-midi-export-label.md                    | Fix         | export button reads `MIDI`; `.mid` extension unchanged                    |
| change/1.5.3/rename-worklet-dist-assets.md                  | Chore       | built worklets emit as `ayumi.js` and `sequencer.js`                      |
| change/1.5.3/restrict-changelog-edits.md                    | Chore       | CHANGELOG edits restricted to the bump or explicit request                |
| refactoring/1.5.3/REFACTORING.md + ASSESSMENT.md            | Refactoring | implemented as proposed; summary strings pinned by characterisation tests |

## Repository Analysis

The window's work sits uncommitted in the working tree. Confirmation is
by artifact verification against the tree rather than commit matching.

- **Confirmed** - all eleven records and the refactoring pair. Spot
  evidence: `package.json` pins `js-yaml ^5.5.0` and
  `test/utils/yaml/yamlEmission.test.ts` holds the goldens;
  `combineDelayLines` runs with `maxFramesPerCommand: 256`;
  `EQPanel.tsx` has no pan buttons and `InformationPanel.tsx` no
  Chip/Stereo toggles; `pendingMessagesRef` queues pre-node messages in
  `useSequencer.ts` with `test/hooks/sequencer/useSequencer.test.tsx`
  proving delivery; `ExportStrategy` is `'simple' | 'complex' | 'tight'`
  with a `TIGHT DUMP` radio and the settings read migrating `optimized`
  and `compact` to `tight`; `-button` class names throughout `App.css`;
  `dist/js/ayumi.js` and `dist/js/sequencer.js` emit from the worker
  name map; `exportSummary.ts` carries the three extracted helpers and
  `useFileOperations.ts` shrank 676 to 534 lines under the new
  characterisation suite.
- **Unconfirmed** - none.
- **Undocumented** - none after the three retroactive records filed
  above.
- **Deviations** - the drop-optimized record grew to cover the export
  modal line-height restoration when the actual 1.2.8 spacing mechanism
  was found; the refactoring assessment records four behavior-preserving
  deviations (`scopeType`, `includeStrategy`, the context interface, and
  the top-level handler rewiring).

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`
  clean.
- `npm test`: 132 files / 1190 tests.
- `npm run test:e2e`: 30/30 on Chromium and WebKit.
