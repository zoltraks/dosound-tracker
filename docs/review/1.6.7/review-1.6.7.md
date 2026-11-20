# Version 1.6.7 Review

## Document Information

|             |                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------- |
| Version     | 1.6.7                                                                                    |
| Review Date | 2026-11-19                                                                               |
| Commands    | `git log`, `git status --short`, `git show --stat`, `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, `npm test`, `npm run test:e2e`, `scripts/release-check.sh`, `npm run retention`, `npm audit` |

## Scope

This review covers the open 1.6.7 window: fourteen change records, three
implementation plans, and one refactoring pair accumulated after the 1.6.7
bump closed the previous window. The window delivers the Debian package
target, the per-chip stereo model with MONO/CROSSTALK settings and live
settings preview, song-owned chip count, Ayumi stereo parity, the
normalized crosstalk crossfade, themed select lists, second-chip track
tints and frame borders, the section-surface polish, settings metric and
draft-sync fixes, the track-header volume label, and the `App.tsx`
orchestration decomposition. It leaves out the `docs/change|plan/1.7.0/`
and `docs/change|plan/1.8.0/` groups (adaptive piano octave span,
dual-chip stereo configuration, stereo editing controls, standard-library
drift, audio-platform performance targets, external DOSOUND replay
verification), which are next-window work per the late-record rule, and
the cross-engine loudness parity candidate recorded in `docs/FUTURE.md`.

## Recorded Work

| Document                                                              | Kind        | Status | Result                                                                              |
| --------------------------------------------------------------------- | ----------- | ------ | ----------------------------------------------------------------------------------- |
| `docs/change/1.6.7/ayumi-stereo-parity.md`                            | Change      | Done   | Equal-power pan law and unity-gain bypass align Ayumi stereo and mono with internal |
| `docs/change/1.6.7/dark-select-lists.md`                             | Change      | Done   | Settings selects and option lists follow the active theme                           |
| `docs/change/1.6.7/dual-chip-stereo-default.md`                       | Change      | Done   | `dual` layout is the hard chip split and the two-chip-song default                  |
| `docs/change/1.6.7/dual-chip-track-tints.md`                          | Change      | Done   | Channels D-F carry per-channel panel tints in every theme                           |
| `docs/change/1.6.7/linux-deb-package.md`                              | Change      | Done   | `.deb` target with t64 dependencies, desktop association, and hicolor icons         |
| `docs/change/1.6.7/section-surface-polish.md`                         | Change      | Done   | Section-idiom surfaces; envelope Pos/Val footer removed behind `data-position`      |
| `docs/change/1.6.7/settings-category-button-metrics.md`               | Change      | Done   | Category buttons match command-button box metrics                                   |
| `docs/change/1.6.7/settings-draft-sync.md`                            | Change      | Done   | Settings draft refreshes from committed values while the modal is closed            |
| `docs/change/1.6.7/song-chip-count-setting.md`                        | Change      | Done   | `song.chipCount` owns two-chips; the app-level `dualChip` setting is removed        |
| `docs/change/1.6.7/song-driven-dual-chip-playback.md`                 | Change      | Done   | Playback engines follow the song's resolved chip count                              |
| `docs/change/1.6.7/stereo-live-preview-crossfade.md`                  | Change      | Done   | Normalized crosstalk crossfade plus live draft sound preview                        |
| `docs/change/1.6.7/stereo-modes-crosstalk.md`                         | Change      | Done   | Per-chip `one`/`two` stereo modes with MONO and CROSSTALK settings                  |
| `docs/change/1.6.7/track-frame-borders.md`                            | Change      | Done   | Per-channel frame borders gated by the track background option                      |
| `docs/change/1.6.7/track-header-volume-label.md`                      | Change      | Done   | Bare volume value centered over the volume column                                   |
| `docs/plan/1.6.7/*-implementation.md`                                 | Plan        | Done   | Three plans present; Refinements sections record landed divergences                 |
| `docs/refactoring/1.6.7/REFACTORING.md` + `ASSESSMENT.md`             | Refactoring | Done   | Pass - `App.tsx` orchestration decomposed into five hooks plus helpers              |

## Repository Analysis

- **Confirmed - Debian packaging**: `8fb04b2` adds the `deb` Linux target
  with the t64/legacy alternation `depends` list, `desktopName` and
  `syncDesktopName`, the `build/icons/` hicolor set, DEPLOYMENT.md
  documentation, the implementation plan, the change record, and three
  session-lesson files - record, plan, and code in one commit.
- **Confirmed - stereo and chip model**: `263cb00` rewrites
  `songStereo.ts` to the `one`/`two` mode tokens, carries `chipCount` and
  the stereo node through `songIO`/`songParser`, adds the MONO/CROSSTALK
  settings and the normalized crossfade bus in `useAudioSetup`, routes
  engine output through `routeOutput`, applies the Ayumi equal-power law
  and bypass in `ayumiCore`/`ayumiWorklet`, previews draft sound values
  through `useSettingsSession`, and removes the app-level `dualChip`
  setting entirely - one commit carries the code, the change records, two
  plans, lesson files, and documentation updates under the ad-hoc
  implementation mode.
- **Confirmed - interface polish**: `263cb00` restyles the section
  surfaces in `App.css`, tints and borders channels D-F, themes the
  select lists, aligns the settings category metrics, syncs the settings
  draft, recenters the track-header volume label, and removes the
  envelope Pos/Val footer behind the `data-position` observable.
- **Confirmed - process hygiene**: `ee2ee2b` lands the unwrapped-line
  CHANGELOG convention in VERSIONING.md, reformats entries 1.6.0-1.6.7,
  and records the prior window's lessons; `8fb04b2` and `263cb00` each
  carry their session-lesson files.
- **Unconfirmed - `App.tsx` refactoring**: the orchestration
  decomposition (`useSoundPreferences`, `useEditPositionBridge`,
  `useTrackWindow`, `useClipboardDispatch`, `navigableTrackSections`,
  `engineInstanceForChannel`) is implemented and suite-verified but
  uncommitted at review time - the owner's manual commit is pending,
  together with the `retention-sweep.mjs` path fix and the
  SPECIFICATION navigation-order correction.
- **Undocumented**: none in `src/` - every source delta maps to a record.
  `ee2ee2b` touches process documents only, and the
  `scripts/retention-sweep.mjs` path-separator fix is repository tooling
  outside the change-record gate's `src/` scope.
- **Deviated**: the window's records and implementation landed together
  in single commits (`8fb04b2`, `263cb00`) under the ad-hoc implementation
  mode rather than record-plan-implement cycles; only three of the
  implemented records carry plans, and no
  `<change>-specification-audit.md` artifacts exist - the
  `specification-audit` extension stays dormant, matching the 1.6.6
  finding. `song-driven-dual-chip-playback` describes the intermediate
  state where `dualChip` still gated the editing surface;
  `song-chip-count-setting` supersedes it by deleting the setting - the
  final tree carries no `dualChip` reference. The deb plan's refinements
  (`libc6` dependency, artifact-name correction, accepted lintian
  findings) are recorded in the plan. The refactoring's deviations are
  recorded in its REFACTORING.md Refinements.

## Deviations and Residuals

- **Window changeset uncommitted** - the refactoring pair, this review,
  the session lessons, the version bump, and the CHANGELOG entry ride a
  single owner commit; the window cannot close with a dirty `src/` tree
  beyond what the commit resolves.
- **`specification-audit` extension dormant** - adopted but producing no
  audit artifacts for a second consecutive window; the owner decision
  recorded in the 1.6.6 review is still open.
- **WebKit playback e2e** - two specs fail on this Windows host because
  headless WebKit preserves the suspended `AudioContext` startup state;
  the identical failures reproduce on the pre-change baseline worktree
  (`263cb00`), so they are environmental, not a regression. The
  suspended-context gate TESTING.md requires for audio-path changes is
  only partially satisfiable here.
- **Host toolchain below the engines floor** - the installed runtime is
  Node 22.23.5 / npm 12.2.2 against `engines` `>=26.13.0` / `>=11.20.0`.
  A portable Node 26.13.0 was obtained and checksum-verified; its
  verification ran with a repo-local TMP redirect because the unsigned
  binary is EPERM-blocked on temp directories outside the repository.
- **Phantom EOL modifications** - `npm run format` rewrites line endings
  across the tree; roughly 1,250 `git status` entries carry identical
  content (empty `git diff`, matching blob hashes). Cosmetic only.
- **`.deb` real install** - package metadata, payload, and dependency
  resolution were verified with `dpkg-deb`/`lintian`/`apt-get
  --simulate`; installing on a Mint host remains the record's user-side
  acceptance step.
- **Cross-engine loudness parity** - the Ayumi parity record's residual
  ~2.4x RMS difference is deferred to the `docs/FUTURE.md` candidate.

## Findings

| Severity | Finding                                                       | Evidence                                                          | Action                                  |
| -------- | ------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------- |
| Minor    | Window changeset uncommitted at review time                   | `git status` shows the refactoring pair, review, lessons, bump    | Owner commits the changeset             |
| Minor    | `specification-audit` extension adopted but dormant           | `docs/plan/1.6.7/` holds no audit artifacts; same as 1.6.6        | Owner decides: reinstate or record dormant |
| Info     | WebKit playback e2e fails on this host                        | `smoke.spec.ts:22` and `:151` under `--project=webkit`; identical on baseline `263cb00` | Accepted environmental risk; verify on macOS/Linux |
| Info     | Host Node below declared engines floor                        | `node -v` 22.23.5 vs `>=26.13.0`; portable 26.13.0 EPERM on temp   | Documented in TOOLING.md and lessons    |
| Info     | Phantom EOL modifications flood `git status`                  | ~1,250 entries, empty `git diff`, identical blob hashes           | Cosmetic; `git add` refreshes stat info |

## Verification Evidence

- `scripts/clean.sh` removed `dist/`, `coverage/`, `playwright-report/`,
  `test-results/`; the full loop then rebuilt from scratch.
- Node 22.23.5 (installed toolchain): `npm run typecheck`, `npm run
  lint`, `npm run format`, `npm run build` clean; entry chunk 591.66 kB,
  under the 600 kB budget; `npm test` 197 files / 1809 tests pass.
- Node 26.13.0 / npm 11.20.0 (declared toolchain, portable zip,
  SHA256-verified): `npm run typecheck`, `npm run lint`, `npm run
  format`, `npm run build` clean; `npm test` 1807/1809 - the two
  failures are `retentionSweepCoverage` git-fixture tests that require
  `os.tmpdir()` outside the repository, unreachable while TMP is
  redirected inside `work/` for the portable binary's temp EPERM; both
  pass on Node 22.
- `npm run test:e2e` on Node 26.13.0: 28/30 - only the two known WebKit
  playback specs fail (suspended `AudioContext`, reproduced on the
  pre-change baseline).
- `npm audit`: 0 vulnerabilities.
- `npm run retention` dry-run: 0 moves, 58 stays correctly classified;
  forward-slash paths confirm the `retention-sweep.mjs` fix.
- `scripts/release-check.sh`: run before the bump; result recorded in
  the session report.

## Unable to Verify

- The WebKit suspended-context playback gate is only partially
  verifiable on Windows headless; the two failing specs reproduce
  identically on the pre-change baseline. A macOS/Linux run closes it.
- Real `.deb` installation on a Linux Mint host remains the change
  record's user-side acceptance step.
- No manual audio listen-through was performed this window; coverage is
  unit, integration, and e2e level per TESTING.md.
- Two `retentionSweepCoverage` tests cannot execute under the portable
  Node's in-repo TMP redirect (fixtures must live outside the repository
  per TESTING.md); they pass on the installed Node 22 toolchain.

## Decision

**Go.** All fourteen records' acceptance surfaces are implemented and
verified; the refactoring assessment passes; the only residuals are the
uncommitted changeset, the dormant specification-audit extension, the
environmental WebKit gap, and the user-side `.deb` install check.

- **Decision:** go
- **Decided by:** the project owner - the autonomous SDLC closeout
  instruction authorizes the version bump
- **Conditions:** the full window changeset lands in the owner's manual
  commit
- **Accepted risks:** WebKit environmental e2e gap; `.deb` install
  unverified on target hardware; host-toolchain deviation documented
