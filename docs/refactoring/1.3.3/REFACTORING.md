# Refactoring Proposal 1.3.3

## Problem

The window's change record decomposed `src/App.tsx` into bounded orchestration hooks. Analysis of the post-decomposition file found two residual smells.

- `handleToggleChannelMute` is a thin wrapper that only forwards `toggleChannelMute` from `uiStore`. It adds indirection with no logic, violating the Thin Wrapper rule in `standard/ts-react-development.md`.
- `formatNoteKey` and `parseBaseKeyString` are pure functions held in `useCallback` with empty dependency arrays inside the component. They consume render-scope machinery for work that never changes.

## Goal

`App.tsx` keeps only wiring that needs render scope. Pure helpers sit at module level; store actions reach consumers without wrapper callbacks.

## Plan

Each step leaves the codebase buildable and testable.

**Remove the channel-mute wrapper**

Delete `handleToggleChannelMute` and pass `toggleChannelMute` directly to `onToggleChannelMute` in the `SongSection` element.

File to modify: `src/App.tsx`.

**Lift pure helpers to module scope**

Convert `formatNoteKey` and `parseBaseKeyString` from `useCallback` bindings to module-level function declarations above the component. Call sites and dependency arrays are unchanged; a module binding is permanently stable, which is strictly stronger than an empty-deps callback.

File to modify: `src/App.tsx`.

## Risk

Low. Both items are tidy-level removals verified by typecheck and the existing suite. No audio-path callback identity or dependency array changes; the moved functions were pure.

## Acceptance Criteria

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, `npm test` all pass with zero errors and zero warnings.
- Export output unchanged: no file under `src/exports/` was touched.
- Identical behaviour on the manual smoke flows: channel mute toggle still works, track operations that consume `formatNoteKey` and `parseBaseKeyString` unchanged.
