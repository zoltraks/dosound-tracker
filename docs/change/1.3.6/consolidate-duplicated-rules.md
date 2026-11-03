# Consolidate Duplicated Rules Into Single Owners

**Type:** Chore

**Source:** ASE evaluation findings, 2026-11-03

## Summary

| Field         | Value                                                                            |
| ------------- | -------------------------------------------------------------------------------- |
| Intent        | Give each duplicated normative rule exactly one owner                            |
| Key decisions | `TESTING.md` owns the verification loop; `WORKFLOW.md` owns the feature sequence |
| Open risks    | Consolidation must not drop normative content - rules move, never vanish         |

## Description

Two normative rules currently live in more than one active owner:

- The verification-loop milestone list (pre-change baseline, per-iteration, post-implementation, pre-bump, production-ready) is stated verbatim in `TESTING.md`, restated in `WORKFLOW.md` "Verification Loop", and restated again in `GUIDELINES.md` "Applying a Change - Verify".
- The six-step new-feature implementation sequence is stated verbatim in `GUIDELINES.md` "Implementation Planning" and `WORKFLOW.md` "Adding a New Feature".

Each duplicate can drift independently. `TESTING.md` is the recorded testing and verification owner and keeps the canonical loop; `WORKFLOW.md` is the recorded workflow owner and keeps the operational sequence.

## Execution

- `TESTING.md` remains the single owner of the verification-loop step order, the milestone list, and the zero-error/zero-warning bar.
- `WORKFLOW.md` "Verification Loop" keeps its operational framing and replaces the duplicated milestone list with a reference to `TESTING.md`; the "Fix Requirements" detail moves to `TESTING.md` or is confirmed already covered there.
- `GUIDELINES.md` "Applying a Change - Verify" shrinks to a reference to `TESTING.md`.
- `WORKFLOW.md` "Adding a New Feature" keeps the six-step sequence as the single owner.
- `GUIDELINES.md` "Implementation Planning" keeps its planning rules and replaces the duplicated sequence with a reference to `WORKFLOW.md`.

## Out of Scope

- No wording changes inside `TESTING.md`'s canonical loop beyond what consolidation requires.
- The audio-critical linting exception stays where it is - it already has one owner.
