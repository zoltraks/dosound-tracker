# Refresh TESTING.md enumerations and close coverage map gaps

**Type:** Chore

**Source:** AUDIT-1.7 REC-008 — FND-DOC-001, FND-TST-003, FND-STD-002

## Summary

| Field         | Value                                                                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | `TESTING.md` cites moved test paths and omits directories; `ayumiWorklet` has no direct test; changelog entries drifted from the past-tense rule in VERSIONING.md |
| Key decisions | Open on tense: amend VERSIONING.md to record the present-tense convention actually used, or bring entries back to past tense                                      |
| Open risks    | Coverage additions interact with the 80% gate - coordinate with `restore-coverage-gate.md` if both are selected                                                   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Three documentation and coverage drifts share one remediation pass:

- **`docs/TESTING.md` enumerations are stale** - it cites
  `test/modals/MidiModal.test.tsx` where the actual path is
  `test/modals/midi/MidiModal.test.tsx`, the node-environment list is
  incomplete, and the `test/guard/` and `test/scripts/` directories are
  missing from the directory lists. The refresh must preserve the notes
  added during the 1.6.7 closeout (suite-contention flake, e2e
  concurrency flake).
- **Coverage map gaps** - `src/workers/ayumiWorklet.ts` has no direct
  test, and constants, scripts, and electron areas carry thin dedicated
  coverage. Integration tests reach the worklet indirectly, but a
  dedicated suite pins its contract.
- **Changelog tense drift** - `VERSIONING.md` prescribes past tense for
  entries while recent entries are consistently written in present
  tense. The drift is uniform enough to read as a convention change that
  was never recorded; the fix either amends the rule to match practice
  or rewrites the entries, and the choice should be recorded.

## Use Cases

- When a contributor follows `TESTING.md`, every cited path resolves and
  every test directory is listed.
- When `ayumiWorklet.ts` changes behavior, a dedicated test fails before
  integration coverage notices.
- When the next changelog entry is written, its tense matches the rule
  VERSIONING.md actually states.

## Hints

- The Ayumi worklet is an AudioWorklet - a direct test likely needs the
  same worklet-mocking pattern the sequencer worklet tests already use.
- Check `test/` for existing electron and script-area suites before
  writing new ones - "thin" does not always mean "absent".

## Out of Scope

- The coverage thresholds and the flaky-suite timeouts - owned by
  `restore-coverage-gate.md`.
- Rewriting older changelog entries beyond what the tense decision
  requires.
