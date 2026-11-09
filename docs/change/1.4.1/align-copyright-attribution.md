# Align copyright attribution fields

**Type:** Chore

**Source:** AUDIT-1.4 REC-017 (FND-CPR-002)

## Summary

| Field         | Value                                                         |
| ------------- | ------------------------------------------------------------- |
| Intent        | Remove attribution ambiguity in distributed binaries          |
| Key decisions | `build.copyright` is aligned to the `LICENSE` entity and year |
| Open risks    | `none`                                                        |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`LICENSE` reads "Copyright (c) 2025 Zoltar X / New Generation" while the electron-builder `build.copyright` field in `package.json` reads "Copyright (c) 2024 Filip Golewski". Both name the same natural person, but distributed artifacts carry ambiguous attribution.

The change aligns `build.copyright` with the `LICENSE` text so installers and packaged metadata carry a single consistent attribution.

## Hints

- Verification is a field diff between `LICENSE` and `build.copyright`.
- The vendored `zx0.ts` BSD-3-Clause notice is unrelated and stays untouched.

## Out of Scope

- Per-file copyright headers on project sources.
- License text changes.
