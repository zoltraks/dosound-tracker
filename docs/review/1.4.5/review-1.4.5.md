# Version 1.4.5 Review

## Document Information

|             |                                                                       |
| ----------- | --------------------------------------------------------------------- |
| Version     | 1.4.5 (window closing into 1.4.6)                                     |
| Review Date | 2026-11-10                                                            |
| Commands    | git status, git diff, npm run typecheck, lint, build, test, npm audit |

## Scope

All eight active change records under `docs/change/1.4.5/` - the
`docs/report/1.4.5/AUDIT-1.5.md` triage (quit-confirm wiring, file-origin
narrowing, minimatch advisories, MPL policy, release tags, accessibility
baseline, composition-root decomposition, performance measurements) - plus the
window's own refactoring cycle. Three audit recommendations were not triaged
and resolve as declined: REC-005 (prune diverged branches - optional, an
owner-side remote action), REC-006 (mitigate continuity concentration -
optional, continuity is already a recorded accepted trade-off in
`WORKFLOW.md`), REC-010 (re-evaluate no-CI decision - optional, the recorded
decision stands per `GUIDELINES.md`).

## Recorded Work

| Document                                         | Kind        | Result                                                        |
| ------------------------------------------------ | ----------- | ------------------------------------------------------------- |
| change/1.4.5/wire-quit-confirm-modal.md          | Fix         | Guard opens the modal on dirty, confirms on clean; 4 tests    |
| change/1.4.5/narrow-file-origin-check.md         | Fix         | `file://` narrowed to bundled index + dev origin; 10 tests    |
| change/1.4.5/clear-minimatch-advisories.md       | Chore       | Scoped overrides pin minimatch 11.0.5; audit exits 0          |
| change/1.4.5/reconcile-mpl-license-policy.md     | Chore       | MPL-2.0 permitted for dev-only build tooling                  |
| change/1.4.5/tag-releases-at-version-bump.md     | Chore       | Documented manual annotated-tag step at close-out             |
| change/1.4.5/measure-performance-targets.md      | Chore       | `performance-measurements.md`; load 33 ms, largest song 28 KB |
| change/1.4.5/apply-accessibility-baseline.md     | Feature     | aria census 17 to 68; dialog semantics, live region           |
| change/1.4.5/continue-app-decomposition.md       | Refactor    | App.tsx 1108 to 937 lines; three orchestration hooks          |
| refactoring/1.4.5/REFACTORING.md + ASSESSMENT.md | Refactoring | DialogFrame over 13 modals; 12 internals unexported           |

## Repository Analysis

The window's work is uncommitted by rule - reconciliation is against the
working tree and the verification evidence below, not the commit log.

- **Confirmed** - every record's diff is present in the tree: sixteen plans
  and audits in `docs/plan/1.4.5/`, changes in `electron/permissions.cjs`,
  `useElectronCloseGuard.ts`, `App.tsx`, `package.json`/`package-lock.json`
  overrides, `COPYRIGHTS.md`, `VERSIONING.md`, `SPECIFICATION.md`,
  `ARCHITECTURE.md`, three new hooks, `DialogFrame`, the modal aria layer,
  new tests in `test/hooks/app/`, `test/electron/`, `test/components/`, and
  the measurement report.
- **Unconfirmed** - none.
- **Undocumented** - the instrument-repository extraction and the
  `src/App.css`/`CommandPanel.tsx` restyle landed ad hoc in the same tree
  before the window opened. The `js-output-layout` record with its plan and
  audit is already filed under `docs/change/1.4.6/` - deferred to the next
  window per the deferral rule, out of this review's scope.
- **Deviations** - the accessibility baseline applied per-modal semantics
  directly (no shared wrapper existed at that point); the refactoring cycle
  then extracted `DialogFrame` across all 13 modals, so the record and the
  refactored shape differ in mechanism, not outcome. The decomposition
  retargeted from the record's listed candidates (all already extracted) to
  the modal layer plus two inline remnants. The dev-origin check was also
  tightened to origin-equality beyond the record's literal prefix wording.

## Findings

| Severity | Finding | Evidence | Action |
| -------- | ------- | -------- | ------ |
| none     | -       | -        | -      |

## Verification Evidence

- `npm run typecheck` - clean (`tsc -b`).
- `npm run lint` - zero errors, zero warnings.
- `npm run format` - prettier check clean on touched files.
- `npm run build` - clean; `index.js` ~550 kB entry.
- `npm test` - 102 files, 799 tests pass.
- `npm audit` - `found 0 vulnerabilities` under the scoped minimatch overrides.
- Release gate - `scripts/release-check.sh` run at window close.

## Unable to Verify

- The quit-confirm modal's manual Electron close path is asserted by hook
  tests, not by a packaged-app launch - the Electron launch is only required
  when `electron/` or packaging changes per the recorded substitution, and
  `electron/permissions.cjs` did change, so the Electron proof is owed at
  close-out (`electron-builder --dir` or `electron:preview`).
- Audible glitch-free playback stays a manual-listening claim; the
  measurement report records the simulation-level proxy.

## Decision

- **Decision:** go with conditions - the bump proceeds on the project owner's authority as recorded by the named window request.
- **Decided by:** the project owner
- **Conditions:** Electron packaged launch proof for the `electron/` change before or alongside the bump.
- **Accepted risks:** `file://` narrowed to `dist/index.html` only - dev workflows loading other local paths are blocked; minimatch pinned to 11.x under five dev chains until upstream ranges admit it; the stray `js-output-layout` plan remains as residue.
