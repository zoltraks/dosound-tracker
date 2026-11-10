# Specification Audit - Electron Navigation Containment

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

|            |                                                                     |
| ---------- | ------------------------------------------------------------------- |
| Change     | `docs/change/1.3.8/electron-navigation-containment.md`              |
| Plan       | `docs/plan/1.3.8/electron-navigation-containment-implementation.md` |
| Audit Date | 2026-11-09                                                          |

## Verdict

The plan is ready for implementation. Both required handlers map to one verified insertion point, the origin predicate already exists, and the test harness for `.cjs` modules is in place.

## Completeness

The record requires new-window containment and navigation restriction. The plan covers `setWindowOpenHandler` (delegating external http(s) to the OS browser, denying app windows) and `will-navigate` (pinned to the app origin). Markdown link rendering keeps `target="_blank"` because the handler, not the markup, owns containment - matching the record's out-of-scope line.

## Ambiguity

"Denied or delegated" resolves to: external http(s) → `shell.openExternal`, all else → denied, matching the record's use case that links keep working in the user's browser. `isAppOrigin` covers both packaged (`file://`) and dev (`http://localhost:8008`) navigation, so dev-mode reloads and HMR are unaffected.

## Implementability

Verified against the tree:

- `electron/main.cjs` `createWindow` installs session permission handlers at lines 23-35 - the navigation handlers join the same block.
- `electron/permissions.cjs` exports `isAppOrigin` and `isMidiAllowed` - adding `isExternalHttpUrl` preserves the standalone-`.cjs` test convention.
- `test/electron/permissions.test.ts` exists and loads the module through `createRequire`.
- `src/utils/markdown/markdown.ts` emits `target="_blank"` links for http(s) URLs only - exactly the class delegated to `openExternal`.

## Fidelity

- Boundary decisions: no second `BrowserWindow` is ever created, so the preload surface never reaches remote content.
- Constants completeness: the dev origin `http://localhost:8008` is already the single declared constant.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| `none`  | `none`  | `none`           |
