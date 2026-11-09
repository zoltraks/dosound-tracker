# Bring configs, e2e, and Electron inside analysis scope

**Type:** Chore

**Source:** AUDIT-1.4 REC-010 (FND-INF-004)

## Summary

| Field         | Value                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------- |
| Intent        | Close the unchecked file surface and the stale-dist e2e false-pass                                 |
| Key decisions | lint and typecheck scope extends to configs, `e2e/`, and `electron/`; e2e builds before previewing |
| Open risks    | electron `.cjs` files may need dedicated parser options                                            |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`npm run typecheck` is a documented no-op (`files: []`), `vitest.config.ts` and `playwright.config.ts` belong to no tsconfig project, `e2e/` and `electron/*.cjs` sit outside the ESLint scope, and the e2e `webServer` serves a pre-existing `dist/` without building, so a stale build can pass silently.

The change extends lint and typecheck coverage to the config files, `e2e/`, and `electron/`, and adds a build precondition to the e2e path - a `pretest:e2e` build or a build-capable `webServer` command - so the suite always previews current code.

## Hints

- `tsc -b` inside `npm run build` already covers `src/` and `test/`; whether `typecheck` becomes a real gate or the build stays the effective type check is decided in the plan, and `TESTING.md` is updated to match.
- Verification is lint and typecheck reporting on every source file, plus e2e proving it runs a fresh build.

## Out of Scope

- New test content - this change covers analysis scope only.
- CI pipeline work, which the project has evaluated and declined.
