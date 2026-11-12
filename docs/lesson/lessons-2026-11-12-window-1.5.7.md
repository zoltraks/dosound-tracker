# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Browser-Reserved Chord Never Reached the Page

Observed symptom: Ctrl+PageUp/PageDown song-line navigation passed its unit
tests and fired in a wired harness, yet the owner reported it did nothing in
the real app - twice, once scoped to tracks and once registered globally.

Root cause: browsers reserve Ctrl+PageUp/PageDown for tab switching, so the
`keydown` event is never delivered to the page - no binding, however correct,
can observe it.

Preventing rule: see "Forbidden Patterns" in
`docs/standard/typescript-react-development.md` - prefer `Shift` or `Alt`
variants for keys the browser claims, and confirm reserved-chord candidates
against the target browser before wiring them.

### Persisted Selection Redirected a Command-Button Operation

Observed symptom: CLONE TRACK cloned a fragment from the selected track
instead of the whole active track whenever a selection existed - including a
stale selection restored from local storage, possibly on another track.

Root cause: the command-button handler consumed `trackSelection` state the
way the selection-aware CTRL+C shortcut does; the persisted selection
survives focus changes and reloads, so the operation's subject silently
diverged from what the button's label promises.

Preventing rule: see "Forbidden Patterns" in
`docs/standard/typescript-react-development.md` - command buttons bind to the
active subject; selection-aware behaviour belongs to keyboard shortcuts only.
