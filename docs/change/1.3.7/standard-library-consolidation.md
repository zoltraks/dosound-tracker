# Consolidate the Standard Library for Bidirectional Sync

**Type:** Documentation

## Summary

| Field         | Value                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Intent        | Keep the vendored standard library canonical-clean and ready to feed  |
|               | project conventions back upstream                                     |
| Key decisions | `bash-inline-development.md` adopted; every vendored file carries the |
|               | `## Project Conventions` split                                        |
| Open risks    | None                                                                  |

## Description

All ten vendored standards are already at canonical versions - remaining
diffs are format noise per the recorded `diff -w -B` sync rule. The missing
match for this project is `bash-inline-development.md` (`scripts/*.sh`),
now vendored. `html-vanilla-development.md`, `standard-template-development.md`,
and the new file gained the `## Project Conventions` marker that delimits
project-local content from canonical text, which is what makes a reverse
feed to the compass library possible.

## Implementation

- `docs/standard/bash-inline-development.md` vendored at 0.1.9 with an
  empty Project Conventions section.
- `## Project Conventions` added where missing - `docs/standard/README.md`
  records the bidirectional-synchronization rule.

## Outcome

- The vendored library is canonical-clean and bidirectionally compatible.
