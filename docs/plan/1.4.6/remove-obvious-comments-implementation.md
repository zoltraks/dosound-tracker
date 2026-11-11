# Remove Obvious Comments Implementation Plan

## Summary

| Field         | Value                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| Intent        | Delete the audit-catalogued narration comments across the tree, keeping true documentation |
| Key decisions | Deletion only, no rewording; the change record's per-file catalogue is the work list       |
| Open risks    | `(b)` borderline entries decided during the pass; line numbers drifted since audit         |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.6/remove-obvious-comments.md`.

## Best Practices

Follow TypeScript and React engineering standards from `standard/typescript-react-development.md`:

- Delete, never reword - a kept comment stays byte-identical.
- Comment text is the locator, not the recorded line number - positions drifted after the audit and after this window's other records.
- Re-check each site against the record's removal and keep criteria before deleting.

## Documentation Updates

No documentation changes are required. The record removes source comments only -
no behaviour, interface, or documented convention changes.

## Step by Step Implementation

**Sweep src root and workers**

Remove the catalogued comments from `src/App.tsx` (2) and `src/workers/sequencer.ts` (6).

**Sweep src/components**

Remove the catalogued comments from `ColorPicker.tsx`, `CommandPanel.tsx`, `DumpPanel.tsx`, `EnvelopePanel.tsx`, `FileInputs.tsx`, `HeaderPanel.tsx`, `InstrumentSection.tsx`, `ModalManager.tsx`, `PianoKeyboard.tsx`, `PlaylistPanel.tsx`, `ToneNoisePanel.tsx`, `TrackPanel.tsx`. The `ModalManager` and `useAppModals` group-label comments are a style call - drop them consistently in both files.

**Sweep src/hooks**

Remove the catalogued comments across `app/`, `audio/`, `file/`, `instrument/`, `keyboard/`, `midi/`, `modal/`, `playback/`, `sequencer/`, `song/`, `storage/`, `ui/` per the record's per-file entries.

**Sweep src/exports, src/synth, src/utils**

Remove the catalogued comments from `exports/asm.ts`, `exports/core.ts`, `exports/max.ts`, `exports/vgm.ts`, `synth/YM2149.ts`, and the listed `utils/` files.

**Sweep tests and scripts**

Remove the catalogued comments from the listed `test/` files and `scripts/clean.sh`.

**Resolve borderline entries**

Entries marked `(b)` carry a token of context - delete when the narration still only restates the code, keep when the context token survives the criteria. `useTrackPattern.ts` L77, `songParser.ts` L267, `useSequencerIntegration.ts` L195-196, `asm.ts` L64, `YM2149.ts` L217 are stale comments - remove unless the code has since made them accurate.

## Testing Strategy

**Unit tests**

No new tests - comment deletion changes no behaviour. The existing suite is the regression net.

**Verification**

Run the verification loop in this order.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
