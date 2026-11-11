# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Component Test Ran Without Registered Cleanup

Observed symptom: the new CommandPanel suite failed on its second render with "Found multiple elements with the role button and name UNDO" - rendered panels accumulated across tests in the file.

Root cause: vitest runs without globals, so `@testing-library/react` never auto-registers cleanup - the suite was authored without `afterEach(() => cleanup())` while TESTING.md, the conditional read for test work, was not loaded before writing.

Preventing rule: see "Component test hygiene" in `TESTING.md`.

### Generated Documents Missed the Prettier Check Again

Observed symptom: the change record, implementation plan, and specification audit were all rewritten by the repository-wide format pass instead of passing `npx prettier --check` on first delivery - the same wound recorded in `lessons-2026-11-10-intake-and-format.md`.

Root cause: the tooling note already requires the prettier check before a generated document is presented as a stage product, but TOOLING.md is a conditional read that was not loaded for document authoring - a missed rule, not a missing convention. Second consecutive session for this wound class, so intake discipline is the leak to watch, not the rule text.

Preventing rule: see "Table formatting and Prettier" in `TOOLING.md`.
