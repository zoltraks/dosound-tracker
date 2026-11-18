# Session lessons - 2026-11-18 window review, bump, and standard feeds

## Wounds

- **Pipeline position was reported from memory, not evidence.** The
  assistant reported "1.6.6 window review pending before bump" while the
  bump had already shipped in `2f1cdcf`. The version-window mechanics -
  window N's records produce release N+1, `package.json` holds the last
  released version, the records group is named for the pre-bump version -
  were inferred instead of read from `git log` and
  `scripts/release-check.sh` comments. Verify SDLC position from the log
  and gate script before stating it.
- **`release-check.sh` WARN semantics were misread as missing artifacts.**
  The "no review for X" warning fires mid-window by design; it is a
  bump-time gate, not a defect. Read the gate's own comments before
  classifying its output.
- **Housekeeping coverage has manual residue.** `scripts/clean.sh`
  covers only top-level `work/*.log` targets; `work/` dated subdirs,
  audit scratch, and `release/` accumulation are outside its scope and
  were found by `du`, not by the checklist. The workspace sweep should
  inventory subdirectories, not only run the script.
- **Vendored-to-canonical promotion needs a classification pass.** The
  standard-library sync correctly reverted vendored-only blocks, but
  several `## Project Conventions` entries were generic best practices
  mis-filed as project knowledge. Feeding upstream requires separating
  generic rules (anonymizable, no project identifiers) from
  project-specific values before editing the canonical library.
- **`specification-audit` extension is adopted but dormant.** No
  `<change>-specification-audit.md` artifacts exist for recent windows.
  Recorded as a review finding for owner decision - reinstate the
  per-plan audit or record the extension as dormant in `GUIDELINES.md`.

- **Changelog entries drifted from the file's own format.** Seven
  version sections (1.6.0-1.6.7) hard-wrapped summaries and bullets at
  ~72 columns while every older entry keeps one unwrapped line per
  item. The written spec in `VERSIONING.md` never stated the wrapping
  rule, so each bump re-derived the format from generic prose habits
  instead of the file's history. Check a generated file's existing
  entries for format before writing new ones, and land unwritten
  conventions in the owning document the first time they surface.

## Routed landings

- Window/version mechanics and gate semantics: this file; the mechanics
  are already encoded in `scripts/release-check.sh` comments and
  `VERSIONING.md` - the durable rule is "verify position from evidence".
- Housekeeping subdirectory sweep: candidate for the `WORKFLOW.md`
  housekeeping checklist - pending owner approval.
- Changelog wrapping: rule landed in `VERSIONING.md` Format conventions;
  wound recorded above.
- Specification-audit dormancy: open finding in
  `docs/review/1.6.6/review-1.6.6.md` - owner decides.
