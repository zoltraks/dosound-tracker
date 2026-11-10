# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Dependency placement follows the dependency's group

Observed symptom: the ayumi change record and its plan pair were written into `docs/change/1.4.5/` and `docs/plan/1.4.5/` from the `package.json` version rule, then had to move to `1.4.6` to sit beside the `settings-modal` record the change depends on.

Root cause: the placement rule covers only the `package.json` default and said nothing about a record bound to a sibling group by a declared dependency - the user had already created the settings record under `1.4.6` for the same window of work.

Preventing rule: see "Change Request Document Creation" in `GUIDELINES.md` and "Implementation Planning" in `WORKFLOW.md`.

### Named dependency authorizes reading that record

Observed symptom: the request named the settings change record as the integration target for engine selection, and the Document Directory Access gate on `docs/change/` did not say whether reading it was allowed - the gate lists only named window requests and specific implementation requests.

Root cause: the gate text covered whole-group authorization but not a single record named by the request as a dependency.

Preventing rule: see "Document Directory Access" in `WORKFLOW.md`.

### Generated records carry drafting artifacts

Observed symptom: the specification-audit document shipped a self-correction note mid-paragraph (`wait, FIR size is 194...`) inside the Fidelity section - caught and fixed only because the file was re-read.

Root cause: a document generated in one write can hold half-edited prose that no lint or table check flags.

Preventing rule: see "Proof generated records before delivery" in `WORKFLOW.md`.

### Format sweeps stale exact-match edits

Observed symptom: an `edit` call on the audit table failed because Prettier had re-aligned cell padding since the last read.

Root cause: known and already covered - a file formatted between read and edit invalidates exact-match strings.

Preventing rule: existing coverage - see "Re-read files after a format sweep" in `WORKFLOW.md`.
