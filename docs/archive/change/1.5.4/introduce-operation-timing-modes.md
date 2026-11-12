# Introduce report modes and the operations table

**Type:** Feature

## Summary

| Field         | Value                                                                                                                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Align the Session Reporting convention with the canonical operation-timing semantics - named report modes, a per-operation context table, and a timing sentence that names the operation           |
| Key decisions | The verbose, diagnostic, and timing modes emit one shared operations-table form; the full usage report stays behind its specific request; `informational` adds nothing beyond the timing paragraph |
| Open risks    | none                                                                                                                                                                                               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The `session-reporting` rules in `WORKFLOW.md` predate the canonical operation-timing semantics. The current text arms timing by default and mentions "verbose mode" without defining how a mode is selected, what it emits, or what the other named modes do.

This change aligns the section with the canonical model:

- Operation timing stays armed by default on every operation. The closing sentence names the operation: `<description> operation took <m:ss>` replaces the vaguer `<subject> took <m:ss>`.
- Named report modes are defined: `verbose`, `diagnostic`, and `timing` named on a request arm the operations table, and `informational` adds nothing beyond the timing paragraph. A named mode is request-scoped - resolved from the request text, never from environment variables.
- The operations table is the compact context summary: one row per operation the session has run, with `Operation`, `Time`, and `Context` columns. Context is the change in context-window fulfillment the operation caused - the best measure available, an estimate when the environment reports none. The existing short description of the change still precedes the timing line.
- The full session usage report stays gated: it emits only when usage or context reporting is specifically requested ("print usage"), never riding along on an unrelated response. A descriptive context-usage form answers only a direct context question.
- A counter the host does not expose is omitted entirely in both report forms - no `unknown` or placeholder values.
- The driving agent and model are named once per session - on the first verbose, diagnostic, or timing report - or whenever a request asks for them, as a separate paragraph outside the report block.
- The stage-breakdown rule gains its column contract (`Stage`, `Elapsed`, `Share`, `Note`) and the no-guessing rule for missing stage times.

Companion corrections verified against the tree during analysis:

- `FORMAT.md` still documents an `Optimized` MAX export strategy - the strategy set is `simple`, `complex`, `tight` (`src/constants/export.ts`), and tight produces the delay-optimized REG7 stream in `src/exports/max.ts`. The entry is relabelled `Tight`.
- `SPECIFICATION.md` names `exportAssemblyOptimized.test.ts` in the export-stability section - the suite is `exportAssemblyTight.test.ts` under `test/exports/`. The reference is corrected.
- `GUIDELINES.md` merges its two duplicate never-commit statements into one and clarifies that an implementation plan is composed and presented for approval in the session while the durable plan document lands in `docs/plan/<version>/` only on explicit request or a named window run - the Document Directory Access gate stays the authority on when the file is written.

## Use Cases

- When a request names `verbose`, the response closes with the operations table covering every operation of the session plus the short change description, then the timing sentence.
- When a request names `informational`, the response carries only the timing sentence - no table.
- When the user asks for usage or context reporting, the full usage report emits regardless of the named mode.
- When a request names `no timing`, no timing sentence, table, or breakdown emits for that request.

## Hints

- The owning text is the Session Reporting block under Agent Operations in `WORKFLOW.md` - the rewrite keeps the block's three-rule shape and only re-words rule bodies.
- The canonical semantics live in the `compass-skill` `process/operation-timing.md` - the adopted `session-reporting` extension in `GUIDELINES.md` needs no re-registration.

## Out of Scope

- The JSON parameter-document exchange of the canonical corpus - the repository has no intake-question surfaces and does not adopt it.
- Changes to the content of the full "print usage" report.
- Product source code.
