# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Scoped localStorage enumeration

Observed symptom: `Object.keys(localStorage)` was considered for the scoped RESET wipe, but the test mock is a plain object whose own enumerable keys are method names - the enumeration would have removed `getItem` and friends while leaving every stored key.

Root cause: the installed localStorage mock does not expose stored keys as own properties, unlike a naive in-memory shape would suggest.

Preventing rule: see "Component test hygiene" in `TESTING.md` - enumeration uses `length`/`key(index)` in source and tests.

### Ref values cannot be read at render time

Observed symptom: `react-hooks/refs` errored when `ym2149Ref.current` was passed as an engine option - the shared preview engine initially could not receive the emulator from the two ref-fed call sites.

Root cause: React 19 hooks linting treats render-time `ref.current` reads as an error, not a warning - the engine needed call-time resolution instead.

Preventing rule: see "Pass a getter when a ref value feeds a long-lived callback" in `WORKFLOW.md` - the engine option accepts `YM2149 | null | (() => YM2149 | null)`.

### Advisory residual belongs in a dated decision

Observed symptom: twelve `minimatch` advisories could not be cleared - every consuming chain pins `^10` or `^9` while only `11.0.1+` is fixed, and the record's out-of-scope rules forbid forced resolution.

Root cause: upstream typescript-eslint and electron-builder chains have no compatible fixed release - the finding was re-verified against the registry rather than trusted.

Preventing rule: see "Session Review" routing in `GUIDELINES.md` - the residual landed as `docs/decision/2026-11-09-minimatch-advisory-residual.md` with the reach analysis.

### A reduced engine copy is not a refactor defect

Observed symptom: `HeaderPanel` and `useInstrumentActions` preview engines lack sustain/release and would silently gain behavior if migrated naively.

Root cause: the copies are intentionally reduced variants - one-shot and throttled previews - not broken duplicates.

Preventing rule: see "Specification Audit" in `WORKFLOW.md` - semantic differences discovered during consolidation split into their own record - reduced semantics reproduce through engine options (`honorSustain`, `stopAfterStep`), and the MIDI auto-stop noteOff divergence defers to `docs/change/1.4.0/send-midi-noteoff-on-preview-autostop.md`.
