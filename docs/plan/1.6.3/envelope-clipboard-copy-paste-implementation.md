# Add Envelope Copy and Paste to the Clipboard Implementation Plan

## Summary

| Field         | Value                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | CTRL+C copies the active envelope section's data; CTRL+V pastes it into the same envelope type                                                       |
| Key decisions | Instrument-YAML clipboard dialect - new `envelopeClipboard` util plus `useEnvelopeClipboard` hook dispatched from the existing CTRL+C/V registration |
| Open risks    | None identified - dispatch is mutually exclusive on `activeSection`                                                                                  |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.6.3/envelope-clipboard-copy-paste.md`.

## Best Practices

From `docs/standard/typescript-react-development.md` and the codebase's own conventions:

- New pure logic lives in a domain util (`src/utils/envelope/`), mirroring `trackClipboard.ts` - no logic inside components.
- Side-effectful clipboard work lives in a hook (`src/hooks/instrument/`), mirroring `useTrackOperations` - `getClipboardApiOrReport` for API access, `logger.error` on failures, the shared clipboard-error state for user reporting.
- `useCallback` for every handler passed to `useKeyboardShortcuts`, with complete dependency lists - the shortcut registration effect re-runs only on real changes.
- `updateInstrument` for the write path so edit history records the paste.

## Audio-Critical Requirements

- React render timing: no render-path work added - the hook runs on keypress only.
- `useCallback`/`useMemo` dependencies: all new callbacks list their full deps; the `useKeyboardShortcuts` registration effect already re-subscribes on handler identity change.
- State management in audio paths: `updateInstrument` is the existing instrument mutation path - nothing new in the audio chain.
- YM2149 emulator or SoundDriver: untouched.
- Playback verification: simulation is unaffected; verification is unit tests on the util, a hook-level test for copy/paste flow, and the standard loop.

## Documentation Updates

- `public/MANUAL.md` - the envelope keybinding table gains CTRL+C and CTRL+V rows, plus a sentence noting the clipboard text uses instrument-file field names.
- `docs/change/1.6.3/envelope-clipboard-copy-paste.md` - already written.
- No pillar updates: no architecture, format, or specification contract changes.

## Type and State Updates

- `INFO_MODAL_TITLES.trackClipboardError` retitled from `'Track Clipboard Error'` to `'Clipboard Error'` in `src/constants/modal.ts` - the modal now reports both clipboard domains. The state field name is unchanged.
- No store or schema changes.

## Step by Step Implementation

**Create the envelope clipboard util**

`src/utils/envelope/envelopeClipboard.ts`:

- `generateEnvelopeClipboardData(type: EnvelopePanelType, data: number[], sustain?: number | null): string` - dumps `{[type]: data}` via `yaml.dump` with `YAML_DUMP_OPTIONS`, adding `sustain` only when a non-negative finite index is passed.
- `parseEnvelopeClipboardData(text: string, type: EnvelopePanelType): { data: number[]; sustain?: number | null }` - `assertImportSize`, `yaml.load`, look up `parsed[type]` (for `shift` fall back to `arpeggio`, the loader's alias). Missing key throws `Clipboard does not contain a <Title> envelope.` using `getEnvelopeTitle`. Each element must be a finite number, truncated and clamped through `clampEnvelopeValue`; the array expands to `ENVELOPE_LENGTH` through `expandEnvelope`. For `volume`, a valid `sustain` index is returned as `sustain`; otherwise `sustain` is `undefined` and the destination's is left alone.

File to create: `src/utils/envelope/envelopeClipboard.ts`.

**Create the clipboard hook**

`src/hooks/instrument/useEnvelopeClipboard.ts`:

```ts
useEnvelopeClipboard({ activeSection, currentInstrument, updateInstrument, setError })
  -> { isEnvelopeSectionActive, handleCopyEnvelope, handlePasteEnvelope }
```

- `isEnvelopeSectionActive` - `activeSection` is one of `volume|shift|pitch|noise|mode`.
- `handleCopyEnvelope` - guarded `getClipboardApiOrReport('write', setError)`; `writeText(generateEnvelopeClipboardData(section, instrument[section], section==='volume' ? instrument.sustain : undefined))`.
- `handlePasteEnvelope` - guarded `readText`; empty/parse failure reports through `setError`; otherwise `updateInstrument({ [section]: data, ...(volume && sustain !== undefined ? { sustain } : {}) })`.
- Both no-op when the active section is not an envelope section.

File to create: `src/hooks/instrument/useEnvelopeClipboard.ts`.

**Dispatch from the existing shortcut registration**

In `src/App.tsx`: instantiate the hook with `currentInstrument`, `updateInstrument`, `activeSection`, `setTrackClipboardError`; wrap dispatch in `useCallback`s:

```ts
handleCopyTrack: () => {
  isEnvelopeSectionActive ? void handleCopyEnvelope() : handleCopyTrackShortcut();
};
handlePasteTrack: () => {
  isEnvelopeSectionActive ? void handlePasteEnvelope() : handlePasteTrackShortcut();
};
```

`handleCutTrack` is unchanged. File to modify: `src/App.tsx`.

**Retitle the shared clipboard-error modal**

`src/constants/modal.ts` - `trackClipboardError: 'Clipboard Error'`. File to modify: `src/constants/modal.ts`.

**Document the bindings**

`public/MANUAL.md` - add CTRL+C / CTRL+V rows to the envelope keybinding table and a sentence on the instrument-file field names. File to modify: `public/MANUAL.md`.

**Add unit and hook tests**

- `test/utils/envelope/envelopeClipboard.test.ts` - round-trip generate/parse per type, clamping, short-array expansion, `arpeggio` alias on shift, missing-key and malformed errors, sustain emission and parsing.
- `test/hooks/instrument/useEnvelopeClipboard.test.tsx` - copy writes YAML to a stubbed `navigator.clipboard`, paste applies `updateInstrument`, type mismatch reports via `setError`, non-envelope section no-ops.

Files to create: `test/utils/envelope/envelopeClipboard.test.ts`, `test/hooks/instrument/useEnvelopeClipboard.test.tsx`.

## Implementation Order

1. `envelopeClipboard.ts` util
2. `useEnvelopeClipboard.ts` hook
3. `src/App.tsx` dispatch + `src/constants/modal.ts` retitle
4. `public/MANUAL.md` documentation
5. Tests
6. Verification loop

## Testing Strategy

- Unit tests cover every pure branch: each type's generate/parse, value clamping, expansion, the `arpeggio` alias, error paths, sustain round-trip.
- The hook test covers clipboard success/failure paths and the `updateInstrument` contract, matching `useTrackOperations.test.tsx` conventions.
- The full `vitest` suite guards regressions in keyboard dispatch and the shared error modal.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- New specs pass: util round-trip and error paths, hook copy/paste/mismatch flows
