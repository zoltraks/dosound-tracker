# Version 1.5.4 Review

## Document Information

|             |                                                              |
| ----------- | ------------------------------------------------------------ |
| Version     | 1.5.4                                                        |
| Review Date | 2026-11-11                                                   |
| Commands    | git log, git status, npm test, npx playwright test, grep, ls |

## Scope

The five change records under `change/1.5.4/` plus the window's
refactoring pair under `refactoring/1.5.4/`. One record
(`introduce-operation-timing-modes`) joined the directory after intake
and was re-enumerated here per the run-state rule - it was already
shipped inside commit `313efd5` and is verified, not re-implemented.

## Recorded Work

| Document                                         | Kind        | Result                                                                             |
| ------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------- |
| change/1.5.4/define-self-routines.md             | Chore       | shipped; verified - `WORKFLOW.md` Self-Routines + `GUIDELINES.md` reference        |
| change/1.5.4/retire-release-tag-convention.md    | Chore       | shipped; verified - `VERSIONING.md` records the no-tags convention                 |
| change/1.5.4/per-format-strategy-relevance.md    | Feature     | landed this window - `*` markers + scope caption on the export modal               |
| change/1.5.4/upgrade-vitest-5.md                 | Chore       | landed this window - vitest/@vitest/* 5.1.0, jsdom 30.1.3, localStorage shim fix   |
| change/1.5.4/introduce-operation-timing-modes.md | Feature     | shipped in `313efd5`; verified - report modes + operations table in `WORKFLOW.md`  |
| refactoring/1.5.4/REFACTORING.md + ASSESSMENT.md | Refactoring | implemented - `useExportOperations`, `onExportFormat` dispatcher, dead-surface cut |

## Repository Analysis

The user committed the window's first half mid-run as `313efd5`. The
vitest upgrade and the refactoring pass sit uncommitted in the working
tree; confirmation is by artifact verification against the tree.

- **Confirmed** - all five records and the refactoring pair. Spot
  evidence: `WORKFLOW.md` carries the Self-Routines section and the
  named report-modes text with the operations-table contract;
  `VERSIONING.md` states the project creates no git tags;
  `src/utils/export/exportStrategy.ts` holds the scope map and the
  caption builder consumed by `ExportModal`'s `aria-hidden` markers;
  `package.json` pins `vitest ^5.1.0` and `test/setup-localstorage.ts`
  installs the plain-object mock through a `defineProperty` fallback;
  `src/hooks/file/useExportOperations.ts` holds the renamed hook and
  `ModalManager`/`ExportModal`/`useAppModals` take the single
  `onExportFormat` prop; `FORMAT.md` and `SPECIFICATION.md` carry the
  Tight relabel and the `exportAssemblyTight.test.ts` reference.
- **Unconfirmed** - none.
- **Undocumented** - none.
- **Deviations** - `per-format-strategy-relevance` was amended in
  place: the modal has no selected-format state, so relevance is
  conveyed by button markers plus a caption rather than per-selection
  annotation. `upgrade-vitest-5` needed a test-infrastructure compat
  fix (`setup-localstorage.ts`) beyond the dependency bump. The
  refactoring assessment records a fourth pass-through layer
  (`useAppModals`) and a dead `exportStrategy` argument beyond the
  proposal's named scope.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`
  clean.
- `npm test`: 133 files / 1198 tests.
- `npm run test:coverage`: 90.8% statements, above all thresholds.
- `npx playwright test`: 30/30 on Chromium and WebKit, including the
  export flows that exercise the new `onExportFormat` dispatcher.
