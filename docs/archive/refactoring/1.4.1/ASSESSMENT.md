# Refactoring Assessment - 1.4.1

## Summary

Overall result: **complete** - every proposed item landed as written.

| Item                                       | Proposed | Achieved |
| ------------------------------------------ | -------- | -------- |
| Stale paste-mode comments removed          | yes      | yes      |
| Shared YAML quoter reused                  | yes      | yes      |
| MIDI clamp helpers extracted (8 sites)     | yes      | yes      |
| Characterization tests for transpose utils | yes      | yes      |
| Characterization tests for pattern utils   | yes      | yes      |

## Proposal vs Implementation

| Planned step                       | Status    | Notes                                                        |
| ---------------------------------- | --------- | ------------------------------------------------------------ |
| Drop the stale paste-mode comments | completed | ~35 lines of `trackA`/`trackB`/`trackC` archaeology removed  |
| Reuse the shared YAML quoter       | completed | local `quoteNoteValues` deleted; `quoteYamlValues` imported  |
| Extract the MIDI clamp helpers     | completed | `clampMidiChannel`/`clampMidiProgram` added; 8 sites rewired |
| Characterize transpose utils       | completed | 8 tests pinning scope, filters, skips, and clip counters     |
| Characterize pattern utils         | completed | 8 tests pinning shift, clamp, pad, and field-stay semantics  |

## Deviations and Rationale

- The `| 0`-truncation clamp sites in `useMidiHandling.ts` and
  `useMidiMessageProcessing.ts` were deliberately excluded, exactly as
  the proposal scoped - `NaN | 0` and `Math.floor(NaN)` diverge, so
  unifying them is a behaviour change, not a refactoring.
- The comment tidy and the quoter swap landed as two plan steps in one
  file, keeping Tidy separate from the structural clamp extraction.
- No other deviations.

## Verification Results

| Check               | Result                           |
| ------------------- | -------------------------------- |
| `npm run typecheck` | pass, zero errors                |
| `npm run lint`      | pass, zero errors, zero warnings |
| `npm run format`    | applied, tree clean              |
| `npm run build`     | pass (`tsc -b && vite build`)    |
| `npm test`          | pass, 78 files / 620 tests       |

Test count moved from 604 to 620 (+16 characterization tests) - file
count moved from 76 to 78 (two new test files).

## Remaining Gaps

- The run-length compression logic in `trackClipboard.ts` and
  `songIO.ts` stays duplicated: only two sites exist, and the Rule of
  Three requires a third before `compressRunNodes` earns its
  abstraction. Re-evaluate next cycle - the shared `expandRunNodes`
  counterpart already lives in `yaml/runLength.ts`, so the home is
  proven when a third site appears.
- `songIO.ts` writes untrimmed `title`/`author` while guarding on the
  trimmed value - routed to `change/1.4.2/trim-song-metadata-on-save.md`
  as a behaviour fix, not silently absorbed.

## Lessons Learned

- The pre-proposal code survey paid off twice: it found a same-rule
  violation (`branchGaps` prototype patch) outside the audit's line
  list and surfaced the untrimmed-write behaviour question that would
  otherwise have shipped silently inside a "tidy" step.
- Scoping the clamp extraction to guarded sites only kept the work
  purely mechanical - widening it to the `| 0` sites would have turned
  a refactor into a hidden behaviour change.
