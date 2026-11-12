# Restrict changelog edits

## Summary

- **Status**: shipped
- **Type**: Chore
- **Owner**: user
- **Scope**: `docs/GUIDELINES.md`, `docs/VERSIONING.md`, `docs/WORKFLOW.md`

## Request

The user asked that the agent instructions state the CHANGELOG update
rule: `public/CHANGELOG.md` changes only during the version bump or on a
specific request, and entries are grounded in the window's review,
change records, implementation plans, and actual implementation.

## Implementation

- `GUIDELINES.md`'s CHANGELOG bullet now forbids edits during routine
  feature work, including to a pending entry for the current window.
- `VERSIONING.md` mirrors the rule and names the evidence base for entry
  content.
- `WORKFLOW.md`'s artifact table notes the on-request exception.

## Verification

- Documentation-only change; Prettier clean on all three files.
