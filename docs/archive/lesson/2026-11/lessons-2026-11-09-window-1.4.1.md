# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Packaging Metadata Had No Lightweight Proof Path

Observed symptom: a `build.copyright` manifest change could only be verified as a field diff or through a full installer build - nothing recorded the middle path.

Root cause: the verification options for packaging changes named `electron/` edits and full `electron:build` launches, never the unpacked-bundle check.

Preventing rule: see "Verify packaging metadata through an unpacked build" in `WORKFLOW.md` - `electron-builder --dir` plus a `PlistBuddy` read of `NSHumanReadableCopyright` proves the shipped string without an installer.

### A Same-Rule Violation Hid Outside the Audit's Line List

Observed symptom: the audit finding named two `Storage.prototype` violations, but `branchGaps.test.ts` carried a third instance that would have survived the record's literal scope.

Root cause: audit-derived records enumerate the sites the report saw - the violation class, not the file list, is the requirement.

Preventing rule: see "Audit findings age between report and implementation" in `WORKFLOW.md` - every finding is re-verified against the current tree, and the record's mechanism governs over its literal line list.

### Prototype-Stubbed Storage Tests Passed Vacuously

Observed symptom: two tests patched `Storage.prototype` and passed while never intercepting the mock - the error paths they claimed to cover never ran.

Root cause: the installed localStorage mock is a plain object outside the prototype chain, so prototype spies and stubs silently never fire.

Preventing rule: see "Component test hygiene" in `TESTING.md` - spies and stubs target the `localStorage` object itself, and assertions must prove the code path actually ran.

### Stale Template Paths Misdirected Plan Authoring

Observed symptom: the implementation-plan template pointed at a nonexistent `ts-react-development.md` standard and a dissolved `src/stores/` directory.

Root cause: the standard-library rename and the store dissolution landed after the template was written, and no sweep checked template path references against the tree.

Preventing rule: see "Housekeeping checklist" in `WORKFLOW.md` - the stale-figure sweep now includes path references inside `docs/template/` against the real tree.
