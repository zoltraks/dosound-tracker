# Refactoring Proposal - 1.5.5

## Problem

The `alt-modifier-bindings` window work spread two duplications across the key-handling layer.

**Shared modifier-chord expression at five call sites**

`event.ctrlKey || event.metaKey || event.altKey` appears verbatim in `src/components/HeaderPanel.tsx` (octave handlers), `src/components/PianoKeyboard.tsx`, `src/components/ToneNoisePanel.tsx`, `src/components/EnvelopePanel.tsx`, and `src/components/TrackPanel.tsx`. Five identical triples in five files crosses the Rule-of-Three threshold, and the expression encodes a project-level rule - which modifiers take a key out of section editing - that should live in one place.

Files: the five components listed above plus `src/utils/keyboard/` for the shared helper.

**EnvelopenPanel hex entry written four times**

`src/components/EnvelopePanel.tsx` carries three near-identical hex-entry branches - the volume, shift, and noise blocks differ only in their type check, and the noise call passes `NOISE_MAX` explicitly even though `parseEnvelopeHexValue` already defaults to it. The new Ctrl+digit path added a fourth copy of the write-then-advance sequence: parse, write `newData[currentPosition]`, `setEnvelopeData`, `onChange`, `lastPositionRef.current = currentPosition`, `setCurrentPosition(getNextEnvelopePosition(...))`. The mode branch repeats the same tail for `T/N/B` keys.

File: `src/components/EnvelopePanel.tsx`.

## Goal

- One exported helper `isModifierChord(event)` in `src/utils/keyboard/keyboardShortcutUtils.ts` returning `event.ctrlKey || event.metaKey || event.altKey`. All five call sites import it; no guard semantics change.
- One merged hex-entry branch in `EnvelopePanel.handleKeyDown` covering `volume | shift | noise`, fed by a shared local `commitParsedValue` that owns the write-and-advance tail. The Ctrl+digit path and the mode branch delegate to the same tail, so the sequence exists once.
- Observable behaviour is identical - the same keys edit, the same chords skip.

## Plan

Execute the steps in order; each step leaves the tree buildable and testable.

1. Add `isModifierChord` to `src/utils/keyboard/keyboardShortcutUtils.ts` with a unit test pinning the truth table (ctrl, meta, alt, bare, and all-modifier combinations).
2. Replace the five verbatim `event.ctrlKey || event.metaKey || event.altKey` guards with `isModifierChord(event)` - one import per file, no other edits. Verify with the component modifier tests written this window.
3. In `EnvelopePanel.tsx`, extract the shared write-and-advance tail into a local `commitParsedValue(parsed)` callback inside `handleKeyDown`; migrate the mode branch and the Ctrl+digit block to it first, then merge the three hex branches into a single `(type === 'volume' || type === 'shift' || type === 'noise')` branch that also uses it, dropping the redundant `NOISE_MAX` argument.
4. Run the full verification loop.

Step granularity: step 1 is the tidy addition, step 2 is the mechanical replacement (five files, one expression each), step 3 is the only structural step and is confined to one file.

## Risk

- The new component tests from this window pin the guarded behaviour - EnvelopePanel modifier discipline, ToneNoisePanel chord guard, PianoKeyboard chord guard, PlaylistPanel chord guard, HeaderPanel propagation - so a guard regression shows immediately.
- The hex merge must keep each type's `event.shiftKey` argument to `parseEnvelopeHexValue` - the shift panel's negative-entry path and the noise clamp ride on it. Existing tests `enters positive and negative hex values` and the noise coverage catch a signature slip.
- `commitParsedValue` must keep the `parsed != null` check and the `onChange` guard - the mode branch and hex branches both tolerate a null parse and a missing handler.
- Thin-coverage area: none - the touched files all gained tests this window.

## Acceptance Criteria

- The five guard sites call `isModifierChord` and no `event.ctrlKey || event.metaKey || event.altKey` literal remains in `src/components/`.
- Exactly one hex-entry branch exists in `EnvelopePanel.tsx`; the write-and-advance tail appears once.
- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, `npm test` pass with zero errors and zero warnings.
- Manual smoke: bare keys still edit envelopes, Ctrl+digit still enters values, Ctrl+Space still toggles the piano from playlist and octave - identical behaviour to before the refactor.
