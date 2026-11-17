# Dual-Chip Window Implementation Plan

## Summary

| Field         | Value                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Implement the three records moved into this window: `dual-engine-audio-panning`, `dual-chip-track-ui`, and `dual-chip-exports-panels` under `docs/change/1.6.5/`.                                                                                                                                                                                                       |
| Key decisions | One `SoundEngine` per chip behind a shared engine-pair facade; channel state arrays size to the song's effective channel count; the visible track set is a view-layer projection of the song's channels gated by a new `dualChip` setting and a 3-or-6 track-count setting; ASM/BIN gain a chip-stream selector and other formats take documented per-format decisions. |
| Open risks    | `useSequencerIntegration` is the densest three-channel site; UI focus/selection/scroll state assumes three tracks; eight exporters consume the simulation.                                                                                                                                                                                                              |

## Change Request References

- `docs/change/1.6.5/dual-engine-audio-panning.md`
- `docs/change/1.6.5/dual-chip-track-ui.md`
- `docs/change/1.6.5/dual-chip-exports-panels.md`

## Documentation Updates

- `SPECIFICATION.md` - dual-engine playback, settings options, export chip selection, panel behaviour.
- `FORMAT.md` - unchanged (data model already documented).

## Type and State Updates

- `src/types/settings.ts` + `src/utils/settings/` - `dualChip` enable flag and `visibleTracks` (3|6) persisted through the settings session.
- `src/hooks/ui/useUiStore.ts` - `channelMutes` widens to six entries.
- `src/hooks/playback/usePlaybackSimulation.ts` - per-channel state arrays size to `songChannelCount(song)`.
- `src/hooks/audio/useAudioSetup.ts` - engine pair: `ym2149Ref` stays chip 1, add `ym2149Ref2`, `engineForChannel`, `waitForEngines`.

## Step by Step Implementation

**Audio: engine pair and routing**

`useAudioSetup` takes the song's effective chip count; on two-chip songs it creates a second engine through the same `createSoundEngine` factory, applies clock/chip/pans (chip 1 gets pans 0-2, chip 2 gets pans 3-5), and resolves waiters only when both engines land. `useSequencerIntegration` builds pattern/note/volume arrays for all active channels, routes `ch >= 3` to engine 2 with local channel `ch - 3`, and batches both engines. Channel mutes index globally; preview and MIDI paths keep chip-1 behaviour for single-chip and route by channel where they already know it.

Files: `src/hooks/audio/useAudioSetup.ts`, `src/hooks/sequencer/useSequencerIntegration.ts`, `src/hooks/playback/usePlaybackSimulation.ts`, `src/hooks/ui/useUiStore.ts`, `src/App.tsx`.

**Settings and track view**

Settings gain `sound.dualChip` (default off) and `ui.visibleTracks` (3|6, default 3). Effective channels = `songChannelCount(song)` when `dualChip` enabled, else 3. The tracker renders the visible channel ids; in three-track view of a two-chip song an A-F switcher selects the chip group without touching song data. Playlist columns, track headers, focus order, and keyboard navigation follow the visible set.

Files: `src/types/settings.ts`, `src/utils/settings/settingsState.ts`, `src/utils/settings/settingsYaml.ts`, `src/modals/settings/SettingsModal.tsx`, `src/components/tracker/*`, `src/components/playlist/*`, `src/hooks/ui/*`, `src/hooks/song/useTrackOperations.ts`, `src/hooks/song/usePlaylistOperations.ts`.

**Exports and panels**

Export modal gains a chip-stream selector shown only for ASM/BIN on two-chip songs; `useExportOperations` passes the choice through. `simulateSong` consumers read `registers`/`registers2`: ASM/BIN emit the selected stream, WAV mixes both chips, DUMP shows per-chip registers, EQ shows six meters, and VGM/MOD/MIDI/MAX/DATA take the documented decision (single selected stream where the format carries one register stream; merged tracks where the format is note-level).

Files: `src/modals/export/ExportModal.tsx`, `src/hooks/modal/useExportModal.ts`, `src/hooks/file/useExportOperations.ts`, `src/exports/*.ts`, `src/components/song/DumpPanel.tsx`, `src/components/song/EQPanel.tsx`, `src/utils/export/exportSummary.ts`, `src/utils/export/exportFileNaming.ts`.

**Tests**

Engine-pair creation/routing, six-channel mutes, settings persistence, switcher view projection, playlist columns, export chip selection, per-format dual-chip output, panel data.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, `npm test`, `npm run test:coverage`, `npm run test:e2e`, `npm audit`, `scripts/release-check.sh`
- Manual audio check: two-chip song audible on both engines (internal + Ayumi).

## Audio-Critical Notes

- React render timing: engine creation stays inside the existing effect; the pair lands together so playback never starts on a half-ready pair.
- `useCallback`/`useMemo` deps: `useAudioSetup` gains a chip-count param; `useSequencerIntegration` deps gain the second engine ref.
- Audio state patterns: per-channel refs widen to six; engine refs stay the single write path per chip.
- YM2149/SoundDriver: unchanged - each engine still models one three-channel PSG.
- Manual playback testing required for the dual path on both drivers.
- `SPECIFICATION.md` audio principles apply: mono default stays bit-identical; stereo only when pans leave centre.

## Implementation Order

1. Audio engine pair + sequencer routing
2. Settings + track view + switcher
3. Exports + panels
4. Tests
5. Verification loop
6. Refactoring pair, window review, changelog, bump, release-check, commit

## Refinements

Recorded divergences between the approved plan and the landed implementation:

- **Export modal code-split** - the plan kept every modal eagerly bundled; the
  dual-chip additions pushed the entry chunk over the 600 kB budget, so the
  picker, export, and paste-track modals in `ModalManager` now load through
  `React.lazy` boundaries (the same pattern `SettingsModal` already used).
  Entry chunk: 598.90 kB.
- **MIDI channel clamp** - `engineForYmChannel` clamps out-of-range channel
  indexes into the six-channel space (0-5) before chip routing, preserving the
  previous clamp-into-range contract under the wider channel model.
- **Pan adjustability scope** - interactive stereo/pan editing controls are
  owned by the deferred `reintroduce-stereo-editing-controls` and
  `dual-chip-stereo-configuration` records in the 1.7.0 window. This window
  lands the data path: `song.stereo` resolves six pans, the `dual` layout
  defaults chip 1 left / chip 2 right, and `setChannelPans` propagates pan
  changes to live engines without recreating the audio path.
- **MOD export** - the four-channel ProTracker format cannot carry six
  channels; it exports A-C and reports the dropped second chip via the
  result warning list rather than silently dropping D-F.
- **DUMP export shape** - the single-stream `dc.b` dump emits both chips as
  labelled `music:` and `music2:` sections instead of adding a format
  selector, keeping the dump self-describing.
