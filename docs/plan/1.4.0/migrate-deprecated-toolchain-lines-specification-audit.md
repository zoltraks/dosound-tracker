# Specification Audit - Migrate off Deprecated Toolchain Lines

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

|            |                                                                        |
| ---------- | ---------------------------------------------------------------------- |
| Change     | `docs/change/1.4.0/migrate-deprecated-toolchain-lines.md`              |
| Plan       | `docs/plan/1.4.0/migrate-deprecated-toolchain-lines-implementation.md` |
| Audit Date | 2026-11-09                                                             |

## Verdict

Ready. Both targets are stable and compatible per the registry check; the
vitest 5 revert is honoured by staying on 4.x.

## Completeness

eslint and vite lines migrate together with the forced companions
(`@eslint/js`, `@vitejs/plugin-react`); the `overrides` removal is
enumerated, not implied. Plugin compatibility is verified against peer
ranges, not assumed.

## Ambiguity

The record said "when each target is stable and compatible" - verified true
today. vitest selection resolves to 4.1.12 on recorded history.

## Implementability

`eslint.config.js` is already flat config; `vite.config.ts` uses standard
`rollupOptions` output fields that rolldown accepts. npm engine floor is
already satisfied (node 26).

## Fidelity

Constants enumerated: eslint ^10.14.0, @eslint/js ^10.0.1, vite ^8.3.7,
@vitejs/plugin-react ^6.3.0, vitest ^4.1.12 unchanged.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| `none`  | -       | -                |
