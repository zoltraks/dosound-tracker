# Close the coverage gap on the highest-risk paths

**Type:** Feature

**Source:** AUDIT-1.2 REC-001 / FND-INF-004

## Summary

The 80 percent coverage thresholds are configured and documented as failing.

## Description

Grow tests on parsing, export, and sequencer paths until `npm run test:coverage` passes all four metrics, with CI (1.3.0) enforcing the gate afterward.

## Use Cases

- When `npm run test:coverage` runs, all four metrics must meet 80 percent.
- When a module stays below threshold, the per-file gap must be documented.

## Hints

Depends on the CI window so the recovered gate stays enforced.
