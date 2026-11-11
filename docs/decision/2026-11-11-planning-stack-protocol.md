# 2026-11-11 - Planning Stack Protocol

## Context

During the 1.5.5 planning session the user defined a working protocol the `WORKFLOW.md` Planning section did not record: while planning, the agent discusses each request, holds it on a visible stack, and reports the full stack on every addition so it can be amended or applied; applying the stack means creating the change-request documents, grouped so similar items share a record and the number of documents stays minimal.

## Alternatives

- Keep the protocol session-only - rejected: the user had to spell it out mid-session, which is exactly the wound the session-review loop exists to close.
- Record it only as a lesson index entry - rejected: the lesson file indexes rules that live in an owning document's body, so the rule itself belongs in `WORKFLOW.md` regardless.

## Decision

The Planning section of `WORKFLOW.md` records the protocol: the agent reports the full changeset on every addition, overlapping items that share files and intent fold together, and an explicit 'apply' produces the change records grouped to minimize document count.

## Rationale

Planning is a conversational collection mode - without a reported stack the user cannot see what is queued, and ungrouped records multiply documents that later phases must read and reconcile. The protocol makes the changeset inspectable and keeps the record set small.

## Consequences

- Planning sessions report the stack after each item and group records on apply.
- The session findings for 2026-11-11 index the rule.
