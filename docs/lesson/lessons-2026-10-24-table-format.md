# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Double-Pipe Table Rows Are Malformed

Observed symptom: generated review and assessment documents carried table rows
starting with `||`, producing an unwanted empty leading column and breaking the
documented table convention.

Root cause: the writer pattern-matched table style instead of applying the
Markdown Tables rules in `GUIDELINES.md` - a `||` opener reads as a leading pipe
plus an empty cell.

Preventing rule: see the "Pipes" bullet under "Markdown Tables" in
`GUIDELINES.md` - a row starts with a single `|` followed by a space.
