# Align the Test Tree with the Domain Grouping

**Type:** Chore

## Summary

Align `test/` structure with the reorganized `src/` - rename `test/stores/` for the dissolved stores directory and evaluate domain subfolders in `test/hooks/` and `test/utils/` mirroring the source grouping.

## Description

The test tree kept its pre-reorganization layout while `src/` gained full domain grouping. `test/stores/` still names a directory that no longer exists in `src/`. Align names and evaluate mirrored subfolders where a clean mirror exists; tests that cover several files keep their flat names.
