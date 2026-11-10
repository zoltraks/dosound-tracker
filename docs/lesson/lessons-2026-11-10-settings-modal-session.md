# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Lift Modal Working State for Global Shortcuts

Observed symptom: the settings modal plan put the draft inside the component, and the global Enter/ESC handler in `useModalManager` could not commit it - the draft had to move into `useSettingsDialog` mid-implementation.

Root cause: the modal keyboard handler attaches to `window` in the capture phase and acts on App-owned state only; component-internal state is unreachable.

Preventing rule: see "Modal Working State" in `SPECIFICATION.md`.

### Inline Literals Escape Scripted Sweeps

Observed symptom: a `windowScroll: 0,$` perl pass fixed block-style `saveUiState` literals in `uiState.test.ts` but skipped two single-line calls - typecheck caught them on the next run.

Root cause: the search pattern anchored to a line ending matched only the multi-line shape of the same call.

Preventing rule: see "Scripted sweeps must cover inline literals too" in `WORKFLOW.md`.

### Record Conventions Explicitly

Observed symptom: the settings modal restore requirement needed a user correction - "restore application state on page reload" was an unwritten convention the initial request assumed.

Root cause: the stateful-restore rule existed in code (`UI_STATE`, `EDITOR_CURSOR`) but nowhere in the documentation set.

Preventing rule: landed during the change itself - see "Settings persistence" in `SPECIFICATION.md` and F-17 in `PROJECT.md`.
