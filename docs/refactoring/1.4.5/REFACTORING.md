# Refactoring Proposal - 1.4.5

## Problem

Three bounded items surfaced by the 1.4.5 request iteration.

**Modal frame boilerplate.** All 13 rendered modals repeat the same two-element frame - a `.modal-backdrop` wrapper around a `.modal-dialog` carrying `role="dialog"`, `aria-modal="true"`, and `aria-label`. Representative fragment, `src/modals/AboutModal.tsx:25-26`:

```tsx
<div className="modal-backdrop">
  <div className="modal-dialog" role="dialog" aria-modal="true" aria-label="About">
```

The accessibility baseline stamped this contract out 13 times. Sites vary only by label, an optional extra dialog class (`export-modal`, `download-modal`, `instrument-type-warning-modal`, `text-display`, `midi-modal`), an optional `onKeyDown` (`InstrumentColorModal`, `InstrumentMidiModal`), and one backdrop `style` (`InformationModal`, `zIndex: 1100`). The Rule of Three is met 13 times over - a shared `DialogFrame` is justified. Files touched: the 13 files under `src/modals/` plus a new `src/components/DialogFrame.tsx`.

**Over-exported internals.** Twelve runtime symbols are exported but never imported outside their declaring file - they are used only inside it, so the `export` keyword is dead surface: `normalizePlaylistLineEntry` and `serializePlaylistEntry` (`src/types/playlist.ts`), `POW2_OCTAVE_SCALE` and `POW2_SEMITONE_SCALE` (`src/constants/music.ts` - the domain-checked `pow2Octave`/`pow2Semitone` helpers are the public API), `buildInstrumentPreviewSong` (`src/exports/core.ts`), `applyInstrumentToRegisters` (`src/utils/playback/playbackSimulation.ts`), `escapeHtml` (`src/utils/markdown/markdown.ts`), `isSongData` (`src/utils/validation/validation.ts`), `SONG_INFO_FIELDS` and `PLAYLIST_TRACKS` (`src/utils/cursor/panelCursorFields.ts` - the derived types stay exported), `MODE_ENVELOPE_LENGTH` (`src/utils/panel/toneNoisePanelUtils.ts`), and `RESTORABLE_MODALS` (`src/utils/storage/uiState.ts` - the `RestorableModal` type stays exported). Verified by a tree-wide symbol scan covering `src/`, `test/`, and `e2e/`.

**Stale documented figure.** `docs/REFACTORING.md:41` still cites the pre-decomposition "~1120-line `App.tsx`" while `ARCHITECTURE.md` and `SPECIFICATION.md` record "~940 lines" after the window's decomposition landed.

## Goal

`src/components/DialogFrame.tsx` owns the backdrop-plus-dialog frame and the aria contract; every modal renders through it with byte-identical DOM. Module-internal runtime symbols lose their `export` keyword so each file's public surface matches its consumers. `docs/REFACTORING.md` cites the current `App.tsx` figure.

## Plan

Tidy steps run first, per file and across the plan. No structural step shares a file with a tidy step.

**Refresh the stale figure**

Update `docs/REFACTORING.md` line 41 from "~1120-line" to "~940-line", matching `ARCHITECTURE.md` and `SPECIFICATION.md`. Documentation tidy only.

**Unexport utils internals**

Drop the `export` keyword from `applyInstrumentToRegisters` (`src/utils/playback/playbackSimulation.ts`), `escapeHtml` (`src/utils/markdown/markdown.ts`), `isSongData` (`src/utils/validation/validation.ts`), `SONG_INFO_FIELDS` and `PLAYLIST_TRACKS` (`src/utils/cursor/panelCursorFields.ts`), `MODE_ENVELOPE_LENGTH` (`src/utils/panel/toneNoisePanelUtils.ts`), and `RESTORABLE_MODALS` (`src/utils/storage/uiState.ts`). Type declarations derived from these constants stay exported unchanged.

**Unexport remaining internals**

Drop the `export` keyword from `normalizePlaylistLineEntry` and `serializePlaylistEntry` (`src/types/playlist.ts`), `POW2_OCTAVE_SCALE` and `POW2_SEMITONE_SCALE` (`src/constants/music.ts`), and `buildInstrumentPreviewSong` (`src/exports/core.ts`).

**Add DialogFrame**

Create `src/components/DialogFrame.tsx` - a `React.FC` accepting `label`, optional `className` (extra dialog classes appended after `modal-dialog`), optional `backdropStyle`, optional `onKeyDown`, and `children` - rendering the exact frame above. Add `test/components/DialogFrame.test.tsx` pinning role, accessible name, `aria-modal`, class composition, backdrop style, and keydown forwarding. No call site changes yet.

**Migrate label-only modals**

Rewrite the frame of `AboutModal`, `ConfirmationModal`, `InstrumentDeleteModal`, `PasteTrackModal`, and `TransposeModal` to `<DialogFrame label={...}>`. Five files, one attribute each.

**Migrate variant modals**

Rewrite the frame of `ExportModal`, `FilePickerModal`, `InstrumentTypeWarningModal`, `MarkdownModal`, and `MidiModal` with `className` for the dialog variant, and `InformationModal` with `backdropStyle={{ zIndex: 1100 }}`. Six files.

**Migrate keydown modals**

Rewrite the frame of `InstrumentColorModal` and `InstrumentMidiModal` passing their existing handlers as `onKeyDown`. Two files.

## Step Granularity

The unexport work splits into two steps so a missed external consumer - which typecheck would flag instantly - localizes to one area. The `DialogFrame` component lands before any call site migrates, per parallel change. The three migration steps group by frame variation so a DOM regression attributes to one variant class. Each migration step touches at most six files.

## Risk

The frame must render identical DOM: `style={undefined}` and `onKeyDown={undefined}` emit no attributes, and the className composition preserves the `modal-dialog` prefix. The `test/modals/` suites pin the contract directly - `getByRole('dialog', { name })`, `aria-modal="true"`, `.modal-backdrop` absence when closed, and `fireEvent.keyDown` on `.modal-dialog` for both keydown sites. The unexport steps touch no call sites and are guarded by typecheck; `src/exports/` output is unaffected since `buildInstrumentPreviewSong` stays internal to `core.ts` and export fixtures verify byte-identity. No audio-path, `src/synth/`, or hook code is touched.

## Acceptance Criteria

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, and `npm test` pass with zero errors and zero warnings.
- Rendered DOM is identical per modal - same elements, classes, roles, and aria attributes - proven by the unchanged `test/modals/` suites plus the new `DialogFrame` suite.
- Export fixtures produce byte-identical output; no `src/exports/` behavior change.
- The grep-visible public surface of the touched modules shrinks to the symbols actually consumed.
- Test count stays at or above 795 and coverage holds the `vitest.config.ts` thresholds.
