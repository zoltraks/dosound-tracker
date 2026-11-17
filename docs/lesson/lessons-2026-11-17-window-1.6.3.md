# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### The coverage text table hid fully covered modules

Observed symptom: per-file rows for the newly tested audio, UI, and instrument hooks were absent from the `test:coverage` text report, reading as if the suites never touched them.

Root cause: the v8 text reporter omits files at 100 percent on every axis; absence from the table means full coverage, not missing coverage.

Preventing rule: see "Line-level gap maps need the `json` reporter" in `TESTING.md`.

### Scroll-geometry hook tests had no layout to assert against

Observed symptom: writing `useScrollSync` and `useResponsivePanels` suites required inventing the layout values jsdom never computes, and the first scroll assertion encoded a wrong assumption about which index drives the target offset.

Root cause: jsdom reports zero for `offsetHeight`, `clientHeight`, and `scrollHeight`, its `scrollTop` stores but does not lay out, and rAF callbacks need capture-and-flush stubbing for deterministic ordering; the hook also computes its target offset from the raw line index while clamping only the measured row.

Preventing rule: see "Geometry and frame-driven hook tests stub the platform" in `TESTING.md`.
