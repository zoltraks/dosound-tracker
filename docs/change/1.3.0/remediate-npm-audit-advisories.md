# Remediate npm audit advisories

**Type:** Chore

**Source:** Window 1.2.9 review - `npm audit` output

## Summary

`npm audit` at the 1.2.9 window close reported 5 advisories (4 moderate, 1 high - zod memory
exhaustion via development tooling).

## Description

Run `npm audit fix` and evaluate the remaining advisories; where a fix requires a major upgrade
(for example vitest), record the deferred upgrade rather than forcing it inside this window.
