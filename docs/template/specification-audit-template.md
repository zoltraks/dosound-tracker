# Specification Audit - [Change Name]

## Document Information

|            |                                         |
| ---------- | --------------------------------------- |
| Change     | [change record the audited plan serves] |
| Plan       | [path to the implementation plan]       |
| Audit Date | [YYYY-MM-DD]                            |

## Completeness

Map every requirement stated in the change record to a plan step.

List requirements with no covering step and steps with no stated requirement.

## Ambiguity

List wording in the plan that admits more than one implementation.

For each entry, name the interpretations and the evidence for each.

## Implementability

Check each plan step against the real codebase: referenced files and
interfaces exist, dependencies are available, and the step's preconditions
hold.

List steps that fail the check with the contradicting evidence.

## Fidelity

Verify the plan against the design authority, not only against itself:

- Enumeration fidelity - every requirement, catalog entry, endpoint, frame,
  field, error vocabulary, and state machine named by the design authority is
  covered or explicitly deferred.
- Vocabulary freeze - every interchange vocabulary the plan touches is stated
  once and identically for every party that emits or parses it.
- Cross-party parity - both ends of every protocol and every shared document
  are specified, never one side left to local interpretation.
- Constants completeness - numeric bounds, limits, and defaults the
  implementation will encode are enumerated, not left for rediscovery.
- Boundary decisions - every behavior at the interface between this change
  and a later change is decided and recorded, not implied.

## Findings Returned to Planning

[One row per finding that must close before implementation, or `none`.]

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
