# Refactoring Assessment - 1.5.5

## Summary

| Field  | Value                                                                |
| ------ | -------------------------------------------------------------------- |
| Result | complete                                                             |
| Scope  | `docs/refactoring/1.5.5/REFACTORING.md` - both proposed items landed |

| Metric                                | Proposed | Achieved |
| ------------------------------------- | -------- | -------- |
| Shared modifier-chord helper          | 1        | 1        |
| Guard call sites migrated             | 5        | 5        |
| EnvelopePanel hex branches merged     | 3 -> 1   | 3 -> 1   |
| Write-and-advance tail copies removed | 4 -> 1   | 4 -> 1   |

## Proposal vs Implementation

| Step                                         | Status    | Notes                                                                                            |
| -------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `isModifierChord` helper + truth-table test  | completed | Exported from `keyboardShortcutUtils.ts`; two test cases pin the table                           |
| Five verbatim guards replaced                | completed | `HeaderPanel`, `PianoKeyboard`, `ToneNoisePanel`, `EnvelopePanel`, `TrackPanel`                  |
| `commitParsedValue` tail + merged hex branch | completed | Mode branch and Ctrl+digit path also delegate; redundant `NOISE_MAX` argument and import dropped |

## Deviations and Rationale

- `InstrumentSection.tsx` keeps its literal `ctrl || meta || alt || shift` expression - it is a four-modifier bare check, not the three-modifier chord, so the shared helper does not apply. A two-site `isBareKey` shape (PlaylistPanel, InstrumentSection) stayed below the Rule-of-Three threshold and was not extracted.
- The Ctrl+digit block now calls `commitParsedValue`, which owns `preventDefault` - `stopPropagation` remains explicit before it so the chord consumption order is unchanged.

## Verification Results

| Check               | Result                 |
| ------------------- | ---------------------- |
| `npm run typecheck` | clean                  |
| `npm run lint`      | clean                  |
| `npm run format`    | clean                  |
| `npm run build`     | clean                  |
| `npm test`          | 1235 passed (was 1233) |

Test count grew by two - the `isModifierChord` truth table. All window-era component modifier tests pass against the migrated guards, confirming identical behaviour.

## Remaining Gaps

none - both proposal items landed in full.

## Lessons Learned

- Introducing shared expressions inside a feature window pays off: the guard sites were all touched this window anyway, so the extraction rode existing test coverage instead of needing a characterisation pass.
- Passing a defaulted parameter explicitly (`NOISE_MAX`) hid a real duplication - the merge became visible once the redundant argument was questioned.
