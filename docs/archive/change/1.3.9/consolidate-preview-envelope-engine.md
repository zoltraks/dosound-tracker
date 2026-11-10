# Consolidate the preview-envelope engine

**Type:** Refactor

**Source:** AUDIT-1.4 REC-006 (FND-ARC-001)

## Summary

| Field         | Value                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------- |
| Intent        | Replace five divergent copies of the preview-envelope engine with one shared implementation |
| Key decisions | a single ref-driven implementation under `src/hooks/` consumed by all five call sites       |
| Open risks    | audio timing must be preserved; the copies may not be semantically identical today          |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

The preview-envelope engine - timing state, sustain and release logic, interval tick, and register writes - is implemented five times across `TrackPanel.tsx`, `PianoKeyboard.tsx`, `HeaderPanel.tsx`, `useMidiActions.ts`, and `useInstrumentActions.ts`. Any fix landed in one copy silently diverges from the others. Several components also perform direct `localStorage` I/O, contradicting the documented presentational boundary.

The change extracts one ref-driven preview-envelope implementation shared by all five call sites, preserving the audio-critical constraints: ref-driven timing, no new re-renders on the audio path, and no behavioral change to envelope preview semantics.

## Hints

- This is the largest maintainability item in the audit - five surfaces move, so implementation proceeds call site by call site with verification after each.
- Any semantic difference discovered between copies is a behavior change and splits into its own record rather than folding silently into the consolidation.
- Manual playback timing verification follows each migrated surface.

## Out of Scope

- Changes to envelope semantics, preview sound, or timing behavior.
- `YM2149` emulation logic.
