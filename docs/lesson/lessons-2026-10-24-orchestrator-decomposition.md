# Session Findings - 2026-10-24 - Orchestrator Decomposition

Lessons gathered during the 1.3.3 version window, which decomposed `src/App.tsx` into twelve bounded orchestration hooks.

### Extracted Hook Placed After Its Consumer

Observed symptom: `npm run build` failed with `TS2448` and `TS2454` - `isPasteTrackModalOpen` was used before declaration after `usePasteTrackOptions` replaced the inline state, because `isNavigationSuspended` consumed the flag earlier than the moved block's original position.

Root cause: the hook call inherited the position of the code it replaced instead of the position of its earliest consumer. Aggregate flags read modal-open state hundreds of lines before the moved handlers.

Preventing rule: see "Place an extracted hook before its earliest consumer" in `docs/WORKFLOW.md`.

### Orphaned Imports in the Origin File

Observed symptom: three successive slices each needed a follow-up cycle to remove imports left unused by the extraction - `yaml` after `useInstrumentFileLoading`, `ExportType`/`ExportStrategy` after `useExportModal`, `clearIntervalRef` and the editor-cursor helpers after later slices.

Root cause: extractions removed the using code but not the import block; `eslint` and `tsc -b` reported each orphan only on the next verification pass.

Preventing rule: see "Check the origin file's imports after each extraction" in `docs/WORKFLOW.md`.

### Setter Parameter Type Mismatch

Observed symptom: `npm run build` failed with `TS2322` when `useMidiDialog` declared `setMidiConfiguration` as `Dispatch<SetStateAction<MidiConfiguration>>` but `useMidiHandling` returns a plain `(configuration) => void`.

Root cause: the parameter interface was written from the assumption that every state setter is a React dispatch, without checking the producing hook's declared result type.

Preventing rule: see "Hook Extraction" in `docs/standard/ts-react-development.md`.

### Lint Warning Invisible Inside the Oversized Component

Observed symptom: the verbatim move of the mobile-viewport mount effect into `useResponsivePanels` produced a `react-hooks/set-state-in-effect` warning that `src/App.tsx` never emitted for the identical code.

Root cause: the compiler-powered react-hooks rules only analyze files they can fully model; the 2600-line component escaped analysis, so the warning surfaced only after extraction into a small file.

Preventing rule: see "Hook Extraction" in `docs/standard/ts-react-development.md`.

### Stash Check Missed Untracked Files

Observed symptom: a `git stash`-based attempt to lint the pre-change tree still reported the new `useResponsivePanels` warning, making the baseline comparison inconclusive.

Root cause: `git stash` does not stash untracked files; the new hook file stayed on disk and kept linting.

Preventing rule: see "Untracked files survive `git stash`" in `docs/WORKFLOW.md`.
