# Specification Audit - Lazy-Load the Export Pipelines

## Document Information

|            |                                                                |
| ---------- | -------------------------------------------------------------- |
| Change     | `docs/change/1.4.4/lazy-load-export-pipelines.md`              |
| Plan       | `docs/plan/1.4.4/lazy-load-export-pipelines-implementation.md` |
| Audit Date | 2026-11-10                                                     |

## Completeness

| Change-record requirement                                         | Covering plan step                    |
| ----------------------------------------------------------------- | ------------------------------------- |
| Dynamic `import()` inside the file-operation handlers             | Steps 3-4                             |
| Keep `exportFileNaming` and tiny helpers static                   | Step 2                                |
| Handlers already behave asynchronously - no sequencing dependency | Analysis (fire-and-forget signatures) |
| `js-yaml` cannot go lazy - synchronous initial parse              | Analysis (stays static, untouched)    |
| Out of Scope: bundle-splitting beyond the export boundary         | Respected - no `manualChunks`         |

No requirement lacks a covering step. No step lacks a stated requirement.

## Ambiguity

"Converting the handlers to `await import(...)`" admits making the handlers
`async` or resolving the imports in a wrapper. `async` is the direct reading
and keeps the summary/catch semantics; `() => Promise<void>` remains
assignable to the declared `() => void` fields, so the hook's interface and
every caller are unchanged.

## Implementability

| Step | Check                                                                               | Result |
| ---- | ----------------------------------------------------------------------------------- | ------ |
| 2    | All five static pipeline imports exist; no other `src/` file imports `src/exports/` | Pass   |
| 3    | The three direct handlers are `useCallback` `void` functions wrapping try/catch     | Pass   |
| 4    | The five context handlers verified; `exportDumpWithContext` delegates only          | Pass   |

`useExportModal` and `App.tsx` callers are synchronous `void` - fire-and-
forget on an `async` handler preserves behavior. `bin.ts` imports `asm.ts`
statically, so Vite emits `asm` as a shared chunk when both go dynamic.

## Fidelity

- Enumeration fidelity - all nine handler surfaces in the file are accounted for: three direct exports, five context exports, one delegating dump handler.
- Vocabulary freeze - module specifiers keep the project's `.ts`-suffixed extension style.
- Cross-party parity - `dist/` output contract changes only in chunk topology; exported file bytes are untouched (the pipelines themselves do not change).
- Constants completeness - no new constants; `chunkSizeWarningLimit` 600 in `vite.config.ts` is unchanged and now measures the slimmer entry chunk.
- Boundary decisions - a failed chunk fetch resolves through the existing `catch` + summary path; first-export latency is the record-accepted risk.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    | -       | -                |
