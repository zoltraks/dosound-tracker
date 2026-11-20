# Session lessons - 2026-11-19 SDLC closeout, toolchain, and e2e flakes

## Wounds

- **The declared toolchain was not installed and the gap was bypassed.**
  The host runs Node 22.23.5 / npm 12.2.2 against `engines`
  `>=26.13.0` / `>=11.20.0`; `engine-strict` was worked around during
  `npm install` instead of reaching the `.nvmrc` runtime first, against
  the TOOLING.md rule. The host also has no working version manager -
  the `nvm` on PATH is the nvm-sh placeholder shim, and
  `C:\SDK\nodejs\v20\` actually contains v22.23.5, so directory names
  lie. Verify toolchain claims with `node -v`, not paths.
- **A portable Node reached the declared runtime but hit a temp-dir
  EPERM.** The checksum-verified `node-v26.13.0-win-x64.zip` under
  `work/` ran the declared toolchain, yet the unsigned binary was denied
  `mkdtemp` in `C:\Users\...\Temp` and `C:\WINDOWS\temp` while the
  installed v22 binary succeeded in the same path - a security-software
  restriction on binaries outside the repo tree. Redirecting
  `TMP`/`TEMP`/`TMPDIR` into `work/tmp` restored temp access, but that
  put git-fixture tests inside the repository where `git -C` resolves
  the parent `.git` - two `retentionSweepCoverage` tests then failed on
  exactly the trap TESTING.md documents. In-repo TMP redirects trade one
  failure class for another.
- **e2e failures under concurrent load were misread as suspect until
  rerun.** Seven chromium specs (lazy-modal visibility, playback
  positions) failed while a 41 MB toolchain download and unzip ran
  alongside the suite; the identical code passed 28/30 on a quiet
  machine minutes later. Modal-visibility timeouts under disk/CPU
  contention are flakes, not regressions - the quiet rerun is the
  judgment step.
- **Phantom EOL modifications masked the real diff.** `npm run format`
  rewrote line endings across ~1,250 files; `git status` reported them
  all modified while `git diff` showed only the eight substantive files.
  Stat-dirt entries clear on `git add` without staging content - diff,
  not status, is the change-set truth source.
- **A Windows path-separator bug reached a shipped script.**
  `retention-sweep.mjs` reported `docs\lesson\`-style paths that the
  suite's forward-slash expectations rejected; normalizing
  repo-relative paths to `/` fixed it. Repository scripts must emit
  portable relative paths.
- **Stale transitive deps fail golden suites silently.** `js-yaml`
  4.3.2 against a `^5.5.0` range produced six `yamlEmission` failures
  that looked like code regressions until `npm ls` exposed the drift.

## Routed landings

- Toolchain acquisition and the temp-EPERM/fixture trade-off: new note
  "Reach the declared Node toolchain without nvm" in `TOOLING.md`.
- Transitive-drift symptom pattern: appended to the toolchain note in
  `TOOLING.md`.
- Baseline-worktree A/B method for environmental classification:
  appended to "Rule out the environment before bisecting" in
  `TOOLING.md`.
- Phantom EOL status mechanics and the forward-slash script rule: two
  new notes at the end of `TOOLING.md`.
- e2e concurrency flake: new note in `TESTING.md` beside the
  suite-contention note.
- Window mechanics (window N records produce release N+1) were verified
  from `release-check.sh` comments and the 1.6.6 review precedent before
  filing - the 2026-11-18 "verify position from evidence" rule held.
