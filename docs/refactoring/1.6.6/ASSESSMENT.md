# Modal Pass-Through Narrowing Refactoring Assessment

## Proposal Summary

Replace the roughly ninety-field flat `UseAppModalsParams` pass-through with
ten named domain slices, introduce one modal group component per domain under
`src/components/modal/`, make `ModalManager` a pure composer, remove
`ModalContainer`, keep `useModalManager` flat, and preserve the four lazy
modal boundaries and observable behaviour.

## Implementation Summary

Ten group files now live in `src/components/modal/`:
`InformationModalGroup`, `ConfirmationModalGroup`, `InstrumentModalGroup`,
`TransposeModalGroup`, `DocumentModalGroup`, `MidiModalGroup`,
`SettingsModalGroup`, `FileModalGroup`, `ExportModalGroup`, and
`PasteTrackModalGroup`. Each exports a `XModalGroupParams` contract for the
producer side and a `XModalGroupProps` contract for the rendered side; the
Props interface extends Params with the modal-state-owned fields the group
injects. `useAppModals` accepts `modalState` plus the ten slices, maps the
slices back onto the flat `useModalManager` options, assembles each Props
object, and renders `ModalManager`. `ModalManager` renders the ten groups in
the former `ModalContainer` sequence. `ModalContainer.tsx` is deleted. The
`App.tsx` call site writes ten named literals instead of one flat list. The
four `React.lazy` declarations moved into their group files unchanged.

## Gap Analysis

Group composition was refined relative to the proposal to preserve the exact
render order of the former `ModalContainer`:

- `InstrumentTypeWarningModal` renders between the information notices and
  the confirmation dialogs, so it moved into `ConfirmationModalGroup`, which
  renders it first. `InstrumentModalGroup` keeps delete, MIDI, and colour.
- `DownloadModal` rendered last inside `ModalContainer`, adjacent to the two
  file pickers that `ModalManager` rendered next. It moved into
  `FileModalGroup` together with the pickers, preserving download, then
  pickers, then export, then paste-track order.
- The proposal's `pickers` slice became `file`, covering download plus both
  pickers.

Other deviations:

- Plan steps two and three (rewire `ModalManager`, regroup params and the
  `App.tsx` call site) landed as one change set because both edits cross the
  same `useAppModals` boundary; the intermediate flat-params state was never
  committed.
- Lazy groups use an early `return null` guard instead of the former inline
  `isOpen && <Suspense>` conditional; the rendered output is identical.
- `PasteTrackModalGroupProps` is a type alias of its Params because no
  modal-state fields are injected into that group.
- The song-configuration warning's `!!pendingSongImport` derivation became
  the `hasPendingSongImport` boolean param, and the fallback message literal
  moved into `ConfirmationModalGroup` as planned.

## Verification Results

- `npm run typecheck` - pass, zero errors.
- `npm run lint` - pass, zero warnings.
- `npm run format` - pass, no rewrites outside the change set.
- `npm run build` - pass. `dist/js/` still emits `SettingsModal.js`,
  `MidiModal.js`, `ExportModal.js`, and `PasteTrackModal.js` as separate
  chunks; the lazy boundaries did not move.
- `npm test` - pass, 191 files and 1771 tests, including the unchanged
  `test/hooks/modal/useModalManager.test.tsx` keyboard-priority suite.
- `npm run test:e2e` - pass, 30 of 30 Playwright specs on chromium and
  webkit, covering the About/changelog modal, settings persistence across
  reload, and the export flows that exercise the lazy export modal.

## Metrics Comparison

| File                      | Before    | After           |
| ------------------------- | --------- | --------------- |
| `useAppModals.tsx`        | 501 lines | 253 lines       |
| `ModalContainer.tsx`      | 502 lines | removed         |
| `ModalManager.tsx`        | 121 lines | 59 lines        |
| `App.tsx` modal call site | 109 lines | 130 lines       |
| Ten group files           | -         | 675 lines total |

The modal layer grows by roughly one hundred lines net. The growth is the
cost of the per-domain Params/Props contract pairs that replaced one
monolithic prop bag; each interface now names only the fields its domain
consumes.

## Output Fidelity

No export, audio, or file-output code was touched. The build emits the same
lazy chunk set, and the e2e export specs (DOSOUND assembly, VGM, MAX, MOD,
MIDI) pass unchanged.

## Behaviour Smoke Check

Observable behaviour is identical to the pre-refactoring baseline. Verified
flows: modal open and close through the document, settings, export, MIDI,
and paste-track groups; Escape and Enter routing through the unchanged
`useModalManager` suite; settings persistence across reload; the About modal
rendering the changelog; and lazy chunk loading on first open of the four
lazy modals.

## Conclusion

Pass. The pass-through boundary is narrowed to ten named domain slices, the
monolithic renderer is gone, and every verification check is green. No
follow-up work is required; the deferred `useAppModals` narrowing candidate
in `docs/FUTURE.md` is resolved by this change.
