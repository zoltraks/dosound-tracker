# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Prop-drilled handler sets hide their true layer count

Observed symptom: the 1.5.4 refactoring proposal scoped the export-handler collapse to three layers - `useExportModal`, `ModalManager`, `ExportModal` - and execution discovered a fourth: `useAppModals` shuttles the handlers from `App.tsx` onto `ModalManager` props. The finding held and the fix was the same shape, but the proposal undercounted the blast radius.

Root cause: the analysis traced the producing hook's surface and the final consumer, skipping the aggregator hook in between - pass-through layers own none of the handler names until they are searched by the prop names they relay.

Preventing rule: see "Analyse the current implementation" in `REFACTORING.md` - trace every consumer by prop name, not only the producing hook.

### Dead surface removal frees arguments that only existed for it

Observed symptom (positive): deleting the three unused top-level export handlers also exposed `exportStrategy` as a dead hook argument - the `*WithContext` handlers read the strategy from `ExportContext`, so the argument existed solely for the deleted code. Removing it shrank the call site and the args interface.

Root cause (positive): dead-surface removal has second-order wins worth a follow-up grep - parameters, imports, and injected dependencies that served only the removed members go dead with it and pass lint unnoticed if they are types or object properties.

Preventing rule: covered by the tidy-first rule in `REFACTORING.md` - this entry records the follow-up check as part of dead-surface removal.

### jsdom's own Storage swallows vi.spyOn silently

Observed symptom: after the Vitest 5 upgrade reused jsdom's native `localStorage`, three tests failed with spies installed yet never hit - `vi.spyOn(localStorage, 'setItem')` returned a mock that the code under test bypassed entirely, while 545 sibling jsdom tests failed earlier on the getter-only `window.localStorage` accessor.

Root cause: newer jsdom implements `Storage` as a legacy platform object - named-property semantics intercept the property definition, so the spy installs without error but the method call still reaches the native implementation. The setup's "reuse jsdom storage when present" branch was the defect.

Preventing rule: see "Component test hygiene" in `TESTING.md` - the plain-object mock installs unconditionally; tests never run against jsdom's own storage.

### Records carry premises verified at analysis, not at authoring

Observed symptom (positive): the `per-format-strategy-relevance` record assumed the export modal held a selected-format state for per-format annotations - implementation analysis found no such state, only buttons that export directly. The record was amended in place with a Correction section before planning, and the feature shipped as button markers plus a caption instead.

Root cause (positive): a change record describes intent against the tree as the author understood it - a premise can drift before the record lands, and the analysis step exists precisely to catch that drift before it plans around it.

Preventing rule: covered by "amend the record in place against the verified state before planning" in `WORKFLOW.md` - this entry records the rule working as designed.

### Scripted edits verify the actual call-site text

Observed symptom: a `sed` sweep to drop the `exportStrategy` argument was written against an assumed call-site shape (`{ song: testSong, exportStrategy }`) and left the real site (`{ song: song(), exportStrategy: 'tight' }`) untouched - only the typecheck failure revealed the miss.

Root cause: the pattern was composed from a guess about the receiver's identifier rather than a grep of the actual call - a scripted edit that never sees its target's true text can only fail silently.

Preventing rule: see "Scripted sweeps must cover inline literals too" in `WORKFLOW.md` - enumerate the target's real shapes before writing the pattern, or verify leftovers after the sweep.

### Stage gates ask through the host's mechanism

Observed symptom: the first plan gate of the window was reported in prose - "confirmation needed" - instead of the agent's question tool, and the user corrected the interaction before approving.

Root cause: the workflow text described gate confirmation without naming how the ask is delivered, so the prompt defaulted to narration in the response stream.

Preventing rule: see "Stage Gates" in `WORKFLOW.md` - checkpoint prompts route through the host's ask-the-user mechanism, never a plain-response statement that confirmation is needed.
