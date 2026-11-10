# Specification Audit - Continue App Decomposition

## Document Information

|            |                                                                |
| ---------- | -------------------------------------------------------------- |
| Change     | `docs/change/1.4.5/continue-app-decomposition.md`              |
| Plan       | `docs/plan/1.4.5/continue-app-decomposition-implementation.md` |
| Audit Date | 2026-02-14                                                     |

## Completeness

Change-record requirements mapped to plan steps:

| Requirement                                                  | Covering step                                                                                                                                                                                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extract coherent concerns into dedicated orchestration hooks | `useNavigationSuspension`, `useStartupRestore`, `useAppModals` steps                                                                                                                                                             |
| Reduce hooks called directly in `App.tsx` / shrink the file  | All three extraction steps; `useModalManager` and `useUiStatePersistence` calls leave `App.tsx`                                                                                                                                  |
| Keep remaining wiring visible in one place                   | New hooks take typed parameter objects; `App.tsx` keeps every value it wires                                                                                                                                                     |
| Hooks name what they do, not how                             | `useAppModals` (modal layer), `useStartupRestore` (startup restoration), `useNavigationSuspension` (navigation gating)                                                                                                           |
| Each step buildable and green                                | Per-slice lint/typecheck order in Implementation Order                                                                                                                                                                           |
| Behavior-preserving: export byte-identical, YM2149 untouched | Verbatim moves; no export or synth files touched                                                                                                                                                                                 |
| Audio-critical patterns preserved, never "fixed"             | Moved code keeps dependency arrays, comments, memoization verbatim; `useStartupRestore` carries the eslint-disable header                                                                                                        |
| Consumers resolve without use-before-declaration errors      | Each hook is called at or before its earliest consumer (`useNavigationSuspension` before `useKeyboardNavigation`; `useAppModals` at the `useModalManager` position; `useStartupRestore` at the `useUiStatePersistence` position) |

Requirements with no covering step: none.
Steps with no stated requirement: the `modalState` reference split - enabling
step for the grouped parameter, harmless.

## Ambiguity

- "Returns the verbatim `<ModalManager>` element" - interpretation: the hook
  returns `ReactElement` produced by the same JSX literal, vs. returning a
  component type. Evidence: `AppLayout`'s `modals` prop takes an element; the
  plan passes `modals={modals}` where `modals` is the returned element.
  Resolved by the named return type in the plan.
- "`useModalManager` options object moves verbatim" - the two renames
  (`isExportOpen: isExportModalOpen`, `isPasteTrackOptionsOpen: isPasteTrackModalOpen`)
  travel inside the moved object; outside names are unchanged.

## Implementability

- `UseModalStateResult`, `PendingSongImport`, `InstrumentTypeInfo`,
  `TrackPasteMode`, `MidiConfiguration`, `MidiDeviceInfo`, `MidiMonitorEntry`,
  `ExportType`, `ExportStrategy`, `Instrument` are all exported and importable.
- `useUiStatePersistence` accepts `(flags, sharedCurrentLine, openHandlers)`;
  all flags and open-handler setters are `UseModalStateResult` fields plus
  `useAppInfoDialogs` handlers - available at the call position.
- `useModalManager` is a plain exported function; calling it inside
  `useAppModals` preserves its position in `App`'s hook sequence.
- All `useAppModals` parameters are in scope before line ~736 of `App.tsx`;
  the latest producer (`useMidiDialog`) ends earlier.
- `.tsx` extension needed on `useAppModals` - it returns JSX.

## Fidelity

- Enumeration fidelity: every value the `useModalManager` options and the
  `ModalManager` JSX consume is enumerated in the `useAppModals` parameter
  list - none deferred.
- Vocabulary freeze: prop and option names are unchanged; moved code is
  verbatim, so every emitted handler name and prop key is identical.
- Cross-party parity: `useAppModals` is the only new emitter/consumer pair;
  `ModalManager`'s `Props` and `useModalManager`'s options stay untouched.
- Constants completeness: no numeric bounds involved.
- Boundary decisions: `modalState` passes as one grouped parameter - recorded
  in the plan; individual values stay individual parameters.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    | -       | -                |
