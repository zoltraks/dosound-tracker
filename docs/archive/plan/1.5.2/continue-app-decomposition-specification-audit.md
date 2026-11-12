# Specification Audit - Continue App Decomposition

## Document Information

|            |                                                                |
| ---------- | -------------------------------------------------------------- |
| Change     | `docs/change/1.5.2/continue-app-decomposition.md`              |
| Plan       | `docs/plan/1.5.2/continue-app-decomposition-implementation.md` |
| Audit Date | 2026-11-15                                                     |

## Completeness

- "Extract the next bounded concerns into named hooks or smaller orchestrator
  components" - covered by the three hook extractions plus the `patternsById`
  internalization.
- "Keep `App.tsx` as the visible wiring root rather than an opaque shell" -
  covered by the Analysis section's explicit decision to retain the JSX prop
  map and the composition-root state.
- "Behaviour-preserving - no observable change" - covered by the verbatim-move
  rule in Best Practices and the audio-critical assessment.
- "Each concern clear from its name and typed parameter object" - each new
  hook declares `Use*Params`/`Use*Result` interfaces typed to the producing
  signatures.

## Ambiguity

- "The next bounded concerns" is resolved by the Analysis section, which
  enumerates every remaining inline cluster in `App.tsx` and records a keep or
  extract verdict for each - no unnamed candidate remains.
- "Called where X sits today" for `useChannelPans` places the callback earlier
  in the hook sequence than its old position. The plan states the sequence is
  static and effect-free, so the single interpretation (call position = old
  memo position) is recorded.

## Implementability

- `src/hooks/ui/useUiStore.ts` verified: three members, four actions, `UiStore`
  exported - the bundle surface matches exactly.
- `src/hooks/song/useDataManagement.ts` verified: `updateSong` signature
  `(updates: Partial<Song>, options?: UpdateSongOptions) => void` and
  `UpdateSongOptions` is exported.
- `src/utils/song/songStereo.ts` verified: `resolveChannelPans` returns
  `[number, number, number]`, `nextChannelPan` exported.
- `src/hooks/playback/usePlaybackBridge.ts` verified: `patternsById` is a
  param today, `currentSong` is already a param, `Pattern` is already imported
  as a type - the memo can internalize without new dependencies.
- `src/hooks/modal/useSettingsDialog.ts` verified: takes
  `(isOpen, committedSettings)` and returns the working-state surface the
  session hook re-exports.
- Setter types verified: `setIsSettingsOpen` is `(open: boolean) => void`,
  `setTheme`/`setTextScale`/`setTrackBackgroundEnabled`/`setSoundEngineId` are
  `Dispatch<SetStateAction<T>>`, `setPasteTrackMode` is
  `(mode: TrackPasteMode) => void`.

## Fidelity

- Out-of-scope honoured: `useSequencerIntegration` and `useSongManagement` are
  untouched - `patternsById` stops at the `usePlaybackBridge` boundary and the
  integration hook keeps its existing param.
- Moved-code rule honoured at the vocabulary level: every moved memo and
  callback keeps its dependency array and body; the only identifier change is
  the `stereo` parameter name inside `useChannelPans`.
- Enumeration fidelity: the Analysis section lists all remaining inline
  fragments (`soundEngineId`, `envelopeMessages`, `previewTickIntervalMs`,
  `handleLineChange`, `isDarkMode`, the JSX prop map) with an explicit keep
  verdict, so no cluster is implied rather than decided.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
