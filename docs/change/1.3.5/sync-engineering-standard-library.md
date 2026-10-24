# Sync the Engineering Standard Library

**Type:** Chore

AI-assisted: Devin (SWE-2)

## Summary

Re-sync `docs/standard/` against the canonical library after a feed round changed it: refreshed fed files, adopted `typescript-audio-development.md`, and slimmed every `Project Conventions` section to project-only content so canonical and project layers stay diffable.

## Description

The canonical library gained `Fed Patterns` sections (directories-only grouping, branded identifiers, repeated-action detection, hook-extraction ordering, empty-catch, trusted-markup, tick budget, `.cjs` testability, origin-gated permissions, recorded keyboard order) plus a new real-time audio standard. This change refreshes the four vendored files, adopts the audio standard with project-specific values, trims project sections that canonical now covers, and updates the index and reference tables.
