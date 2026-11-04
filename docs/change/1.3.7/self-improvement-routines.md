# Record Self-Improvement and Housekeeping Routines

**Type:** Documentation

## Summary

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Intent        | Record the session-review, lesson-gathering, and housekeeping routines |
|               | that keep the documentation set and the codebase self-healing          |
| Key decisions | Workflow owns the routine; GUIDELINES carries the agent pointer        |
| Open risks    | None                                                                   |

## Description

The `lessons-loop` and `session-reporting` extensions are adopted, and
`docs/lesson/` holds session findings, but no document records how lessons
are gathered from a development session's conversation history, how they are
routed back into standards and conventions, or the housekeeping cadence that
keeps the repository clean. This record closes that gap.

## Implementation

- `docs/WORKFLOW.md` - add the session improvement routine: gather durable
  lessons from the session's conversation history, classify each into its
  owning destination (lesson record, standard, convention, housekeeping),
  apply, and verify.
- `docs/GUIDELINES.md` - Agent Operations pointer to the routine.
- `docs/change/1.3.7/self-improvement-routines.md` - this record.

## Outcome

- The session-review loop, the self-healing routing map, and the
  housekeeping checklist are recorded in the owning documents.
