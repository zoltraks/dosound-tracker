# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### DOM-interface fakes lost their Mock type through early casts

Observed symptom: characterisation tests for the MIDI attach module failed typecheck - `mock.calls` was unreachable on fakes cast to `MIDIInput` at creation.

Root cause: the fake was cast `as unknown as MIDIInput` where it was built instead of where the API demanded the DOM type.

Preventing rule: see "DOM-interface fakes keep their mock-bearing shapes" in `TESTING.md`.

### The json-summary reporter hid line-level coverage detail

Observed symptom: a coverage run with `--coverage.reporter=json-summary` produced only per-file percentages - the per-line and per-branch map needed a second run with `--coverage.reporter=json`.

Root cause: the reporter choice controls which artifacts land in `coverage/`; `coverage-final.json` is only written by the `json` reporter.

Preventing rule: see "Line-level gap maps need the `json` reporter" in `TESTING.md`.
