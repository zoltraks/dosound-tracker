# Specification Audit - Clear the Minimatch Advisory Chain

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

|            |                                                                             |
| ---------- | --------------------------------------------------------------------------- |
| Change     | `docs/change/1.3.9/clear-minimatch-advisory-chain.md`                       |
| Plan       | `docs/plan/1.3.9/clear-minimatch-advisory-chain-implementation.md`          |
| Audit Date | 2026-11-09                                                                  |

## Verdict

The plan is ready for implementation. The record's open risk materialized exactly as anticipated - no compatible upgrade exists for either affected chain - so the record's fallback path (document the residual with reach analysis) is the implementation.

## Completeness

| Requirement                                                      | Plan step                                         |
| ---------------------------------------------------------------- | ------------------------------------------------- |
| Upgrade affected chains on compatible versions                   | electron-builder 26.18.0 to 26.18.1 bump          |
| Remove the advisory set where possible                           | No compatible removal exists - verified per chain |
| Document any residual advisory with its reach analysis           | Decision record step                              |
| No forced downgrades or breaking toolchain changes               | `npm audit fix --force` rejected per the record   |

## Ambiguity

`none` - the record pre-decided both branches.

## Implementability

Verified against the registry during the audit: `electron-builder@26.18.1` exists and is 14 days old; `app-builder-lib@26.18.1` still requires `@electron/universal@2.0.3` and `minimatch ^10.2.5`; `@typescript-eslint/typescript-estree@8.72.2` still requires `minimatch ^10.2.2`; the `next`/`canary` lines are unstable and keep `^10` pins anyway. `minimatch@11.0.1` is the first fixed release and satisfies none of the parent ranges.

## Fidelity

- Reach analysis covers both vulnerable instances (`10.2.6` top-level, `9.0.9` nested under `@electron/universal`) and names every consuming package.
- Age rule honored: the newest `typescript-eslint` is one day old, so the chain stays on `8.72.1`.
- The forced-resolution alternative (`overrides` pushing `minimatch@^11`) was evaluated and rejected as out-of-scope per the record.

## Findings Returned to Planning

`none`
