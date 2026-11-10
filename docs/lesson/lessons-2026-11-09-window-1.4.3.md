# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Synthetic events need bubbles and a real target

Observed symptom: a `useKeyboardNavigation` dispatch test reported handlers never called and `defaultPrevented` false, plus a `target?.closest is not a function` storm.

Root cause: `new KeyboardEvent` defaults to non-bubbling so a `window` listener never fired, and dispatching on `window` gave the handler a target without `closest` or `tagName` - verified against the hook's guard code.

Preventing rule: see "Component test hygiene" in `TESTING.md`.

### Audit and record findings age before implementation

Observed symptom: the normalization record claimed instrument `number: "BASS"` throws `Invalid instrument number`; the real loader truncates hex via `parseInt` and accepts it at slot 186.

Root cause: record claims describe the tree at writing time - pinned against the live parser before correcting, per the existing convention.

Preventing rule: already covered - see "Audit findings age between report and implementation" in `WORKFLOW.md`.

### Intake-tier measurement has no in-repo script

Observed symptom: `scripts/verify-set.py` referenced by the coverage record does not exist in this repository.

Root cause: `verify-set.py` is an external compass tool; the record already names equivalents as the sanctioned path - `wc -l` and byte counts against the recorded tiers.

Preventing rule: already covered - the record's own Hints name the equivalents; intake tiers live in the record.
