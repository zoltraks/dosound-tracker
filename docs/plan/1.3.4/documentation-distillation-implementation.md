# Distill the Project Documentation Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.4/documentation-distillation.md`.

## Step by Step Implementation

**Repair drift in TESTING.md**

Update stale coverage-gap statements: `src/hooks/` is not "only 1 of 30 hooks" - 44 hooks exist with 17 test files under `test/hooks/`; `src/modals/` has a component test (`FilePickerModal.test.tsx`); remove the stale counts and keep the remaining gaps accurate.

**Distill SPECIFICATION.md**

Compress the Audio-Critical Development section to a short statement pointing at `GUIDELINES.md` as the owning document - the section duplicates the principles listed there verbatim. Keep the register table, the timing rules, and every behavioural detail that is not obvious from source.

**Verify cross-references**

Every `See src/...` reference introduced or kept resolves to an existing file; the verification is grep-based and documentation-only.

**Format**

Run `npx prettier --write` on touched documents. No verification loop - documentation-only change.
