# Version 1.6.5 Review

## Document Information

|             |                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Version     | 1.6.5                                                                                                                                                        |
| Review Date | 2026-11-17                                                                                                                                                   |
| Commands    | `git log`, `git status --short`, `git diff`, `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, `npm test`, `npm run test:coverage`, `npm run test:e2e`, `npm audit`, `scripts/release-check.sh` |

## Scope

This review closes the 1.6.5 window. The window's change group holds the
three dual-chip records moved here from the deferred 1.7.0 group on the
owner's instruction: `dual-engine-audio-panning`, `dual-chip-track-ui`,
and `dual-chip-exports-panels`. Together with the foundation record
`dual-chip-song-data` landed in the previous window, they deliver
audible, editable, and exportable two-chip songs.

## Recorded Work

| Document                                                        | Kind        | Status | Result                                                                            |
| --------------------------------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------------- |
| `docs/change/1.6.5/dual-engine-audio-panning.md`                | Change      | Done   | Implemented and verified this run                                                 |
| `docs/change/1.6.5/dual-chip-track-ui.md`                       | Change      | Done   | Implemented and verified this run                                                 |
| `docs/change/1.6.5/dual-chip-exports-panels.md`                 | Change      | Done   | Implemented and verified this run                                                 |
| `docs/plan/1.6.5/dual-chip-window-implementation.md`            | Plan        | Done   | Written before source edits; Refinements section records landed divergences      |
| `docs/refactoring/1.6.5/REFACTORING.md` + `ASSESSMENT.md`       | Refactoring | Done   | Pass - projection utility, exporter pickers, mute normalization                   |

## Repository Analysis

- **Confirmed - audio record**: `useAudioSetup` builds one `SoundEngine`
  per chip through the shared factory, so the internal `YM2149` and the
  Ayumi worklet both support the pair; channels A-C route to chip 1 and
  D-F to chip 2 with local indexes 0-2; `setChannelPans` propagates the
  six-entry `song.stereo` resolution live; stop/reset silences both
  engines.
- **Confirmed - UI record**: `general.visibleTracks` (3|6) and
  `sound.dualChip` persist through settings state, YAML, and the modal;
  `visibleTracks.ts` owns the projection; the tracker gains an A-C/D-F
  chip-group switcher in three-track mode; focus, selection, keyboard
  navigation, playlist columns, preview, and MIDI paths all carry the
  six-channel vocabulary; mutes persist as six entries with legacy
  three-entry normalization.
- **Confirmed - exports/panels record**: the export modal keeps a single
  surface and gains an `AY/YM stream` selector feeding
  `ExportContext.chipStream`; DATA/ASM, BIN, VGM, and MAX emit the
  selected register stream with chip-2 fallback to chip 1 on
  single-chip songs; the register dump emits labelled `music:` and
  `music2:` sections; WAV mixes both chips; MIDI writes up to six
  tracks; MOD warns on the unrepresentable second chip; the EQ panel
  renders per-channel meters from both engines and the DUMP panel gains
  a chip switcher.
- **Confirmed - verification**: typecheck, lint (0 problems), format,
  build (entry chunk 598.90 kB, under the 600 kB budget after lazy-loading
  the picker/export/paste modals), 188 test files / 1734 tests, coverage
  above the 80% gate on every axis, 30 e2e smoke tests on chromium and
  webkit, `npm audit` clean.

## Deviations and Residuals

- **Pan editing UI remains deferred** - interactive stereo/pan controls
  belong to `reintroduce-stereo-editing-controls` and
  `dual-chip-stereo-configuration` in the 1.7.0 window. This window lands
  the full data path: file-declared `stereo` resolves six pans, the
  `dual` layout defaults chip 1 left / chip 2 right, and pan changes
  reach live engines without recreating the audio path.
- **MOD cannot carry six channels** - it exports A-C and reports the
  dropped second chip through the result warning list; documented in
  SPECIFICATION.md and the plan's Refinements.
- **Entry chunk pressure** - the window's additions pushed the entry
  chunk to 602.46 kB before the modal code-split brought it to 598.90 kB;
  further growth should evaluate the same lazy boundary pattern.

## Decision

**Bump.** All three records' acceptance surfaces are implemented and
verified; residuals are explicitly deferred to their owning 1.7.0
records. Recommend bumping the version per `VERSIONING.md` and closing
the window.
