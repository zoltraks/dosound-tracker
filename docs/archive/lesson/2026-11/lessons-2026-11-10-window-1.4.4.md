# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Brace-cutting during scripted extraction

Observed symptom: a Python-assisted move of `createAudioContextStub` left a truncated helper file and a dangling tail in the origin test file - `PARSE_ERROR` on all four suites.

Root cause: `index('};')` matched the indented close of a nested object literal inside the function body, not the function's own column-0 terminator.

Preventing rule: see "Cut extractions on the column-0 terminator, not the first `};`" in `WORKFLOW.md`.

### Last-wins hides inside `map.set` overwrites

Observed symptom: `App.tsx` and `useSequencerIntegration` held two normalized-id maps over the same instrument list that diverged on duplicate keys.

Root cause: a plain `map.set` loop overwrites silently - last-wins by accident, while `Array.find` and the sibling map resolved first-wins. The defect only surfaced when the 1.4.3 alignment made both maps comparable.

Preventing rule: resolution-order semantics must be chosen deliberately whenever a `Map` replaces a `find` - first-wins needs the explicit `if (!map.has(key))` guard.
