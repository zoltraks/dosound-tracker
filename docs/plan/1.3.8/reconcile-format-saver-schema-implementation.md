# Reconcile FORMAT.md With the Emitted Saver Schema Implementation Plan

## Summary

| Field         | Value                                                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | make every documented saver key match emitted output                                                                                                                       |
| Key decisions | docs corrected to match code; loader-only aliases documented as accepted input, not emitted output; `ARCHITECTURE.md` claims corrected where stale and kept where accurate |
| Open risks    | `none`                                                                                                                                                                     |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.8/reconcile-format-saver-schema.md`.

## Documentation Updates

This change is documentation-only; every edit below is the documentation update itself.

**Rewrite the saver key set in `FORMAT.md`**

The emitted schema uses `line`, `step`, `wait`, `shift`, `note: 'OFF'`, and clipboard root `step`. Update the root structure, playlist, pattern, and instrument sections plus the COPY TRACK block. Loader-accepted aliases (`playlist`, `steps`/`lines`, `space`, `off`, `arpeggio`, `instruments`, `patterns`) are documented as input-only compatibility, never as emitted output. The `name` emission rule on pattern nodes (persisted in this window) is already recorded.

File to modify: `docs/FORMAT.md`.

**Correct the stale `ARCHITECTURE.md` claims**

- Components-own-no-business-logic: `PlaylistPanel`, `ToneNoisePanel`, and `EnvelopePanel` read and write `localStorage` directly for cursor and track persistence. Corrected to state the exception.
- Song data in `App.tsx` useState: `useState<Song>` lives in `useDataManagement.ts`. Corrected to name the hook.
- Store persists channel mutes: verified accurate via `StorageKeys.EQ_MUTES` - kept.

File to modify: `docs/ARCHITECTURE.md`.

## Out of Scope

- Code changes of any kind.
- `MAX.md` - externally managed.
- Loader-side behavior changes.

## Verification

Documentation-only change - the verification loop is bypassed per `GUIDELINES.md`. Run `npx prettier --check` on the touched files and diff the documented key set against `songIO.ts` and `trackClipboard.ts` emitted keys.
