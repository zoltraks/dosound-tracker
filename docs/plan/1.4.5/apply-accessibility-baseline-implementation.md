# Apply the adopted accessibility baseline Implementation Plan

## Summary

| Field         | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Intent        | Bring interactive surfaces up to the adopted accessibility standard        |
| Key decisions | Dialog semantics on `.modal-dialog`; live region on `.message-panel`       |
| Open risks    | Screen-reader verification is attribute-level - no AT session has been run |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.5/apply-accessibility-baseline.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Maintain accessibility with proper ARIA attributes
- Keep components focused on single responsibility
- No abbreviations in identifiers (use full words)

## Audio-Critical Requirements

- This change does not affect React render timing.
- This change does not modify `useCallback` or `useMemo` dependencies.
- This change does not change state management patterns in audio paths.
- This change does not modify the YM2149 emulator or SoundDriver.
- Audio playback does not need manual testing - all edits are static markup
  attributes and non-audio event handlers.

ARIA attributes are static markup and safe on the audio path per
`SPECIFICATION.md`.

## Documentation Updates

`PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, and `FORMAT.md` need no
changes: the record applies an already-adopted standard, and no requirement or
behavior contract changes.

## Type and State Updates

**Type definitions**

None.

**State store modifications**

None.

## Step by Step Implementation

**Census baseline**

Re-verified on 2026-11-10: 17 `aria-*` attribute uses plus one `role` across 6
source files (`NumberSpinner`, `InstrumentSection`, `PlaylistLine`,
`EnvelopeSection`, `ColorPicker`, `ToggleValueButton`). All steps below are
additive markup unless stated otherwise.

**Announce the rotating message surface**

The `.message-panel` div is `aria-hidden="true"`, which suppresses the rotating
message from assistive technology. Make it a polite live region that also keeps
its click-to-toggle behavior.

File to modify: `src/components/EnvelopeSection.tsx`.

```tsx
<div className="message-panel" role="status" aria-live="polite" aria-atomic="true" onClick={onNotesClick}>
```

**Give modal dialogs dialog semantics**

Every modal renders a `.modal-dialog` container without a role. Add
`role="dialog"`, `aria-modal="true"`, and `aria-label` carrying the modal
title on each container. `DownloadModal` delegates to `FilePickerModal`, so it
is covered there.

Files to modify: `src/modals/AboutModal.tsx`, `src/modals/ConfirmationModal.tsx`,
`src/modals/ExportModal.tsx`, `src/modals/FilePickerModal.tsx`,
`src/modals/InformationModal.tsx`, `src/modals/InstrumentColorModal.tsx`,
`src/modals/InstrumentDeleteModal.tsx`, `src/modals/InstrumentMidiModal.tsx`,
`src/modals/InstrumentTypeWarningModal.tsx`, `src/modals/MarkdownModal.tsx`,
`src/modals/MidiModal.tsx`, `src/modals/PasteTrackModal.tsx`,
`src/modals/TransposeModal.tsx`.

```tsx
<div className="modal-dialog" role="dialog" aria-modal="true" aria-label={title}>
```

**Name the header controls**

The logo and the mobile command-panel bar are clickable divs, the theme and
download toggles are icon-only buttons, and the octave buttons announce only a
bare digit. Add roles, labels, and keyboard activation on the two div controls.

File to modify: `src/components/HeaderPanel.tsx`.

```tsx
<div className="logo" role="button" tabIndex={0} aria-label="About DOSOUND Tracker" ...>
<button className="theme-toggle" aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'} ...>
<div className="octave-selection" role="group" aria-label="Octave selection" ...>
<button className="octave-button" aria-label={`Octave ${i}`} aria-pressed={currentOctave === i} ...>
<div className="header-panel-song-mobile" role="button" tabIndex={0} aria-label="Toggle command panel" ...>
```

**Name the tracker surface controls**

The track-background toggle is a button with only a `title`; the position
numbers and playlist track headers are clickable divs and spans. Add an
`aria-label` to the toggle and `role="button"` plus `aria-label` to the
clickable position and track-header surfaces.

Files to modify: `src/components/TrackerSection.tsx`,
`src/components/PlaylistHeader.tsx`.

**Name the envelope and mode widgets**

The envelope panels and the mode panel are focusable composite widgets with no
accessible name, and their clickable bars, cells, and value rows carry no role.
Label each panel `role="group"` and mark the clickable cells `role="button"`
with position and value labels. Focus stays panel-level - the existing arrow
key navigation is the keyboard-equivalent operation the record accepts.

Files to modify: `src/components/EnvelopePanel.tsx`,
`src/components/ToneNoisePanel.tsx`.

```tsx
<div className="envelope-panel ..." role="group" aria-label={getTitle()} ...>
<div className="envelope-bar ..." role="button" aria-label={`Position ${index}: ${formatValue(value)}`} ...>
```

**Name the remaining panels and quick-win controls**

Label the remaining focusable or clickable surfaces: track panel, piano
keyboard and keys, EQ mute bars, dump-panel copy surfaces, song-information
inputs, instrument panel, and playlist panel. Cells inside the pattern grid
keep their existing keyboard navigation - no grid redesign.

Files to modify: `src/components/TrackPanel.tsx`,
`src/components/PianoKeyboard.tsx`, `src/components/PianoKey.tsx`,
`src/components/EQPanel.tsx`, `src/components/DumpPanel.tsx`,
`src/components/InformationPanel.tsx`,
`src/components/InstrumentSection.tsx`,
`src/components/PlaylistPanel.tsx`.

## Implementation Order

1. Update documentation - none required, recorded above
2. Implement UI component markup changes
3. Add or update tests
4. Run verification loop

## Testing Strategy

**Unit tests**

None - no new utility functions or state actions.

**Integration tests**

Add a case to `test/modals/ConfirmationModal.test.tsx` asserting
`role="dialog"`, `aria-modal`, and the accessible name. Add the same for
`test/modals/InformationModal.test.tsx`. Create
`test/components/EnvelopeSection.test.tsx` asserting `role="status"` on the
message panel.

```typescript
expect(screen.getByRole('dialog', { name: 'Confirm' })).toBeTruthy();
expect(screen.getByRole('status')).toBeTruthy();
```

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Re-run the aria census and confirm controls carry names and roles
