# Specification Audit - Sync the Lockfile Version Inside the Bump Script

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

|            |                                                                   |
| ---------- | ----------------------------------------------------------------- |
| Change     | `docs/change/1.4.0/sync-lockfile-version-in-bump.md`              |
| Plan       | `docs/plan/1.4.0/sync-lockfile-version-in-bump-implementation.md` |
| Audit Date | 2026-11-09                                                        |

## Verdict

The plan is ready for implementation. Both lockfile version fields were
located, the write approach matches the file's formatting, and the drift the
record describes is confirmed in the tree.

## Completeness

Every requirement in the change record maps to a plan step.

- Bump script syncs the lockfile in the same operation: covered by the
  `bump-version.mjs` step.
- `VERSIONING.md` updated if the procedure needs it: covered by the
  documentation step; it does need it because the manual `npm install` step
  is absorbed.
- Verification through the next bump: covered by the integration-test note
  and the copied-manifest harness.

No requirement lacks a step and no step lacks a requirement.

## Ambiguity

The record offered "through `npm install` or an equivalent version write".
The plan resolves it to the equivalent version write: deterministic, offline,
and it cannot perturb resolved dependency entries. A real `npm install` during
the bump would rewrite resolved metadata and could fail without network.

## Implementability

- `scripts/bump-version.mjs` exists and already imports `readFileSync`,
  `writeFileSync`, `resolve`; the added code needs no new imports.
- `package-lock.json` carries `"version": "1.3.9"` at the root (line 3) and
  inside `packages[""]` (line 9); both fields the plan writes are present.
- The lockfile uses two-space JSON indent, matching the plan's
  `JSON.stringify(lock, null, 2)` rewrite, so the sync produces a minimal
  diff.
- The current drift (lockfile 1.3.9 vs manifest 1.4.0) is confirmed, matching
  the record's finding in kind though the exact numbers aged.

## Fidelity

- Enumeration fidelity: the lockfile exposes exactly two version fields the
  sync must touch - root `version` and `packages[""].version`. Both are
  enumerated.
- Boundary decisions: a missing or unparsable lockfile fails the script
  loudly; the plan states this explicitly.
- Constants completeness: no numeric bounds involved.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| `none`  | -       | -                |
