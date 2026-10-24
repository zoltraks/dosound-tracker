# Align the Test Tree with the Domain Grouping Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.5/test-tree-domain-alignment.md`.

## Best Practices

Follow the TypeScript general engineering standard from `docs/standard/typescript-general-development.md`:

- Test layout mirrors source layout: a test file sits beside the domain path of the file it covers.
- Moves are mechanical: update every relative import prefix, never edit test bodies.
- `git mv` preserves history for every moved file.

## Documentation Updates

Update `TESTING.md` before moving any file:

- Remove the `test/stores/` entry - the directory dissolves with the stores source directory.
- Add a `test/exports/` entry mirroring `src/exports/`, parallel to the existing `test/synth/` entry.
- Record that `test/hooks/` and `test/utils/` group single-subject tests into domain subdirectories mirroring `src/hooks/` and `src/utils/`, while tests covering several subjects keep flat names in the directory root.

## Type and State Updates

No TypeScript types, interfaces, or stores change. Only file locations and relative import prefixes change. The Vitest include pattern `test/**/*.{test,spec}.{ts,tsx}` already covers subdirectories, so `vitest.config.ts` needs no change. Fixture reads use cwd-relative `test/fixtures/` paths and are unaffected by moves.

## Step by Step Implementation

**Dissolve test/stores into test/hooks/ui**

`src/hooks/ui/useUiStore.ts` holds the only store since `src/stores/` was dissolved. Move `test/stores/uiStore.test.ts` to `test/hooks/ui/uiStore.test.ts` and remove the empty `test/stores/` directory.

**Group single-subject hook tests into domain subdirectories**

Create `test/hooks/song/`, `test/hooks/instrument/`, `test/hooks/midi/`, `test/hooks/modal/`, `test/hooks/storage/`, and `test/hooks/ui/`. Move each test whose subject is one hook file into the subdirectory mirroring that hook's domain:

- `song/`: `dataManagement.test.tsx`, `loadInitialSong.test.ts`, `useDataManagement.hook.test.tsx`, `useDataManagement.mirror.test.tsx`.
- `instrument/`: `useInstrumentWarnings.test.tsx`.
- `midi/`: `useMidi.test.tsx`, `useMidiActions.test.tsx`, `useMidiActions.velocity.test.tsx`, `useMidiDeviceManagement.test.tsx`, `useMidiMessageProcessing.test.tsx`.
- `modal/`: `useModalState.test.tsx`.
- `storage/`: `useLocalStorageState.test.tsx`, `useStorageMirror.test.ts`.
- `ui/`: `useMessageSystem.test.tsx` (plus `uiStore.test.ts` from the step above).

Keep `songManagement.test.ts` flat in `test/hooks/` - it exercises `useSongManagement`, `useInstrumentManagement`, and `useStorage` across three domains.

**Move the misplaced parser test to its subject domain**

`test/hooks/useDataManagement.test.ts` contains only `parseSongFromYaml` describe blocks - its subject is `src/utils/song/songParser.ts`, not a hook. Move it to `test/utils/song/useDataManagement.test.ts`.

**Group single-subject utility tests into domain subdirectories**

Create the `test/utils/` subdirectories mirroring `src/utils/` and move each single-subject test:

- `compression/`: `zx0.test.ts`.
- `cursor/`: `editorCursor.test.ts`, `panelCursorFields.test.ts`.
- `envelope/`: `envelopePanelUtils.test.ts`.
- `export/`: `exportFileNaming.test.ts`.
- `file/`: `filePickerUtils.test.ts`.
- `format/`: `formatters.test.ts`.
- `instrument/`: `instrument.test.ts`, `instrumentActionUtils.test.ts`, `instrumentIO.test.ts`, `instrumentOperations.test.ts`, `instrumentPanelUtils.test.ts`.
- `keyboard/`: `keyboardNavigationUtils.test.ts`, `keyboardNoteMapping.test.ts`, `keyboardShortcutUtils.test.ts`.
- `log/`: `logger.test.ts`.
- `markdown/`: `markdown.test.ts`, `bundledMarkdown.test.ts`.
- `midi/`: `midiActionsUtils.test.ts`, `midiConfiguration.test.ts`.
- `panel/`: `pianoUtils.test.ts`, `toneNoisePanelUtils.test.ts`, `volumeUtils.test.ts`.
- `playback/`: `playbackUtils.test.ts`.
- `song/`: `songIO.test.ts`, `songParser.test.ts`, `songParserGaps.test.ts`, `instrumentColor.test.ts` (subjects are `normalizeInstrumentColor` and song YAML IO in `src/utils/song/`).
- `storage/`: `persistenceMirror.test.ts`.
- `timer/`: `timerUtils.test.ts`.
- `track/`: `trackPanelUtils.test.ts`.

Keep flat in `test/utils/`: `branchGaps.test.ts` (exports, storage hook, midi and track utils), `envelopeAndMidi.test.ts` (envelope, instrument, and midi utils), `exportCoreAndValidation.test.ts` (export core, binary, and validation util), `vgmAndTrackLine.test.tsx` (component and VGM export).

**Create test/exports mirroring src/exports**

Move every test whose subjects live in `src/exports/` into `test/exports/`, parallel to the existing `test/synth/` mirror: `exportAsmInstrument.test.ts`, `exportAsmStrategies.test.ts`, `exportAssemblyOptimized.test.ts`, `exportBinary.test.ts`, `exportDump.test.ts`, `exportInstrument.test.ts`, `exportMax.test.ts`, `exportPitchDelta.test.ts`, `exportSustain.test.ts`, `exportVgm.test.ts`, `exportWav.test.ts`.

**Rewrite import prefixes in every moved file**

Every moved file sits one directory deeper, so `../../src/` prefixes become `../../../src/`. Verify no other relative specifiers exist - the census showed every test import targets `src/` only, and fixture reads are cwd-relative.

## Implementation Order

1. Update `TESTING.md` test-directory section.
2. Run the pre-change baseline verification loop.
3. Move files per the mapping above with `git mv`, rewriting import prefixes file by file.
4. Run the full verification loop.

## Testing Strategy

No new tests and no test content changes - the plan moves existing files only. The suite itself is the verification: every moved test must still pass, and the total test count must be unchanged before and after the moves.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test` - same pass count as the baseline
