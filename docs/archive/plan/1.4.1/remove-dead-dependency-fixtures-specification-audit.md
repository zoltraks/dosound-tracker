# Specification Audit - Remove Dead Dependency and Fixtures

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

| Field      | Value                                                          |
| ---------- | -------------------------------------------------------------- |
| Change     | `change/1.4.1/remove-dead-dependency-fixtures.md`              |
| Plan       | `plan/1.4.1/remove-dead-dependency-fixtures-implementation.md` |
| Audit Date | 2026-11-09                                                     |

## Verdict

Every requirement in the record maps to a plan step, no ambiguous wording blocks implementation, and every named file and interface checks out against the tree.

## Completeness

| Requirement                                      | Plan step                        |
| ------------------------------------------------ | -------------------------------- |
| Uninstall the unused `@testing-library/jest-dom` | Uninstall the unused declaration |
| Prune the eight unreferenced fixtures            | Prune the unreferenced fixtures  |
| Keep referenced fixtures and committed test data | Prune step names the two keepers |
| `npm test` stays green after removal             | Run the verification loop        |

No uncovered requirement in either direction.

## Ambiguity

- "Eight of ten files" resolved by reference scan: the two keepers are `song-vgm-noise.yaml` and `song-vgm-tone.yaml` - the other eight have zero inbound references from `src/`, `test/`, or `e2e/`.
- The cross-record hint ("land this first or reconcile") is honoured by window ordering: this record runs before `align-tests-documented-rules`, which introduces its fixture afterwards.

## Implementability

- `package.json:51` declares `"@testing-library/jest-dom": "^7.0.1"` - zero import sites in `src/`, `test/`, or `e2e/` - no setup file registers it.
- `test/fixtures/` holds exactly the ten files the record describes - reference scans confirm the eight named for deletion are unreferenced.
- `npm` is the declared package manager - `npm uninstall -D` rewrites both `package.json` and `package-lock.json`.

## Fidelity

- Enumeration fidelity: the prune list names all eight files explicitly - no wildcard deletion.
- Vocabulary freeze: the plan uses the record's terms ("unused declaration", "unreferenced fixtures").
- Cross-party parity: keepers named in the plan match the live import sites in `exportVgm.test.ts`, `exportMax.test.ts`, `exportWav.test.ts`, and `songParser.test.ts`.
- Constants completeness: no constants involved.
- Boundary decisions: `docs/prompt/` prose mentions of fixture names are historical and stay untouched per the restricted-directory rules.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    | -       | -                |
