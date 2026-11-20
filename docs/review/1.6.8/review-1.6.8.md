# Version 1.6.8 Review

## Document Information

|             |                                                                                                                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version     | 1.6.8                                                                                                                                                                                                                                     |
| Review Date | 2026-11-20                                                                                                                                                                                                                                |
| Commands    | `git status`, `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, `npm test`, `npm run test:e2e`, `npm run electron:build`, `scripts/release-check.sh`, `npm run retention`, `npm audit`, `npx vitest run --coverage` |

## Scope

This review covers the open 1.6.8 window: eight change records created
from the AUDIT-1.7 remediation recommendations (two HIGH, three MEDIUM,
three LOW) plus the process changes the window itself produced - the
autonomous-default gate mode and its decision record. The window is
remediation-only: no feature records, no refactoring proposal (the
refactoring phase assessed the tree and found the composition-root and
duplication debts already tracked as TDR-001/002/003 with dedicated
future records - nothing new worth a proposal). It leaves out the
`docs/change|plan/1.7.0/` and `docs/change|plan/1.8.0/` seeded groups,
including the new `reconcile-live-offline-divergences` record this
window's parity contract deferred.

## Recorded Work

| Document                                                 | Kind     | Status | Result                                                                                          |
| -------------------------------------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------------- |
| `docs/change/1.6.8/instrument-import-size-gate.md`       | Change   | Done   | `MAX_IMPORT_BYTES` asserted before read/parse on the instrument path; +4 tests                  |
| `docs/change/1.6.8/restore-coverage-gate.md`             | Change   | Done   | Coverage gate green - 205 files / 1,870 tests, branches 82.54%; timeout headroom fix            |
| `docs/change/1.6.8/validate-storage-restores.md`         | Change   | Done   | Restores route through parser-level validation; undo bounds re-applied; MIDI version checked    |
| `docs/change/1.6.8/live-offline-parity-contract.md`      | Change   | Done   | 5 contract tests pin live-vs-export register-stream parity; 4 divergences deferred to 1.7.0     |
| `docs/change/1.6.8/webkit-e2e-playback-root-cause.md`    | Change   | Done   | Root cause confirmed - Windows WebKit lacks Web Audio entirely; specs skip environment-expected |
| `docs/change/1.6.8/electron-service-worker-hardening.md` | Change   | Done   | `sandbox: true`, SW `response.ok` cache guard, `host: true` documented dev-only                 |
| `docs/change/1.6.8/testing-docs-coverage-refresh.md`     | Change   | Done   | TESTING.md enumerations fixed; ayumiWorklet at 100%; VERSIONING.md tense rule amended           |
| `docs/change/1.6.8/repository-hygiene-branches.md`       | Change   | Done   | `sync-branches.sh` guarded (dry-run/`--apply`/`--push`/`--remote`); museum decision recorded    |
| `docs/plan/1.6.8/*-implementation.md`                    | Plan     | Done   | Eight plans present, each with a Refinements section                                            |
| `docs/decision/2026-11-20-branch-museum.md`              | Decision | Done   | Museum posture, branch census, deferred pruning recorded                                        |
| `docs/decision/2026-11-20-autonomous-sdlc-default.md`    | Decision | Done   | `autonomous` is now the recorded default gate mode                                              |

## Repository Analysis

- **Confirmed - security hardening**: the instrument import path now
  rejects oversized files before `FileReader`/YAML parse
  (`useInstrumentFileLoading` + `FileInputs` pass the `File` through),
  storage restores validate through the parser's own contract
  (`validateSongData`, field-by-field rebuild in
  `normalizeStoredSongToCurrentSchema`, per-snapshot shape checks in
  `isValidEditSnapshot`, MIDI `version !== 1` rejected), the Electron
  renderer pins `sandbox: true`, the service worker caches only
  `response.ok` responses, and 26 new tests cover the seams.
- **Confirmed - gate repair**: `npm run test:coverage` exits 0 with
  branches at 82.54% - the two timing-sensitive suites got timeout
  headroom and a lazy-chunk warm import instead of exclusion, and new
  suites (ayumiWorklet 17 tests at 100%, song constants, bumpVersion,
  afterAllArtifactBuild) added real coverage.
- **Confirmed - honest e2e**: the two WebKit playback specs now skip on
  `webkit + win32` with a named reason after root-causing proved
  Playwright's Windows WebKit ships without the Web Audio API
  (`microsoft/playwright#14105`) - 28 passed / 2 skipped, no silent
  coverage loss off-Windows.
- **Confirmed - process**: `sync-branches.sh` is dry-run-by-default
  behind explicit `--apply`/`--push`/`--remote` gates; the branch museum
  and the autonomous-default gate mode are recorded decision records;
  GUIDELINES.md and WORKFLOW.md now record `autonomous` as the default.
- **Unconfirmed - packaged launch under `sandbox: true`**: the packaged
  build produces NSIS/zip artifacts, but no packaged-app launch smoke
  ran on this host - recorded as the owner's manual acceptance step.
- **Undocumented**: none - every source delta maps to a record, and the
  doc updates the records required (SPECIFICATION.md restore/mirror
  contracts, FORMAT.md MIDI version rule, TESTING.md enumerations +
  WebKit/platform notes, DEPLOYMENT.md dev-server section,
  VERSIONING.md tense rule, GUIDELINES.md/WORKFLOW.md gate mode) all
  landed in the same changeset.
- **Deviated**: the parity record's open choice resolved to contract
  tests over shared-logic extraction (the record sanctioned either; the
  plan records the audio-path rationale). The storage record's "settings
  restores" scope resolved to `useMidi` device-id narrowing after the
  app-settings paths verified already-safe. The tense drift resolved by
  amending VERSIONING.md to the practiced present-tense convention
  rather than rewriting entries. Branch pruning stayed deferred as an
  owner decision. Four live/offline divergences the contract exposed
  deferred to `docs/change/1.7.0/reconcile-live-offline-divergences.md`
  per the deferral rule.

## Deviations and Residuals

- **Packaged-launch smoke owed** - `sandbox: true` is verified at build
  level only; a packaged launch should confirm MIDI permission and
  About-dialog runtime info before the owner relies on the desktop
  build.
- **Live/offline divergences open** - four confirmed divergences plus
  secondary edges await the 1.7.0 record's keep-or-fix decisions; the
  parity contract passes only under its documented preconditions until
  then.
- **Branch pruning deferred** - museum documented, `sync-branches.sh`
  guarded; actual pruning remains an explicit owner decision per class.
- **`chipIndexForChannelId`/`channelIdsForChip`/`channelCountForChipCount`
  pinned while unused** - the constants suite guards exports nothing
  calls yet; flagged in the plan for a future consumer or removal.
- **Host toolchain** - verification ran on the installed Node 22.23.5;
  the declared >=26.13.0 floor remains a documented deviation (portable
  26.13.0 lives in `work/`).

## Findings

| Severity | Finding                                          | Evidence                                                | Action                                  |
| -------- | ------------------------------------------------ | ------------------------------------------------------- | --------------------------------------- |
| Minor    | Packaged launch under `sandbox: true` unverified | `electron:build` artifacts produced; no launch smoke    | Owner runs packaged app once            |
| Minor    | Live/offline divergences deferred to 1.7.0       | `liveOfflineParity` plan Refinements; new change record | Scheduled next window                   |
| Info     | WebKit-Windows has no Web Audio API at all       | `microsoft/playwright#14105`; probe evidence in plan    | Specs skip honestly; macOS/Linux covers |
| Info     | Unused chip-count exports pinned by new tests    | `test/constants/song.test.ts`; plan Refinements         | Future consumer or removal decision     |

## Verification Evidence

- `scripts/clean.sh` removed build artifacts; the full loop rebuilt
  from scratch: typecheck, lint, format clean; build pass; `npm test`
  **205 files / 1,870 tests, all pass** (up from 1,809 - 61 net new
  tests this window).
- `npx vitest run --coverage`: exit 0, branches **82.54%** (threshold
  80%), statements 89.56%, functions 87.98%, lines 89.83%.
- `npm run test:e2e`: **28 passed / 2 skipped** - the two WebKit
  playback specs skip on win32 by design; all Chromium specs pass.
- `npm run electron:build`: NSIS + zip artifacts produced (result
  recorded in session log).
- `npm audit`: 0 vulnerabilities.
- `npm run retention` dry-run: boundary 1.6.8, 0 moves, 66 stays.
- `scripts/release-check.sh`: run before the bump; result recorded in
  the session report.

## Unable to Verify

- Packaged-app launch behavior under the new explicit `sandbox: true`
  (MIDI permission prompt, About runtime info) - build artifacts
  verified, runtime smoke is the owner's step.
- WebKit audio-path e2e on Windows is now definitively impossible (no
  Web Audio API in that build) - coverage exists on Chromium everywhere
  and WebKit on macOS/Linux only.
- No manual audio listen-through this window; the parity contract
  covers register-stream equivalence, not audible output.

## Decision

**Go.** All eight records' acceptance surfaces are implemented and
verified; the coverage gate and e2e suite report honestly; residuals are
the packaged-launch smoke, the deferred divergences and branch pruning,
and the documented host-toolchain deviation.

- **Decision:** go
- **Decided by:** the project owner - the autonomous SDLC instruction
  authorizes the version bump
- **Conditions:** the full window changeset lands in the owner's manual
  commit; packaged-launch smoke on next desktop use
- **Accepted risks:** deferred live/offline divergences; branch museum
  retained; host Node below declared floor
