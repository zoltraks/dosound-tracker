# Drive two sound engines with per-chip configuration and panning

**Type:** Feature

**Blocked by:** `docs/change/1.6.4/dual-chip-song-data.md` - needs the six-channel song model and per-chip playback simulation.

## Summary

| Field         | Value                                                                                                                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Playback and preview sound for two-chip songs: two `SoundEngine` instances (internal YM2149 and Ayumi paths) driven from the six-channel simulation, each with its own clock, chip variant, and pan settings.                            |
| Key decisions | One engine instance per chip; channels A-C route to chip 1, D-F to chip 2. Default stereo placement puts chip 1 left and chip 2 right, adjustable through the sound and panning options. Both engine drivers must support the dual path. |
| Open risks    | `useAudioSetup` currently owns a single engine ref, waiter list, and test tone; sequencing, mute state, and preview paths all assume one engine. The Ayumi worklet path may need per-instance node handling.                             |

## Description

Today `useAudioSetup` creates exactly one `SoundEngine` (internal `YM2149` or `AyumiEngine` per the engine setting), applies one clock/chip/pan triple, and exposes it through `ym2149Ref`, `ym2149`, and `waitForEngine`. The sequencer writes channel 0-2 to that engine.

This change makes the audio layer chip-aware:

- A two-chip song runs two engine instances - one per chip - each constructed through the same `createSoundEngine` factory so both the internal YM2149 and Ayumi drivers are supported.
- Each engine receives its own clock, chip variant, and pan configuration resolved from the song's six-channel stereo model. The default dual-chip placement puts chip 1 on the left and chip 2 on the right; users can adjust the placement through the sound and panning options.
- Channel-to-engine routing follows the song model: channels A-C drive chip 1's three channels, D-F drive chip 2's three channels.
- Channel mutes extend to six channels; muting applies to the owning engine's channel.
- Engine lifecycle (creation, disposal, `waitForEngine`, test tone, user-gesture resume) works for the pair: a two-chip song never starts playback before both engines are ready, and teardown silences and disposes both.
- Single-chip songs keep exactly one engine and identical behaviour.

## Use Cases

- When a two-chip song plays, both chips sound simultaneously with chip 1 panned left and chip 2 panned right by default.
- When the user adjusts the panning options, the change reaches the live engines without recreating the audio path.
- When the sound engine setting switches between internal and Ayumi, both chip instances follow the selected driver.
- When a two-chip song stops or the app closes, both engines are silenced and disposed.

## Hints

- `src/hooks/audio/useAudioSetup.ts` owns engine creation, refs, waiters, and the test tone; `src/synth/soundEngine.ts` is the factory both drivers pass through.
- `src/hooks/song/useChannelPans.ts` and `src/utils/song/songStereo.ts` resolve pans; `src/utils/playback/playbackSimulation.ts` produces the per-chip register streams this record consumes.
- The sequencer and playback hooks (`src/hooks/sequencer/`, `src/hooks/playback/`) write engine registers per channel - they need the channel-to-chip routing.
- `src/components/song/EQPanel.tsx` and `DumpPanel.tsx` read live engine state; they are updated by the exports/panels record, not this one.

## Out of Scope

- Settings and song-UI controls that enable two chips or pick the visible track count - a later record.
- Export formats and the export modal's chip selection - a later record.
- DUMP and EQ panel presentation for two chips - a later record.
- Per-chip instrument tables.
