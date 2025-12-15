# Refactoring Assessment Report - Version 1.2.2 (Gemini Merge)

## Context

This assessment reviews the refactoring implementation chosen for merge from the `refactoring/1.2.2-gemini` branch, based on the proposal in `REFACTORING.md` and the comparison in `COMPARISATION.md`.

Primary goal of the refactoring: reduce file sizes and improve separation of concerns **without modifying core sound generation behavior**, preserving YM2149 behavior, timing requirements (20ms/40ms), and YAML compatibility.

## Executive Summary

- The Gemini merge substantially improves modularity by extracting playback state, sequencer integration, offline export simulation, MIDI concerns, and track utilities into dedicated modules.
- The change is not purely mechanical: it introduces a more explicit and shared model for playback simulation (offline exports) and playback semantics (real-time sequencer path). This is good for long-term maintainability, but increases risk of subtle behavioral changes.
- Highest-risk area is the **new shared playback simulation** (`simulateSong`) because it becomes an authoritative source for multiple exporters.
- A concrete functional incompatibility was identified in instrument YAML IO: **instrument export writes `noise`, but instrument import reads `noiseEnvelope`**, which can break round-trip persistence of noise envelopes.

## What Changed (Concrete Scope)

### 1) Export simulation extraction (Phase 1)

- Added `src/utils/playbackSimulation.ts` providing:
  - `simulateSong(song, callback, options)`
  - `applyInstrumentToRegisters(...)`
  - `SimulationFrame` including `registers`, playlist/pattern indices, and additional metadata.
- `src/exports/core.ts` now relies on `simulateSong()` instead of maintaining its own duplicated simulation logic.

Notable enhancements present in the merged implementation:
- `toneMeta` captured per channel per frame (`note`, `octave`, `pitchDelta`) to improve assembly comments.
- `retriggerBehavior` option (`'always' | 'new_note_only'`).

### 2) Playback logic extraction from UI (Phase 4 partial)

- Added `src/hooks/usePlaybackSimulation.ts`:
  - Centralizes refs used for playback state (envelope steps, sustain/release flags, per-channel volume modifiers).
  - Provides `resetPlaybackState()` that silences YM2149 and sends MIDI note-offs.
- Added `src/hooks/useSequencerIntegration.ts`:
  - Houses the core sequencer callback previously embedded in `App.tsx`.
- Added `src/utils/playbackUtils.ts`:
  - Shared helpers: `normalizeInstrumentId` and `updateChannelWithInstrument`.
- `src/App.tsx` now composes these hooks instead of inlining playback logic.

### 3) MIDI modularization (Phase 2)

- `src/hooks/useMidi.ts` reduced to a coordinator hook.
- Added:
  - `src/hooks/useMidiDeviceManagement.ts` (device enumeration, MIDIAccess lifecycle)
  - `src/hooks/useMidiMessageProcessing.ts` (monitoring, message parsing, output sending)

### 4) Track operation utilities (Phase 3)

- `src/hooks/useTrackOperations.ts` delegates to:
  - `src/utils/trackClipboard.ts`
  - `src/utils/transposeUtils.ts`
  - `src/utils/patternUtils.ts`

### 5) Additional files beyond the proposal

- Added IO utilities and integrated them into `src/hooks/useDataManagement.ts`:
  - `src/utils/songIO.ts` (`buildSongYamlForExport`)
  - `src/utils/instrumentIO.ts` (`buildInstrumentYamlForExport`, `parseInstrumentFromText`)

These go beyond the proposal’s phases 1–4, and introduce a more formal YAML export schema.

## Behavioral / Compatibility Assessment

### A) Playback semantics: handling of `--` tracks (potential behavior change)

Both the offline exporter (`simulateSong`) and the real-time sequencer integration (`useSequencerIntegration`) contain logic that treats a missing pattern assignment (`"--"`) as a **no-op**:

- Notes can **continue sustaining across playlist positions** where a channel has no pattern.

This is musically sensible, but it must be confirmed as canonical behavior for DOSOUND Tracker. If pre-refactor behavior forced a rest/mute when a track is `--`, exports and playback will diverge.

Risk level: **Medium** (depends on historical expectations).

### B) Note-off semantics (`===`) and sustain/release (behavioral clarification)

The new simulation and sequencer path treat `===` as:

- **Hard mute** if there is no sustain defined (or no active note).
- **Release trigger** if sustain exists and a note is active:
  - Hold envelope at sustain step while key is held.
  - On release, allow envelope to advance beyond sustain.

Risk level: **Medium** (changes audible behavior only if sustain was previously not modeled this way).

### C) Export outputs: comment and formatting differences (expected)

`core.ts` now uses `toneMeta` for more precise comments, which will cause differences in assembly output text even if register writes are equivalent.

In optimized modes, additional differences may occur due to:
- skipping tone register writes on fully silent channels
- forcing tone regs to re-emit after playlist boundary markers by clearing cached R0–R5

Risk level: **Low for audio correctness**, **Low/Medium for golden-file diff workflows**.

### D) YAML formats: internal consistency is good, external compatibility must be verified

The exported YAML schema in `songIO.ts` uses:
- Playlist keys `A/B/C` (instead of `trackA/trackB/trackC`).
- Pattern list key `pattern` and step key `step`.
- Note-off encoded as `note: "OFF"`.
- Space and volume compression (e.g. `space: 3`, `space: 3, volume: 14`, or `volume: 14`).

The parser (`src/utils/songParser.ts`) already supports these forms, including compressed runs.

Risk level: **Low internally**, **Medium externally** if users/tools expect legacy YAML shapes.

### E) Instrument YAML IO mismatch (probable bug)

In `instrumentIO.ts`:
- Export writes `noise`.
- Import expands envelopes from `noiseEnvelope`.

This likely breaks instrument round-trip for noise envelopes (export → re-import loses the noise envelope).

Risk level: **High**.

Recommended fix:
- Accept both `noise` and `noiseEnvelope` as input keys, mapping either to `noiseEnvelope`.
  - This is backwards compatible and doesn’t require changing the export schema.

### F) Track clipboard/step utilities: semantics to confirm

Potential behavior changes to verify:
- Clipboard **replace** mode appears to clear `volume` when clipboard steps are missing.
- `insertPatternStep` / `deletePatternStep` shift only `trackA`, not other properties (including any per-line volume), per documented intent in code.

Risk level: **Medium** (UX-visible, but localized).

## Risk Matrix

- **High**
  - Instrument import/export noise envelope key mismatch (`noise` vs `noiseEnvelope`).

- **Medium**
  - `--` sustain/no-op semantics across playlist positions.
  - Sustain/release modeling on `===`.
  - Track clipboard replace semantics / volume behavior.

- **Low**
  - MIDI split (mostly structural, verify device lifecycle and event listeners).
  - Assembly comment differences due to `toneMeta`.

## Recommendations

1. Fix instrument YAML import to correctly read the exported noise envelope key.
2. Decide and document the canonical meaning of `--` for playback/export:
   - sustain/no-op vs force rest/mute.
3. Define export equivalence criteria for regression tests:
   - Prefer comparing register streams rather than full text output (comments/whitespace will differ).
4. Add/extend regression tests for:
   - sustain instruments + `===` release
   - `--` playlist slots
   - per-line volume modifiers
   - clipboard paste modes

## Verification Checklist

### Exports
- Assembly export: verify playback correctness and expected register progression.
- Check representative songs with:
  - sustain instruments
  - frequent note-offs (`===`)
  - repeated notes
  - playlist entries with `--`
  - per-row volume changes

### Real-time Playback
- Start/stop behavior:
  - YM2149 silence on stop
  - MIDI Note Off emitted for active channels
- Pattern wrap/loop behavior:
  - no stuck notes
  - envelope timing remains consistent (40ms stepping)

### MIDI
- Device hotplug while monitors enabled.
- Switching input/output IDs repeatedly.
- Output behavior in Electron vs non-Electron environment (system reset behavior).

### Track Editing
- Copy/paste track data with:
  - compressed spaces
  - volume-only steps
  - OFF steps
- Insert/delete step correctness at boundaries (first/last line).
- Transpose with different scope combinations.

## Notes

This assessment intentionally focuses on behavioral risk and compatibility. Pure file-size reduction goals appear satisfied per the comparison report, but correctness should be validated using the checklist above.
