# Untrack test/.DS_Store

**Type:** Chore

**Source:** AUDIT-1.2 REC-019 / FND-CQY-007

## Summary

A macOS `.DS_Store` file is committed under `test/` despite the ignore rule.

## Description

Run `git rm --cached test/.DS_Store` so the tree carries no OS artifacts.
