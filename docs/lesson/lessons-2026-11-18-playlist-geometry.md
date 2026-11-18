# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Verified-by-reasoning fix left the dominant cause live

Observed symptom: the playlist column-width fix passed typecheck, lint, format, build, and 1774 tests, and was reported complete - the user then confirmed the track sections still shifted ~1px at 1590x914.

Root cause: the diagnosis fixed `.playlist-line`'s state-added borders but never measured the running app; the real propagator was `.track-line.current`'s `margin-left` flipping -1px to 0 on panel activation, raising `.left-column`'s min-content floor and distributing ~0.17px to each of six `flex: 1` panels. The plan's "manually confirm stable column widths" step was skipped - the user became the verification step.

Preventing rule: see "Geometry claims verify by measurement" in `docs/TESTING.md` - CSS geometry fixes verify by live measurement in the reporter's configuration, and a plan's manual-confirm step is the implementer's obligation.

### One defect class, three compensation sites

Observed symptom: the same selection-toggle geometry shift appeared as added borders on `.playlist-line`, a `padding-left: 0px` on `.playlist-line.playback-position.current`, a `margin-left` flip on `.track-line.current`, and a `padding-left: 3px` on its `.note-text`.

Root cause: state rules mutated box geometry (border width, margin, padding) and earlier sessions had patched each symptom with a compensation declaration instead of reserving the space at rest - compensations are evidence of the same wound nearby, not fixes.

Preventing rule: see "Project Conventions" in `docs/standard/css-general-development.md` - state classes change colors only, resting rules reserve the metrics, and compensation declarations mark the mutation to remove. Audit the whole class when one instance is found.

### Negative-margin removal propagated through the flex floor

Observed symptom: activating any track panel widened all six track panels by ~0.17px and shifted the playlist column, though only one line's margin changed.

Root cause: `margin-left: -1px` lowered `.track-line.current`'s min-content contribution; the active-state `margin-left: 0` override removed it, and `.left-column` - a flex item without `min-width: 0` - claimed the extra pixel as its new floor, distributing it fractionally across every `flex: 1` child.

Preventing rule: see "Project Conventions" in `docs/standard/css-general-development.md` - audit state rules for margin changes; a min-content delta inside a flex item without `min-width: 0` propagates to all siblings.

### Default settings did not reproduce the reported layout

Observed symptom: the first headless measurement at default settings showed zero width deltas across the playlist/track toggle, nearly suggesting the bug was not reproducible.

Root cause: the reporter ran dual-chip with the six-track layout; defaults render three tracks. The defect only manifests with six `.track-panel` flex children and six playlist columns.

Preventing rule: see "Tooling Notes" in `docs/TOOLING.md` - seed the reporter's configuration through `page.addInitScript` localStorage (`dosound-tracker-dual-chip`, `dosound-tracker-visible-tracks`) before measuring, and snapshot the `offsetWidth`/`clientWidth`/`scrollWidth` ancestor chain to find the absorbing flex ancestor.
