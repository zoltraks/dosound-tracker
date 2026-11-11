# Specification Audit - Cover Remaining Test Surfaces

## Document Information

|            |                                                                   |
| ---------- | ----------------------------------------------------------------- |
| Change     | `docs/change/1.5.2/cover-remaining-test-surfaces.md`              |
| Plan       | `docs/plan/1.5.2/cover-remaining-test-surfaces-implementation.md` |
| Audit Date | 2026-11-11                                                        |

## Completeness

- `AboutModal` and `DownloadModal` exercised like every other modal - covered
  by the two new modal suites.
- Thin component branch covered - `NumberSpinner` suite.
- Thin hook branch covered asserting observable effects - `useModalManager`
  extension asserts which handler fires, not only that a call happened.
- Pure-module gap - `barRendering` suite covers all branches.
- `TESTING.md` hygiene rules applied to every new suite - recorded as a
  Best Practices line and enforced at lint/test.

## Ambiguity

- "A number of hooks with thin branch coverage" - scoped to the
  `useModalManager` extension; deeper surfaces stay recorded gaps, matching
  the record's bounded-chore character.

## Implementability

- `AboutModal` props verified in `src/modals/AboutModal.tsx` - version,
  runtimeLabel, runtimeDetails, three callbacks.
- `DownloadModal` verified - a `FilePickerModal` wrapper; `FilePickerModal`
  fetches `directory/LIST.txt` on open when `files` is absent, so the fetch
  stub path is confirmed.
- `useModalManager.test.tsx` already carries the `createOptions` harness and
  `dispatchKey` helper - the extension reuses them verbatim.
- `barRendering.ts` exports the two functions with the branches named.
- `NumberSpinner` props verified in `src/components/NumberSpinner.tsx`.

## Fidelity

- The `mode` case in `getEnvelopeBarHeight` returns `value * 100` and the
  centered-position function returns `50` for non-shift/pitch types - the
  asserted contract matches the source, verified.
- No production code changes - the record's refactoring-for-testability
  allowance is not needed.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
