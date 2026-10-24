# Version 1.3.2 Review

**Status:** Complete

**Verdict:** Ready

## Document Information

|             |                                                                        |
| ----------- | ---------------------------------------------------------------------- |
| Version     | 1.3.2                                                                  |
| Review Date | 2026-10-24                                                             |
| Commands    | git log, git status, git diff --stat, npm run typecheck, npm run lint, |
|             | npm run build, npm test, npm run test:e2e                              |

## Verdict

Ready for the bump. Both active change records in the window are implemented, documented, and verified; the working tree carries all changes uncommitted per the no-commit rule of the cycle.

## Scope

Covers the two active change records under `docs/change/1.3.2/` (the markdown-rendering hardening fix and the redundant persistence feature), plus the window's refactoring pair under `docs/refactoring/1.3.2/`. The `docs/change/1.3.3/` record is a later window's seed and is out of scope.

## Recorded Work

| Document                                              | Kind        | Status | Result                                        |
| ----------------------------------------------------- | ----------- | ------ | --------------------------------------------- |
| docs/change/1.3.2/harden-markdown-rendering.md        | Fix         | Done   | Allowlist fetch, TrustedHtml brand, build CSP |
| docs/change/1.3.2/add-persistence-redundancy.md       | Feature     | Done   | IndexedDB mirror, startup restore, reminder   |
| docs/refactoring/1.3.2/REFACTORING.md + ASSESSMENT.md | Refactoring | Done   | Storage key literal consolidation, complete   |

## Repository Analysis

The cycle never commits, so reconciliation runs against the working-tree diff rather than the log.

- **Confirmed** - `harden-markdown-rendering`: `src/utils/bundledMarkdown.ts`, `src/utils/markdown.ts` brand, rewired fetches in `useMessageSystem.ts` and `App.tsx`, `TrustedHtml` sink in `EnvelopeSection.tsx`, `inject-content-security-policy` plugin in `vite.config.ts`, and `dist/index.html` carries the injected meta tag. `add-persistence-redundancy`: `src/utils/persistenceMirror.ts`, mirror call in `useStorage.ts`, `normalizeRestoredSong` in `useSongManagement.ts`, restore effect and `mirrorRestoreNotice` in `useDataManagement.ts`, reset clearing and notice wiring in `App.tsx`, `MESSAGES.md` reminder, F-16 in `PROJECT.md`, mirror sections in `SPECIFICATION.md`, CSP note in `DEPLOYMENT.md`.
- **Unconfirmed** - none.
- **Undocumented** - none: the `useMessageSystem.test.tsx` stub extension and the storage-key consolidation are covered by the respective record and the refactoring proposal.
- **Deviations** - none: each record's plan was followed; the sanitiser alternative in the fix record was set aside in favour of the allowlist plus CSP option the record itself offers.

## Findings

| Severity | Finding | Evidence | Action |
| -------- | ------- | -------- | ------ |
| none     | -       | -        | -      |

## Verification Evidence

- `npm run typecheck`, `npm run lint`, `npm run build`: clean, zero errors and zero warnings.
- `npm test`: 73 files, 544 tests pass (was 68 files / 525 tests before the window; +2 test files for the fix, +3 for the feature).
- `npm run test:e2e`: 12 Playwright tests pass on chromium and webkit against `vite preview` serving the CSP-carrying `dist/` build - the app keeps working under the policy.
- `dist/index.html` contains the `Content-Security-Policy` meta tag.
- `git status`: only the window's recorded files are modified or new; no stray changes.

## Unable to Verify

- The packaged Electron bundle over `file://` was not executed in this environment; the `connect-src` policy includes `file:` explicitly for the bundled-document fetches, and first launch of a packaged build is the residual check.
- Real IndexedDB behaviour in a live browser is exercised only through the in-memory fake in tests; jsdom exposes no `indexedDB`. The mirror degrades to a logged warning when unavailable.

## Decision

- **Decision:** go
- **Decided by:** the project owner
- **Conditions:** none
- **Accepted risks:** the two unverified items above - packaged-app CSP behaviour and live IndexedDB restore - are accepted as manual first-run checks.
