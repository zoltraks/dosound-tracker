# Remove Obvious Comments

**Type:** Refactor

## Summary

| Field         | Value                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| Intent        | Strip comments that narrate what the adjacent code already says, per a tree-wide audit |
| Key decisions | Removal criteria and the keep list below; ~320 candidates catalogued by file           |
| Open risks    | Borderline entries flagged per file need a judgment call during implementation         |

## Description

A full-tree audit catalogued comments that describe what is already obvious from the code they sit next to. Source code is not the place for narration: a comment should carry only what a reader cannot see in the code itself - rationale, constraints, edge cases, hardware semantics, format quirks, deliberate anti-patterns.

**Removal criteria**

- Restates the adjacent statement, call, condition, or declaration in words.
- Labels a block whose names already say what it is.
- Step-numbered or per-line process narration inside a function.
- Commented-out dead code and stale comments that contradict the code below them.
- Prop, parameter, or type JSDoc that repeats the signature without contract information.

**Keep criteria**

- Rationale and design intent not visible in the code (audio timing, prop mirroring, sparse dependency arrays, monophonic and sustain semantics, deliberately empty fallbacks).
- Hardware and format semantics (register maps, DOSOUND delay quirks, magic-byte decoders, mode-value encodings, `// A, B, C` register order markers).
- File-level docblocks, license headers, `eslint-disable` comments, `// @vitest-environment` pragmas, `// ignore` catch-swallow markers, `// REASON:` React Compiler notes.
- Comments decoding edge cases, clamping bounds, and non-obvious guards.

## Candidate Files

Counts in parentheses. Line numbers are from the audit tree state and may drift - the comment text is the locator. Entries marked `(b)` are borderline - narration that carries a token of context; decide during implementation.

### src root

- `src/App.tsx` (2): L133 "Check if download files are available"; L670 "Settings dialog: committed snapshot..." `(b)`.
- `src/workers/sequencer.ts` (6): L64, L77, L80, L93, L207, L222 - loop-advance and message-handler narration.

### src/components

- `ColorPicker.tsx` (2): L10-13 and L14-17 - prop JSDoc restating `onChange` and `className`.
- `CommandPanel.tsx` (3): L263, L321, L367 - "Row N" labels over the button rows.
- `DumpPanel.tsx` (1): L92 "Update every 100ms".
- `EnvelopePanel.tsx` (3): L162, L338, L374 - restates assignments and narrates JSX branches.
- `FileInputs.tsx` (1): L40 "This will be handled by the useDataManagement hook".
- `HeaderPanel.tsx` (2): L68 "Simple instrument preview state..."; L226 `{/* Octave Selection */}`.
- `InstrumentSection.tsx` (2): L51 "Find current instrument index"; L103 "Ctrl+ArrowUp / Ctrl+ArrowDown: move...".
- `ModalManager.tsx` (7): L14, L34, L129, L137, L152, L159 prop-group labels; L171 stray "Error and summary states" inside destructuring.
- `PianoKeyboard.tsx` (6): L52, L97, L181, L198, L210, L319 - preview and key-branch narration plus `{/* Piano keyboard */}`.
- `PlaylistPanel.tsx` (6): L47, L87, L141, L205, L221, L232 - persist, validate, refocus, keybinding, and edit-branch narration.
- `ToneNoisePanel.tsx` (6): L184, L188, L190, L193, L195, L205 - mode-label and color-literal restatements.
- `TrackPanel.tsx` (18): L127, L187, L210, L236, L261, L264, L272, L275, L293, L315, L324, L329, L340, L344, L350, L356, L381, L390 - per-branch keybinding narration and call restatements.

### src/modals

Clean - no candidates in any of the 15 modals.

### src/hooks

- `app/useAppState.ts` (1): L118-119 "Persist transpose settings whenever they change...".
- `audio/useAudioContextResume.ts` (1): L14 "AudioContext resumed...".
- `audio/useAudioSetup.ts` (1): L41 "Basic initial register setup".
- `file/useDownloadAvailability.ts` (3): L17, L35, L52 - guard, filter, and catch restatements.
- `instrument/useInstrumentDialogs.ts` (1): L48 "Handle instrument selection".
- `keyboard/useKeyboardNavigation.ts` (2): L72, L110.
- `midi/useMidiActions.ts` (4): L172-173, L282, L302, L333 - focused-track and preview-branch narration.
- `midi/useMidiMessageProcessing.ts` (3): L493, L573, L643 section labels; L132 trailing `// 1-16` `(b)`.
- `modal/useAppModals.tsx` (14): L17 `(b)`, L33, L43, L58, L68, L73, L81, L90, L107, L113, L121, L135, L142 param-group labels; L369 "Error and summary states" JSX label.
- `modal/useTransposeDialog.ts` (3): L49-50, L60-61, L149-150 `(b)` all three.
- `playback/usePlaybackBridge.ts` (1): L83 "Register sequencer callback".
- `playback/usePlaybackHandlers.ts` (20): L59, L61, L64, L67, L70, L74, L76, L79, L82, L85, L95, L118, L139, L201, L275, L333, L348, L401, L421, L426 - systematic per-line narration.
- `playback/usePlaybackSimulation.ts` (2): L50, L58.
- `sequencer/useSequencer.ts` (10): L50 `(b)`, L58, L73, L100, L173, L212, L257, L272, L308, L322 - postMessage and worker-setup labels.
- `sequencer/useSequencerIntegration.ts` (11): L127, L129, L189, L195-196 (stale - says "Read A for track B/C" while the code reads `patternB`/`patternC`), L305-307 `(b)`, plus four further line-narration entries in the same file.
- `song/useTrackPattern.ts` (7): L19, L32, L47, L52, L65, L77 (stale copy - "Handle stop playback with silence" above `handlePatternChange`), L85.
- `song/useTrackOperations.ts` area (1): L139 "Check for existing data to determine if we need to ask for paste mode".
- `storage/useEditorPersistence.ts` (2): L81, L110 - mount-restore and persist-effect narration.
- `storage/useStorage.ts` (1): L37 "Clear any previously scheduled save...".
- `ui/useScrollSync.ts` (4): L9, L61, L64, L75.
- `ui/useTrackFocus.ts` (1): L19 `(b)`.

### src/exports and src/synth

- `exports/asm.ts` (40): L39, L47 (dead `if` quotation only), L55, L64 (stale), L79, L104, L113, L142, L153, L160 `(b)`, L164, L173, L180, L186, L202, L207, L210, L215, L314 `(b)`, L341, L399, L403, L408, L418, L429, L467, L472 `(b)`, L492, L497, L502, L514, L520, L523, L534, L542, L548, L554, L563, L567, L632-634 - register-write and emit-sequence narration throughout both dump paths and the instrument exporter.
- `exports/core.ts` (2): L22, L47.
- `exports/max.ts` (2): L164 `(b)`, L223.
- `exports/vgm.ts` (1): L22.
- `synth/YM2149.ts` (21): L1, L2, L61, L98, L105, L110, L112, L114 (also stale aside), L206, L214, L217 (also inaccurate), L225 `(b)`, L238, L331, L345, L357, L438, L441, L455, L484, L499.

### src/utils

- `envelope/envelopePanelUtils.ts` (1): L5.
- `format/formatters.ts` (5): L12-17, L23 (stale ref), L28, L33-37, L60-65.
- `log/logger.ts` (1): L39 "Private constructor for singleton".
- `markdown/markdown.ts` (4): L19, L39, L43, L57.
- `playback/playbackSimulation.ts` (12): L81, L126, L157, L161, L174, L179, L256, L262, L371, L396, L411, L434.
- `playback/playbackUtils.ts` (3): three line-narration entries.
- `song/songIO.ts` (1): one entry.
- `song/songParser.ts` (4): L245-246, L267 (stale - says "treated as space" on a note-off branch), L270 (duplicate), L427.
- `storage/storageKeys.ts` (3): L9, L36, L43 - single-key group labels.
- `track/trackClipboard.ts` (2): L34, L261.

### test, e2e, electron, scripts

- `test/components/TrackPanel.test.tsx` (2): L70, L74.
- `test/hooks/midi/useMidi.test.tsx` (1): L13.
- `test/utils/song/songParser.test.ts` (5): L21, L27, L38, L47, L56; L18 `(b)`.
- `test/utils/midi/midiActionsUtils.test.ts` (2): L35, L41.
- `test/utils/panel/toneNoisePanelUtils.test.ts` (2): L51, L53.
- `test/utils/export/exportFileNaming.test.ts` (1): L45.
- `test/utils/playback/playbackSimulation.test.ts` (1): L58 `(b)`.
- `test/utils/midi/midiConfiguration.test.ts` (4): L70-73 `(b)` all four.
- `test/modals/FilePickerModal.test.tsx` (2): L42 `(b)`, L96.
- `test/exports/exportVgm.test.ts` (21): L79, L87, L91, L95, L100, L106, L110, L115, L119, L135 `(b)`, L194, L200, L205, L227, L230, L273, L295, L301, L346, L353 `(b)`, L412.
- `test/exports/exportMax.test.ts` (7): L59, L62, L120, L183, L216, L266, L280; L22, L181, L221-222, L242 `(b)`.
- `test/exports/exportWav.test.ts` (1): L88.
- `test/exports/exportAssemblyOptimized.test.ts` (2): L50-51; L55-56 `(b)`.
- `scripts/clean.sh` (1): L30 `(b)`.
- `e2e/` and `electron/` - clean.

## Hints

- Deletion only - do not rewrite kept comments in the same pass.
- When a flagged comment sits above a kept one, delete only the flagged lines.
- Re-check each site while removing: a comment that became true documentation since the audit stays.
- Stale comments (`useTrackPattern.ts` L77, `songParser.ts` L267, `useSequencerIntegration.ts` L195-196, `asm.ts` L64, `YM2149.ts` L217) are the strongest removals - they actively mislead.
- `ModalManager.tsx` and `useAppModals.tsx` group labels are a style call - keep or drop consistently across both files.
- Side findings that are not comments were also noted and are out of scope here: a dead no-op effect in `MidiModal.tsx` and a no-op `formatPatternDisplay` in `PlaylistLine.tsx` - candidates for their own records.

## Out of Scope

- Rewriting or rewording comments that stay.
- JSDoc that carries contract information beyond the signature.
- Code refactoring of any kind - comments only.
