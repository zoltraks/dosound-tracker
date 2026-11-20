# Restore the coverage gate to green

**Type:** Fix

**Source:** AUDIT-1.7 REC-001 — FND-TST-001

## Summary

| Field         | Value                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | `npm run test:coverage` currently exits 1, so the 80% thresholds never evaluate and regression signal degrades into flake noise |
| Key decisions | Isolate or raise timeouts for the two timing-sensitive suites; add ~0.4pp of branch coverage so 80% holds under instrumentation |
| Open risks    | Raising timeouts can mask real hangs; branch additions must cover genuine branches, not padding                                 |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The declared coverage gate is red. `npm run test:coverage` fails on two
timing-sensitive suites - `test/components/shell/App.test.tsx` hits the
documented Settings-dialog lazy-chunk timeout under full-suite worker
contention, and `test/scripts/retentionSweepCoverage.test.ts` times out
under instrumentation. A stable-subset run that excludes the two flaky
files reports branches at 79.63%, below the 80% threshold in
`vitest.config.ts`, so even a clean run cannot pass today.

The gate's purpose is regression signal: thresholds that never evaluate
let a real coverage drop hide inside normalized red runs. The fix
restores a green gate without weakening the threshold policy - isolate
the flaky suites from the coverage run or give them headroom, and close
the ~0.4pp branch gap with tests that exercise real uncovered branches.

## Use Cases

- When `npm run test:coverage` runs on a quiet machine, it exits 0 and
  prints the coverage table with branches at or above 80%.
- When a future change drops branch coverage below 80%, the gate fails
  for the coverage reason, not for suite timeouts.

## Hints

- `docs/TESTING.md` already documents the Settings-dialog full-suite
  flake and the subprocess coverage caveat - the fix should reference,
  not duplicate, that guidance.
- The audit's stable-subset evidence (EVD-005, EVD-006) names the two
  failing suites and the 79.63% branch figure.
- `vitest.config.ts` carries two coverage excludes already; check whether
  the flaky suites belong there or need per-suite timeout headroom.

## Out of Scope

- Changing the 80% thresholds themselves - that is a policy decision for
  the project owner, not this fix.
- The WebKit e2e playback failures - tracked by
  `webkit-e2e-playback-root-cause.md`.
