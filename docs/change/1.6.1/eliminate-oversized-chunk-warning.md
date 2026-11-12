# Eliminate the oversized-chunk build warning

**Type:** Fix

**Source:** Audit 2026-11-12 REC-08 (FND-08)

## Summary

| Field         | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Intent        | Make the production build warning-free without hiding the signal |
| Key decisions | none                                                             |
| Open risks    | A cold-path split must not disturb module load order on the      |
|               | audio startup path                                               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`npm run build` exits 0 but Vite warns that the entry chunk exceeds the
configured 600 kB `chunkSizeWarningLimit`. The project's clean-build
definition requires zero warnings, so an exit code alone cannot call the
build release-ready. Raising the limit to silence the warning is the
failure mode this record exists to prevent.

Attribute the entry chunk's weight to its concrete modules first. If a
real cold-path boundary exists - a modal, editor surface, or export
family the startup path does not need - split it and measure initial JS
bytes plus cold-load time before and after. The size budget stays
explicit either way; a deliberate budget change is documented as a
decision, never silently folded in.

## Use Cases

- When `npm run build` runs, it exits 0 with zero warnings.
- When the chunk attribution is reviewed, the byte sources are named
  rather than guessed.

## Hints

- `manualChunks` in `vite.config.ts` is the likely mechanism; entry
  filenames are deterministic by config, which keeps the split visible.
- Startup-order-sensitive modules - worklet registration, engine
  selection, first-render hooks - stay on the entry path unless the
  load-order impact is measured safe.
- Sites: `vite.config.ts`, the module attribution from a build
  visualizer or bundle report.

## Out of Scope

- A silent `chunkSizeWarningLimit` increase.
- Lazy-loading audio-critical modules without measured evidence it is
  safe.
