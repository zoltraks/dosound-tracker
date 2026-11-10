# Specification Audit - Run the Pure-Logic Suites in the Node Environment

## Document Information

|            |                                                                |
| ---------- | -------------------------------------------------------------- |
| Change     | `docs/change/1.4.4/run-pure-tests-in-node-env.md`              |
| Plan       | `docs/plan/1.4.4/run-pure-tests-in-node-env-implementation.md` |
| Audit Date | 2026-11-10                                                     |

## Completeness

| Change-record requirement                                                     | Covering plan step                        |
| ----------------------------------------------------------------------------- | ----------------------------------------- |
| `// @vitest-environment node` docblocks on the ~55 pure files, per-file check | Steps 2-3 (59 identified, suite-verified) |
| `sequencerWorker.test.ts` needs `self`/`MessageEvent` - keep jsdom            | Analysis (excluded)                       |
| `vgmAndTrackLine.test.tsx` uses `document` - keep jsdom                       | Analysis (excluded)                       |
| Verify each file rather than globbing blindly                                 | Step 3 (full-suite gate + file survey)    |
| Out of Scope: pool or worker-count tuning                                     | Respected - none touched                  |

No requirement lacks a covering step. No step lacks a stated requirement.

## Ambiguity

"Pure files" admits directory-level globbing or per-file classification. The
record demands per-file verification - the survey named all 37 jsdom files
individually, leaving 59 safe, and the full-suite run is the enforcement gate.

## Implementability

| Step | Check                                                                                | Result |
| ---- | ------------------------------------------------------------------------------------ | ------ |
| 2    | All 59 files exist and carry no existing `@vitest-environment` docblock              | Pass   |
| 3    | `test/setup-localstorage.ts` installs the store when `window.localStorage` is absent | Pass   |

`File`/`Blob`/`MessageChannel` exist in Node 18+; `createRequire` electron
tests are node-native; fetch-stubbing suites use `vi.stubGlobal`.

## Fidelity

- Enumeration fidelity - the file-level enumeration is recorded in the survey: 59 stamped, 37 jsdom-retained with named exceptions matching the record's own hints.
- Vocabulary freeze - the docblock pragma is Vitest's recorded mechanism.
- Cross-party parity - global `environment: 'jsdom'` stays for unstamped files; no config change.
- Constants completeness - no constants involved.
- Boundary decisions - `window.*` consumers (`songManagement`, `branchGaps`, `useStorageMirror`, `uiState`, `timerUtils`) stay jsdom rather than bridging `window` in setup - bridging is the rejected alternative since it would silently change what the setup simulates.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    | -       | -                |
