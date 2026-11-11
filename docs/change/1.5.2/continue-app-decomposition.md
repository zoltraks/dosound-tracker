# Continue App Decomposition

**Type:** Refactor

## Summary

| Field         | Value                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Intent        | Continue splitting `App.tsx` so the composition root shrinks and each     |
|               | concern lives in a dedicated hook or component                            |
| Key decisions | Behaviour-preserving extraction only - follow the staged pattern the      |
|               | earlier decomposition established                                         |
| Open risks    | Audio-critical patterns (prop mirroring, sparse dependencies, direct      |
|               | setState) must survive untouched or the change causes audible regressions |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`App.tsx` remains the largest file in the tree and the main navigation
cost. The staged decomposition already moved the dialog, persistence,
playback-handler, and modal-layer concerns into orchestration hooks under
`src/hooks/`, but the file still concentrates all hook wiring and the JSX
prop map.

This record continues the same direction: extract the next bounded
concerns into named hooks or smaller orchestrator components, keeping
`App.tsx` as the visible wiring root rather than turning it into an
opaque shell. The work is behaviour-preserving - no observable change to
rendering, key handling, persistence, or playback.

Extraction candidates are identified in the implementation plan from the
current wiring clusters, not from this record - the file changes faster
than a recorded line map stays accurate.

## Use Cases

- When a developer opens `App.tsx`, the remaining wiring reads as a
  composition table rather than embedded handler logic.
- When an extracted hook is read in isolation, its concern is clear from
  its name and its typed parameter object.

## Hints

- Follow the conventions recorded in `WORKFLOW.md`: place an extracted
  hook before its earliest consumer, cut extractions on the column-0
  terminator, check the origin file's imports after each slice, and lint
  the destination file right after each extraction.
- Keep the audio-critical patterns documented in `SPECIFICATION.md`
  intact inside moved code - sparse dependency arrays and prop mirroring
  travel with the fragment they belong to.
- Characterisation tests around any moved behaviour precede structural
  changes where coverage is thin.

## Out of Scope

- Behaviour changes discovered during extraction - they split into their
  own change records per the refactoring rules.
- Decomposing other large hooks (`useSequencerIntegration`,
  `useSongManagement`) beyond what the wiring extraction naturally
  touches.
