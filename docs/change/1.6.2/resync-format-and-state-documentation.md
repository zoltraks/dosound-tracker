# Resync format and state documentation

**Type:** Fix

**Source:** Audit 2026-11-12 REC-09 (FND-09)

## Summary

| Field         | Value                                                         |
| ------------- | ------------------------------------------------------------- |
| Intent        | Make the declared settings and state contracts match the code |
| Key decisions | none                                                          |
| Open risks    | none                                                          |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Two authoritative documents describe stale contracts. The settings-file
example in `FORMAT.md` permits only `dark`/`light` themes and omits
`general.textScale`, while the YAML saver emits `textScale` and a golden
fixture carries `theme: contrast` with `textScale: "150"`. Separately, a
`SPECIFICATION.md` limitation says all application state lives in a
single Zustand store, contradicted by `ARCHITECTURE.md`'s three-domain
state description.

Both documents are corrected against the real implementation: the
settings contract shows `contrast` and `general.textScale`, and the
limitation describes the actual state domains. The revised examples are
checked against `test/fixtures/emission/settings-nondefault.yaml` and
`src/utils/settings/settingsYaml.ts` so the documented contract is the
emitted one.

## Use Cases

- When a settings file with `theme: contrast` and `textScale` loads, the
  documented contract accepts what the saver emits.
- When a reader compares `SPECIFICATION.md` with `ARCHITECTURE.md`, the
  state-domain descriptions agree.

## Hints

- This is a documentation-only change - it describes existing behavior,
  it does not alter parsing or persistence.
- Run the document format check afterwards.

## Out of Scope

- Changing what the saver emits or the loader accepts.
- Schema version bumps.
