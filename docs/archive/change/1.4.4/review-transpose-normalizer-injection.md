# Review the transpose normalizer injection

**Type:** Chore

**Source:** 1.4.3 window refactoring survey

## Summary

| Field         | Value                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------- |
| Intent        | Decide whether `TransposeOptions.normalizeInstrumentId` stays an injected dependency        |
| Key decisions | `transposeUtils.test.ts` stubs a deliberately different contract - looser than the real one |
| Open risks    | Removing the injection changes what the existing tests exercise                             |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The 1.4.3 refactoring de-injected `normalizeInstrumentId` from `instrumentOperations.ts` but left `TransposeOptions.normalizeInstrumentId` alone: `transposeUtils.ts` does not import the real function and its test deliberately stubs a different contract `(v) => String(v ?? '00').toUpperCase()` with no `$` strip and no padding. Either keep the injection as a documented test seam or align it with the canonical contract - the decision needs its own analysis.

## Hints

- If the stub contract is deliberate, document why; if incidental, route `transposeUtils` through the canonical function and update the stub.

## Out of Scope

- The `useInstrumentActions` injected-args-object convention.
