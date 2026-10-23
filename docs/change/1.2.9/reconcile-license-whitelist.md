# Reconcile the license whitelist with the resolved set

**Type:** Chore

**Source:** AUDIT-1.2 REC-010 / FND-CPR-001

## Summary

Resolved license classes exceed the declared policy in `docs/COPYRIGHTS.md`.

## Description

The lockfile resolves BlueOak-1.0.0, CC-BY-4.0, CC0-1.0, WTFPL, and MIT-0 alongside 219 undeclared-license packages - all permissive but outside the whitelist. Either extend the policy to name these classes deliberately or require review for undeclared packages.

## Use Cases

- When the lockfile is re-censused, every resolved class must sit inside policy.

## Out of Scope

License judgments about specific packages stay a review task, not this document.
