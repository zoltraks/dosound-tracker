# Add REASON comments or remove non-null assertions

**Type:** Fix

**Source:** AUDIT-1.2 REC-016 / FND-CQY-004

## Summary

Three non-null assertions lack the `REASON:` comment the standard requires.

## Description

Sites: `src/main.tsx:5`, `src/utils/zx0.ts:124`, `src/utils/zx0.ts:184`. Add a justification comment or replace the assertion with a safe alternative.
