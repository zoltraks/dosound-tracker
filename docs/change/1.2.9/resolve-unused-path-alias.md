# Adopt the @/ alias or remove it from configuration

**Type:** Chore

**Source:** AUDIT-1.2 REC-018 / FND-CQY-006

## Summary

The `@/` path alias is configured but unused while deep relative imports accumulate.

## Description

Either migrate cross-module imports to `@/` per the standard, or remove the alias from `tsconfig.app.json` and `vitest.config.ts` and amend the standard. Dead configuration must not remain.

## Out of Scope

A partial adoption is acceptable - pick one direction and record it.
