# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Volatile figures go stale between changes

Observed symptom: `SPECIFICATION.md`, `ARCHITECTURE.md`, and `FUTURE.md` carried exact line counts and byte sizes that had drifted - `App.tsx` was documented at two different figures, both wrong.

Root cause: measured numbers were recorded where a relative description would have stayed true; every routine edit silently invalidated them.

Preventing rule: see "Volatile figures" in `STYLE.md`.

### Symbol paths drift and get copied into new documents

Observed symptom: `FUTURE.md` cited `AYUMI_OUTPUT_GAIN` in `src/synth/AyumiEngine.ts` and `quoteNoteValues` in `trackClipboard.ts` - the constant had moved to `src/workers/ayumiWorklet.ts` and the helper had consolidated into `songIO.ts` via the shared `quoteYamlValues`.

Root cause: candidate items aged between listing and promotion, and the references were trusted without re-verification against the tree.

Preventing rule: see "Change Request Document Creation" in `GUIDELINES.md`.

### Window plans are written per record, never in a batch

Observed symptom: the user directed that a window's implementation plans be created one record at a time - analysis, additional research, record amendment where findings demand it, then the plan, then immediate implementation - never all plans up front.

Root cause: batch-created plans freeze analysis results before each record is verified; a per-record pipeline keeps every plan grounded in fresh evidence and lets research correct the record itself.

Preventing rule: see "Request Iteration" in `WORKFLOW.md`.

### Promoted candidates distribute across windows by readiness

Observed symptom: promoting the `FUTURE.md` candidates in one batch needed a distribution rule - the user directed blocked items to later windows, ordered by when each blocker can resolve.

Root cause: no recorded convention decided which window a promoted record joins when its dependencies or external gates are open or closed.

Preventing rule: see "Record distribution" in `WORKFLOW.md`.

### Change records carry a reviewed-quality bar

Observed symptom: the user announced the records would be reviewed by experienced designers and required high quality.

Root cause: the bar was implicit - no written rule told the author that records are read by experts and must be precise and verified.

Preventing rule: see "Change Request Document Creation" in `GUIDELINES.md`.

### AY stereo layouts are machine-defined and differ per chip

Observed symptom: the stereo record initially modeled panning as free per-channel placement only; AY/YM hardware wires the A/B/C channels to stereo positions differently across machines (ABC, ACB, mono), and dual-chip boards like PETAY and PokeyMax may configure each chip differently.

Root cause: the hardware layout domain fact was absent from the document set, so the design defaulted to the generic case and nearly foreclosed the named-layout and dual-chip extensions.

Preventing rule: see "Architectural Decisions" in `ARCHITECTURE.md`.
