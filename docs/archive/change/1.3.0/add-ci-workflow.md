# Add a CI workflow for the documented verification loop

**Type:** Feature

**Source:** AUDIT-1.2 REC-002 / FND-INF-001

## Summary

No pipeline runs the five-step loop, so enforcement depends on local discipline.

## Description

Add a CI workflow running `typecheck`, `lint`, format check, `build`, and `test` on every push, matching the canonical order in `TESTING.md`.

## Use Cases

- When a commit is pushed, the workflow must run the full loop.
- When the loop fails, the change must be visibly blocked.

## Hints

Land this before the coverage and e2e windows so their gates are enforced automatically.
