# Rename or merge the extensionless test file

**Type:** Fix

**Source:** AUDIT-1.2 REC-005 / FND-CQY-001

## Summary

`test/utils/exportMax.test` is committed but never collected by the Vitest include glob.

## Description

The file holds a complete MAX-export suite but lacks a `.ts` extension, so `test/**/*.{test,spec}.{ts,tsx}` never collects it. Rename it to `exportMax.test.ts` or fold its cases into the sibling suite so the MAX exporter tests actually run.

## Use Cases

- When `npm test` runs, the file's cases must execute.
- When cases duplicate `exportMax.test.ts`, merge rather than duplicate.
