# Continue App Decomposition Implementation Plan

## Summary

| Field         | Value                                                                              |
| ------------- | ---------------------------------------------------------------------------------- |
| Intent        | Move the next bounded `App.tsx` slices into orchestration hooks                    |
| Key decisions | Extract the modal layer (`useModalManager` call + `ModalManager` JSX) as one hook, |
|               | the navigation-suspension flag, and the startup restore/test-tone block            |
| Open risks    | `useAppModals` carries a ~95-field parameter object - large but mirroring the      |
|               | established `useModalManager` convention                                           |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.5/continue-app-decomposition.md`.

## Analysis

Every handler/dialog cluster named in earlier slices (file inputs, copy/paste
track, transpose, renumber/optimize, export, reset/new-song, MIDI, instrument)
already lives in `src/hooks/`. The remaining inline logic in `App.tsx` is:

- The `isNavigationSuspended` aggregate flag (~30 lines), consumed early by
  `useKeyboardNavigation`.
- The `useUiStatePersistence` wiring plus the startup `restoreView`/test-tone
  effect (~37 lines).
- The `useModalManager` options object (~65 lines) and the `<ModalManager>`
  JSX prop map (~135 lines) - together the modal layer (~200 lines).
- Small derived values (`patternsById`, `envelopeMessages`,
  `previewTickIntervalMs`, `handleLineChange`) left in place - too small to
  carry a slice on their own.

## Best Practices

- A hook extracted out of the orchestrator is called before the earliest
  consumer of its returned values (WORKFLOW.md wound rule).
- Extraction parameters are typed to the producing hook's real signatures.
- Hooks name what they do and live in a domain subdirectory.
- Moved code travels verbatim: same dependency arrays, same memoization, same
  call order. `useStartupRestore` needs the
  `/* eslint-disable react-hooks/exhaustive-deps */` header - the moved effect
  relies on the suppression.
- `modalState` is passed as the `UseModalStateResult` object rather than ~35
  individual fields; `App.tsx` keeps destructuring it for existing consumers.
- `useAppModals` returns the `ModalManager` element and calls `useModalManager`
  internally, so the hook call stays at its current position in `App.tsx` and
  effect ordering is identical.

## Documentation Updates

- `ARCHITECTURE.md` - add `useAppModals`, `useStartupRestore`, and
  `useNavigationSuspension` to the orchestration-hook list and refresh the
  `~1120 lines` Known Limitations figure.
- `SPECIFICATION.md` - refresh the `~1120 lines` figure in Known Limitations.

## Type and State Updates

No new types or stores. The new hooks declare parameter interfaces only, using
existing exported types: `UseModalStateResult`, `PendingSongImport`,
`InstrumentTypeInfo`, `Instrument`, `MidiConfiguration`, `MidiDeviceInfo`,
`MidiMonitorEntry`, `ExportType`, `ExportStrategy`, `TrackPasteMode`.

## Step by Step Implementation

**Hold a `modalState` reference**

`const { ... } = useModalState()` becomes
`const modalState = useModalState(); const { ... } = modalState;` so the grouped
object can pass to the new hooks while every existing consumer keeps its
destructured name.

File to modify: `src/App.tsx`.

**Extract the navigation-suspension flag**

Create `src/hooks/keyboard/useNavigationSuspension.ts` - computes whether modal
or summary state suspends keyboard navigation. Params:
`{ modalState, songError, instrumentError, soundExportSummary, dumpExportSummary, isInstrumentTypeWarningOpen, isPasteTrackModalOpen, pendingSongImport }`.
Returns `boolean`. The boolean expression body moves verbatim. Called where the
expression sits today, after `useFileOperations` and before
`useKeyboardNavigation`.

File to create: `src/hooks/keyboard/useNavigationSuspension.ts`.
File to modify: `src/App.tsx`.

**Extract the startup restore hook**

Create `src/hooks/app/useStartupRestore.ts` - calls `useUiStatePersistence` with
the verbatim flags and open-handler objects, then runs the verbatim startup
effect (`restoreView()` + double-`requestAnimationFrame` test tone). Params:
`{ modalState, sharedCurrentLine, handleShowAbout, handleShowChangelog, handleShowManual, playTestTone }`.
Returns `void`. Carries the `react-hooks/exhaustive-deps` file header. Called
where `useUiStatePersistence` sits today - internal order (persistence hook,
then the effect) reproduces the current hook sequence exactly.

File to create: `src/hooks/app/useStartupRestore.ts`.
File to modify: `src/App.tsx`.

**Extract the modal layer hook**

Create `src/hooks/modal/useAppModals.tsx` - destructures the needed
`modalState` fields, calls `useModalManager` with the verbatim options object,
and returns the verbatim `<ModalManager>` element as `ReactElement`. Params:
`modalState`, `aboutVersion`, and every non-`modalState` value the options
object and JSX consume (errors/summaries, confirm/cancel/close handlers,
transpose fields, MIDI dialog values, picker state, export-modal state,
paste-track modal state) - each typed to its producing hook's signature. Called
where `useModalManager` sits today; `modals={modals}` at the `AppLayout` call.

File to create: `src/hooks/modal/useAppModals.tsx`.
File to modify: `src/App.tsx`.

**Drop orphaned imports**

After the slices: `useModalManager`, `useUiStatePersistence`, `ModalManager`
imports leave `App.tsx`; `useEffect` leaves the React import. `useMemo`
(`patternsById`, `envelopeMessages`) and `useCallback` (`handleLineChange`)
stay.

File to modify: `src/App.tsx`.

## Implementation Order

1. Update `ARCHITECTURE.md` and `SPECIFICATION.md` hook list and line counts.
2. `modalState` reference split.
3. `useNavigationSuspension` - lint both files, typecheck.
4. `useStartupRestore` - lint both files, typecheck.
5. `useAppModals` - lint both files, typecheck.
6. Full verification loop.

## Testing Strategy

No new tests - pure moves behind the same interfaces. Existing hook tests
(`test/hooks/modal/useModalManager.test.tsx` covers the moved keyboard logic),
the component suite, and the `test/exports/` zero-diff suites are the
regression net.

## Verification

Run the verification loop in this order. The implementation is complete only
when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npx prettier --check` on touched files (`--write` to fix)
- Run `npm run build`
- Run `npm test`
