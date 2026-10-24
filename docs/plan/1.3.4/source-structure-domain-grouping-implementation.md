# Group Source Files into Domain Subfolders Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.4/source-structure-domain-grouping.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`:

- Organize source code by responsibility; group related files together.
- Use relative imports for cross-module imports; do not introduce `@/` alias usage.
- Keep file names unchanged so imports stay discoverable and git history is preserved by `git mv`.
- No abbreviations in identifiers; directory names use lowercase domain words already established by file-name prefixes.

## Audio-Critical Requirements

This change moves files that sit on audio paths (`src/hooks/sequencer/`, `src/hooks/midi/`, `src/hooks/playback/`) without modifying their code.

- React render timing is unaffected: no component, hook body, dependency array, or state pattern changes.
- `useCallback` and `useMemo` dependency arrays are untouched.
- State management patterns are untouched.
- The YM2149 emulator and SoundDriver are untouched.
- One audio-adjacent specifier changes: `new URL('../workers/sequencerWorker.ts', import.meta.url)` inside `useSequencer.ts` becomes `'../../workers/sequencerWorker.ts'`. The worker bundle path is resolved by Vite at build time; the build step verifies it.
- Manual audio verification: play a short phrase after the build to confirm the worker still ticks, since the move touches the worker URL specifier.

## Documentation Updates

Update the active documentation set before any source code modifications.

- `SPECIFICATION.md` — rewrite the Source Directory Structure section to record domain subfolders, `modals/`, and `assets/`; update `src/utils/instrumentPanelUtils.ts` and `src/hooks/useMidiMessageProcessing.ts` references to their new paths.
- `ARCHITECTURE.md` — update the Module Boundaries bullets for `hooks` and `utils` to record the domain subfolder grouping.
- `docs/standard/ts-react-development.md` — correct the Import Paths statement: a `@/` alias is configured in `vite.config.ts` and `vitest.config.ts`, while the project convention keeps relative specifiers.
- `REFACTORING.md` — correct the stale `2194-line App.tsx` figure to the current ~1390 lines used by the other pillars.
- `PROJECT.md` and `FORMAT.md` — no changes required.

## Type and State Updates

No type definitions or stores change. `src/stores/` and `src/types/` are untouched.

## Step by Step Implementation

**Rewrite the ModalContainer barrel import**

`src/components/ModalContainer.tsx` is the only consumer of `src/modals/index.ts`, importing eleven of the fourteen modals through it. Replace the single `from '../modals'` import with eleven direct imports, one per modal file. `src/components/ModalManager.tsx` and `test/components/FilePickerModal.test.tsx` already import modal files directly and need no change.

Files to modify: `src/components/ModalContainer.tsx`. Delete `src/modals/index.ts`.

**Move utility files into domain subdirectories**

Move 26 files under `src/utils/` into eight domain directories and rewrite every specifier that points at them.

| Directory          | Files                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `utils/instrument` | `instrument.ts`, `instrumentActionUtils.ts`, `instrumentIO.ts`, `instrumentOperations.ts`, `instrumentPanelUtils.ts`, `instrumentSelection.ts` |
| `utils/track`      | `trackClipboard.ts`, `trackPanelUtils.ts`, `trackRendering.ts`, `trackUtils.ts`                                                                |
| `utils/song`       | `songFormat.ts`, `songIO.ts`, `songParser.ts`                                                                                                  |
| `utils/midi`       | `midiActionsUtils.ts`, `midiConfiguration.ts`, `midiUtils.ts`                                                                                  |
| `utils/keyboard`   | `keyboardNavigationUtils.ts`, `keyboardNoteMapping.ts`, `keyboardShortcutUtils.ts`                                                             |
| `utils/envelope`   | `envelopePanelUtils.ts`, `envelopeTypes.ts`, `envelopeUtils.ts`                                                                                |
| `utils/playback`   | `playbackSimulation.ts`, `playbackUtils.ts`                                                                                                    |
| `utils/file`       | `fileOperations.ts`, `filePickerUtils.ts`                                                                                                      |

**Move hook files into domain subdirectories**

Move all 43 files under `src/hooks/` into twelve domain directories and rewrite every specifier that points at them. A source directory that contains subdirectories does not hold files directly, so the flat remainder joins the grouping: song-data operation hooks join `song/`, the dialog orchestration hooks join `modal/`, and the storage, file, and UI clusters take their own directories.

| Directory          | Files                                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `hooks/midi`       | `useMidi.ts`, `useMidiActions.ts`, `useMidiDeviceManagement.ts`, `useMidiDialog.ts`, `useMidiHandling.ts`, `useMidiMessageProcessing.ts`      |
| `hooks/instrument` | `useInstrumentActions.ts`, `useInstrumentDialogs.ts`, `useInstrumentFileLoading.ts`, `useInstrumentManagement.ts`, `useInstrumentWarnings.ts` |
| `hooks/song`       | `useSongLifecycleDialogs.ts`, `useSongManagement.ts`, `useSongToolDialogs.ts`                                                                 |
| `hooks/playback`   | `usePlaybackControls.ts`, `usePlaybackHandlers.ts`, `usePlaybackSimulation.ts`                                                                |
| `hooks/keyboard`   | `useKeyboardNavigation.ts`, `useKeyboardShortcuts.ts`                                                                                         |
| `hooks/audio`      | `useAudioContext.ts`, `useAudioSetup.ts`                                                                                                      |
| `hooks/sequencer`  | `useSequencer.ts`, `useSequencerIntegration.ts`                                                                                               |
| `hooks/modal`      | `useModalManager.ts`, `useModalState.ts`                                                                                                      |
| `hooks/app`        | `useAppInfoDialogs.ts`, `useAppState.ts`                                                                                                      |

**Rewrite specifiers mechanically**

Every specifier surface is covered, not only `import`/`from` clauses: re-exports, dynamic `import()`, `vi.mock`/`vi.importActual` calls, query-suffixed specifiers such as `'../assets/song.yaml?raw'`, and the `new URL('../workers/sequencerWorker.ts', import.meta.url)` worker specifier in `useSequencer.ts`. A rewrite script resolves each relative specifier against the importer's old location, maps the target through the move table, and writes the specifier relative to the importer's new location, preserving query suffixes. The script lives in `work/` and is removed at task end.

Cross-domain moved-to-moved imports exist and are covered: for example `utils/instrument/instrumentIO.ts` keeps importing `songFormat`, `envelopeUtils`, and `playbackUtils` through `../song/`, `../envelope/`, and `../playback/` specifiers, and `utils/midi/midiConfiguration.ts` reaches `hooks/midi/useMidi.ts` through `../../hooks/midi/useMidi`.

**Dissolve the stores directory**

`src/stores/uiStore.ts` is the directory's only member. It moves to `src/hooks/ui/useUiStore.ts`, renamed to match the hook file-naming convention - the exported `useUiStore` identifier and all destructured imports stay valid. `test/stores/uiStore.test.ts` keeps its location and only its specifiers are rewritten. The emptied `src/stores/` directory is removed.

**Verify per wave**

After the modals wave and again after each directory wave, run the targeted verification loop: `npm run typecheck`, `npm run lint`, `npm run build`, and `npm test` limited to the tests covering the moved modules. `npm run format` runs once before the final full verification loop since it sweeps the whole tree.

## Implementation Order

1. Update documentation (`SPECIFICATION.md`, `ARCHITECTURE.md`, `docs/standard/ts-react-development.md`, `REFACTORING.md`).
2. Run the pre-change baseline full verification loop.
3. Remove the `src/modals/index.ts` barrel and rewrite `ModalContainer.tsx` imports. Run targeted verification.
4. Move `src/utils/` files into domain subdirectories and rewrite specifiers. Run targeted verification.
5. Move `src/hooks/` files into domain subdirectories and rewrite specifiers including the worker URL. No file stays flat: song-data operations join `song/`, dialog orchestration joins `modal/`, and `storage/`, `file/`, and `ui/` hold their clusters. Run targeted verification.
6. Remove the stray `src/.DS_Store`.
7. Run `npm run format`, then the full verification loop.
8. Manually verify audio playback ticks after the build.

## Testing Strategy

**Unit tests**

No new utility functions are added, so no new test files are created. Existing tests keep their locations; their import specifiers are rewritten to the new source paths (for example `../../src/utils/songParser` becomes `../../src/utils/song/songParser`).

**Integration tests**

No component or hook behaviour changes. The existing suite is the regression net: `test/hooks/` and `test/utils/` cover the majority of moved modules, and the export test suite guards the byte-identical export contract.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Manually verify playback ticks after the build, since the move touches the worker URL specifier
- Confirm `git status` shows only renames, the barrel deletion, specifier rewrites, and the two new documents
