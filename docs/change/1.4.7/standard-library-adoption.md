# Adopt Engineering Standards from the Canonical Library

**Type:** Chore

## Summary

| Field         | Value                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Adopt four evaluated standard documents from the compass `references/standard/` library into `docs/standard/` to widen the engineering-standard set |
| Key decisions | Scope confirmed as `Recommended plus optional`: `clean-code-general`, the `merge-conflict` + `typescript-conflict` pair, `javascript-inline`        |
| Open risks    | none                                                                                                                                                |

## Description

An evaluation of the repository's stack against the compass engineering-standard library verified the eleven vendored standards as current and selected four additional candidates matching the implementation:

- **`clean-code-general-development.md`** - the language-agnostic clean-code factor (SOLID, DRY, KISS, YAGNI, naming, error handling, testability) that `REFACTORING.md` findings classify against.
- **`merge-conflict-development.md`** and **`typescript-conflict-development.md`** - merge-conflict resolution for tracked trees and for the TypeScript/npm toolchain, covering branch syncs and lockfile conflicts. The pair lands together because the TypeScript document builds on the general standard's taxonomy.
- **`javascript-inline-development.md`** - conventions for agent-side Node.js scratch probes (`node -e`, throwaway `.mjs` files).

Each file lands as a verbatim canonical copy, then is restyled by the repository format convention (spaced table separators, code reflows) so future `diff -w -B` sync checks stay meaningful. The standards index gains one row per adopted file, marked `Canonical`.

## Out of Scope

- `## Project Conventions` sections - none are authored at adoption; project deltas accumulate through the session-review routing.
- Synchronization of the eleven already-adopted standards - verified current during the evaluation.
- Any source code, configuration, or tooling change.
