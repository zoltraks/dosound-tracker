# Specification Audit - Narrow the file origin check

## Document Information

|            |                                                              |
| ---------- | ------------------------------------------------------------ |
| Change     | `docs/change/1.4.5/narrow-file-origin-check.md`              |
| Plan       | `docs/plan/1.4.5/narrow-file-origin-check-implementation.md` |
| Audit Date | 2026-11-10                                                   |

## Completeness

| Requirement (record)                               | Plan step                                                   |
| -------------------------------------------------- | ----------------------------------------------------------- |
| `midi` granted from the packaged bundle            | Extend the permission policy tests + narrowed `isAppOrigin` |
| `midi` denied from any other `file://` page        | Extend the permission policy tests + narrowed `isAppOrigin` |
| `will-navigate` blocks `file://` outside the index | Narrowed `isAppOrigin` (the gate's only predicate)          |
| Dev origin `http://localhost:8008` keeps working   | `parsed.origin === DEV_ORIGIN` branch                       |
| Resolve URL to path, compare to bundle index       | `fileURLToPath` against `BUNDLED_INDEX_PATH`                |
| Module stays loadable without Electron             | `node:path`/`node:url` only, `__dirname` resolution         |
| `SPECIFICATION.md` updated before code             | Documentation Updates + Implementation Order step 1         |

No uncovered requirements; no orphan steps.

## Ambiguity

- "Admit the dev origin" is read as URL-origin equality, not string prefix: the old prefix check also admitted `http://localhost:8008.evil.com`, which the record's denial intent excludes.
- "Any other `file://` URL" includes unparseable or non-local `file:` hosts: deny by default in the `catch` path.

## Implementability

- `electron/permissions.cjs` exists with `isAppOrigin`, `isMidiAllowed`, `isExternalHttpUrl` exports.
- `electron/main.cjs` consumes `isMidiAllowed` in `setPermissionRequestHandler` and `setPermissionCheckHandler` (lines 26-35) and `isAppOrigin` in the `will-navigate` gate (lines 44-48); no call-site change needed.
- `__dirname` in `electron/` resolves `../dist/index.html` to the same path `main.cjs` loads when packaged (line 51).
- `new URL`, `fileURLToPath`, `path.join` are Node builtins; `createRequire` loading is unaffected.
- `test/electron/permissions.test.ts` already uses the `createRequire` pattern and the node environment pragma.

## Fidelity

- Vocabulary: permission name `midi`, dev origin `http://localhost:8008`, bundle path `dist/index.html` - identical to `electron/main.cjs` and `vite.config.ts`.
- Constants: `DEV_ORIGIN` and `BUNDLED_INDEX_PATH` enumerated once in the module.
- Boundary: a `file://` URL with query or hash still resolves to the bundled index path and is granted - same document, accepted. A `file:` URL with a non-local host fails `fileURLToPath` and is denied.
- Cross-party parity: both consumers share the one predicate pair; no second origin rule is introduced.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
