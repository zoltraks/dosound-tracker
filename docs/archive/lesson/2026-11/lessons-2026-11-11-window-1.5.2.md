# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Record premises stale between authoring and plan time

Observed symptom: three 1.5.2 records carried premises the tree no longer supported - `additional-chip-variants` described variant differences that do not exist in the engines, `wasm-audio-core` assumed a TypeScript DSP hot path and a `setTimeout` worker this same window had already replaced, and `stereo-output` cited the wrong board for dual-AY stereo. Each was amended in place during per-record analysis.

Root cause: records age between intake and implementation, and parallel window work can invalidate a sibling record's description before its pipeline runs.

Preventing rule: see "Request Iteration" in `WORKFLOW.md` and "Change Request Document Creation" in `GUIDELINES.md`.

### Headroom arithmetic is not a measurement

Observed symptom: the Ayumi output-gain record reasoned a `0.5` gain from a computed peak near `1.5`, but measuring the folded `(left + right) * 0.5` output showed `~1.33` worst case and the internal engine's ceiling near `0.9` - a linear `1.2` parity gain would peak near `1.8` and clip. The shipped fix pairs the gain with a soft-knee limiter.

Root cause: a numeric safety claim was derived by arithmetic on component peaks instead of being measured on the rendered signal; fold-down mixing and engine ceilings defeat the hand-computed worst case.

Preventing rule: see "Testing" in `standard/typescript-audio-development.md`.

### Recalled hardware names mislead

Observed symptom: the stereo record named PokeyMax as a dual-AY stereo example - PokeyMax is a POKEY board, and the corrected citation is the TurboSound dual-AY configuration.

Root cause: a hardware example was written from memory rather than verified against source material, and a wrong name in a record propagates into design rationale.

Preventing rule: see "Change Request Document Creation" in `GUIDELINES.md`.

### Change events never commit buffered inputs

Observed symptom: the `NumberSpinner` suite's first pass expected `fireEvent.change` to emit `onChange`; the component buffers typed text locally and commits only on blur, Enter, or a spin-button step.

Root cause: the component follows the commit-on-blur convention, so a change event exercises the local buffer and never the commit path - the test's event did not match the component's contract.

Preventing rule: see "Component test hygiene" in `TESTING.md`.

### Adjacent design surfaces latent defects - defer them, never absorb them

Observed symptom: designing the `compact` assembly strategy exposed a latent defect in `optimized` - `combineDelayLines` merges delay runs unboundedly, so a run beyond 256 frames emits a `$FF,N` count that no longer fits the single command byte. `optimized` was left byte-identical inside the window and the fix filed for the next window.

Root cause: keeping `optimized` byte-identical was a recorded window decision, but the defect still needed an owner and a window - unowned discoveries evaporate.

Preventing rule: see "Deferral" in `WORKFLOW.md`. The deferred work is filed at `change/1.5.3/chunk-optimized-delay-runs.md`.

### Named coverage gaps go stale between windows

Observed symptom: `TESTING.md` listed `AboutModal` and `DownloadModal` as coverage gaps while the record that closed them was being planned; the list was refreshed only because this window's record touched the same file.

Root cause: the remaining-gaps list is a claim about the tree like any volatile figure - suites landing in one window silently invalidated it for the next.

Preventing rule: see "Coverage Targets" in `TESTING.md`.
