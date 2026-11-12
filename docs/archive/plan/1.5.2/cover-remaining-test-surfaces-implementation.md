# Cover Remaining Test Surfaces Implementation Plan

## Summary

| Field         | Value                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Intent        | Add dedicated suites for `AboutModal`, `DownloadModal`, `barRendering`,   |
|               | `NumberSpinner`, and extend the `useModalManager` suite's branch coverage |
| Key decisions | Test selection follows the recorded gaps plus cheap high-value branches - |
|               | no production code changes                                                |
| Open risks    | none                                                                      |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.2/cover-remaining-test-surfaces.md`.

## Analysis

Measured against `npm run test:coverage`:

- `AboutModal.tsx` and `DownloadModal.tsx` carry no dedicated suites - the recorded gap. `AboutModal` is a presentational dialog; `DownloadModal` is a `FilePickerModal` wrapper, so its suite stubs `fetch` for `LIST.txt` and asserts the download-mode rendering per the conventions already proven in `FilePickerModal.test.tsx`.
- `src/utils/panel/barRendering.ts` sits at ~55% statements - a pure two-function module whose uncovered branches are the `mode`/`default` cases and the centered-position fallbacks.
- `NumberSpinner.tsx` (~58%) is an interactive input whose blur-commit, clamp, and spin-button paths lack a suite.
- `useModalManager.ts` (~44%) has an existing suite with a `createOptions` harness; its uncovered branches are the priority ordering (settings/midi/confirm-first dispatch) and the remaining per-modal cases - extending the existing file is cheaper and more honest than a new one.
- Deeper surfaces (`EnvelopePanel` ~19%, `ToneNoisePanel` ~24%, `usePlaybackHandlers` ~39%) are large interactive bodies - covering them meaningfully is its own record's worth of work; this record takes the bounded set and leaves them recorded as gaps in `TESTING.md`.

No production code changes - no audio-critical surface touched.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md` and the component test-hygiene rules in `TESTING.md`:

- `afterEach(() => cleanup())` in every component suite
- `localStorage` spies target the object, never the prototype
- `fetch` stubs return the full Response surface (`ok`, `headers.get()`, `text()`)
- Console output only inside try/catch around assertions

## Documentation Updates

- `TESTING.md` - the recorded coverage-gap list is refreshed to match what the suites now cover.

## Type and State Updates

None.

## Step by Step Implementation

**Cover the two untested modals**

File to create: `test/modals/AboutModal.test.tsx` - renders the title, version, conditional runtime details, and the CHANGES/MANUAL/OK callback wiring; renders nothing when closed.

File to create: `test/modals/DownloadModal.test.tsx` - stubs `fetch` for `download/LIST.txt` with the full Response surface, asserts the Downloads title, the rendered download links, and `onClose` propagation.

**Cover the pure bar-rendering module**

File to create: `test/utils/panel/barRendering.test.ts` - node-environment suite covering every envelope type branch of `getEnvelopeBarHeight` and `getEnvelopeCenteredBarPosition`, including the `mode` and `default` cases.

**Cover the spinner component**

File to create: `test/components/NumberSpinner.test.tsx` - asserts render of the value, digit-only input acceptance, blur commit with clamping, Enter commit, spin-button increments respecting min/max, and the `aria-valuenow` surface.

**Extend the modal-manager suite**

File to modify: `test/hooks/modal/useModalManager.test.tsx` - new cases proving the dispatch order and uncovered branches: settings wins Escape over an error summary, Enter confirms settings/transpose/export, Escape routes through midi, instrument-delete, renumber, and the download/about setters, and a non-Escape/Enter key dispatches nothing.

## Implementation Order

Execute the steps above in this sequence.

1. Update `TESTING.md` gap list
2. Add `AboutModal` and `DownloadModal` suites
3. Add `barRendering` suite
4. Add `NumberSpinner` suite
5. Extend `useModalManager` suite
6. Run the verification loop

## Testing Strategy

**Unit tests**

The new suites are the deliverable - `barRendering` is pure, the modals and spinner are jsdom component tests, the manager extension is a hook test through the existing harness.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Run `npm run test:coverage` to confirm the gap deltas
