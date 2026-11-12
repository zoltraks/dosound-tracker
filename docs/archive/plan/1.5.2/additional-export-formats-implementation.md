# Add Export Formats Implementation Plan

## Summary

| Field         | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| Intent        | Add ProTracker MOD and Standard MIDI File exports to the pipeline;   |
|               | Impulse Tracker IT is deferred per the record's evaluation           |
| Key decisions | MOD renders the simulated register stream at row granularity through |
|               | two generated samples; MIDI walks the pattern data at note level;    |
|               | both carry a `warnings` list surfaced in the export summary          |
| Open risks    | MOD packs playlist rows contiguously into 64-row patterns, so the    |
|               | module's order boundary differs from the playlist's - recorded, not  |
|               | silent                                                               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.2/additional-export-formats.md`.

## Analysis

The export pipeline holds six formats today: DATA (assembly), DUMP, BIN,
VGM, MAX, and WAV. Each format lives in one module under `src/exports/`,
consumes the song normalized by `normalizeSongForExport` in
`src/exports/core.ts`, and reaches the user through the export modal's
per-format buttons wired `ExportModal` -> `ModalManager` ->
`useAppModals` -> `useExportModal` -> `useFileOperations`. All modules
load through the single `src/exports/export.ts` barrel as one lazy chunk.

Three candidates were evaluated against the format specifications.

- **ProTracker MOD** - ships. A MOD is a 20-byte title, 31 sample
  records, an order list, the `M.K.` tag, 64-row patterns, and signed
  8-bit sample data. The register stream from `simulateSong` already
  carries per-tick tone periods, mixer state, and volumes, so a
  row-granularity render (one MOD cell per channel per row) is honest
  and compact. Instruments reduce to two generated samples - a
  32-byte square wave for tone and a 512-byte deterministic noise
  block for noise - because the MOD sample model cannot carry the
  envelope engines. Losses are intra-row envelope movement, notes
  outside the Amiga period range, timbre detail, and the unused
  fourth channel.
- **Impulse Tracker IT** - deferred. The IT instrument model adds
  volume-envelope nodes - the only fidelity gain over MOD - while
  shift, pitch, noise, and mode envelopes still have no
  representation. The format surface (554-byte instrument headers,
  envelope nodes, packed pattern encoding, parapointer tables) is the
  largest of the three candidates and is not justified by that gain.
  It returns through its own change record.
- **MIDI** - ships. The song's note events map onto SMF type 1
  note-on/note-off pairs, `instrument.midi` supplies channel and
  program, and the volume column carries velocity plus CC7. Envelope,
  noise, pitch, and sustain semantics have no MIDI representation and
  are reported as dropped rather than guessed.

Both shipped formats produce deterministic bytes - no timestamps, no
random data - and report losses through a `warnings` array on the
export result, printed into the export summary the way the WAV
zero-sample warning already works.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Props interface named with `Props` suffix
- No abbreviations in identifiers (use full words)
- Keep components focused on single responsibility

## Audio-Critical Requirements

- The change touches no audio path. Export modules are pure data
  transforms invoked on demand through the lazy export chunk.
- `useFileOperations` and `useExportModal` gain new `useCallback`
  handlers alongside the existing ones - no dependency arrays of
  existing callbacks change, no state pattern changes.
- Playback timing is untouched; the YM2149 emulator and the
  simulation keep their current behavior.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

- `PROJECT.md` - F-08 export list and the goals line gain MOD and MIDI.
- `ARCHITECTURE.md` - the exports module boundary and the export
  pipeline list gain `midi.ts` and `mod.ts`.
- `SPECIFICATION.md` - the Export Formats section describes eight
  formats and gains the MOD and MIDI mapping rules.
- `FORMAT.md` - the command list and body gain `EXPORT MOD` and
  `EXPORT MID` sections documenting the emitted layout and the
  reported losses.
- `TESTING.md` - the unit-test bullet and the e2e flow list gain the
  new export coverage.
- `COPYRIGHTS.md` - a format-provenance note records that both
  exporters are original code written against public format
  documentation.

## Type and State Updates

**Type definitions**

No shared types change. Each new module declares its own result
interface following `VgmExportResult`.

```typescript
export interface MidiExportResult {
  buffer: ArrayBuffer;
  warnings: string[];
}

export interface ModExportResult {
  buffer: ArrayBuffer;
  warnings: string[];
}
```

**State store modifications**

None. Export results stay inside `useFileOperations`' summary state.

## Step by Step Implementation

**Add the MIDI exporter**

New self-contained module emitting a Standard MIDI File type 1.

File to create: `src/exports/midi.ts`.

```typescript
const MIDI_TICKS_PER_ROW = 24;
const MIDI_DIVISION = 96; // ticks per quarter note
```

`exportSongToMidi(song)` normalizes via `normalizeSongForExport`,
walks `song.line`/`song.pattern` directly, and emits one SMF track per
tracker channel plus a conductor track. Timing rules:

- One tracker row equals `MIDI_TICKS_PER_ROW` (24) MIDI ticks, a
  sixteenth note at division 96.
- The tempo meta event carries `round(4 * speed * 1e6 / frame)` µs per
  quarter, clamped to `0xFFFFFF` (speed 6 at 50 Hz gives 480000,
  125 BPM; at 60 Hz gives 400000, 150 BPM).

Event rules per channel:

- A step note emits note-on (status `0x9n`, velocity from the row's
  volume column, `max(1, round(v * 127 / 15))`, default `v = 15`) and
  closes the channel's held note at the same tick.
- A release row (`note === '==='`) emits a note-off (`0x9n` with
  velocity 0) for the held note.
- A playlist position whose slot is a real pattern cuts the held note
  at its first row; `--` slots let it sustain, matching
  `simulateSong`.
- MIDI note number is `(octave + 1) * 12 + NOTES.indexOf(note)`,
  clamped to 0..127 with a recorded warning.
- The MIDI channel is `instrument.midi.channel - 1` when that value is
  a valid 1..16, otherwise the tracker channel index.
- `instrument.midi.program` (0..127) emits a program change on first
  use per MIDI channel.
- Volume-column changes on a held note emit CC7
  (`round(v * 127 / 15)`).

The conductor track carries the tempo and a 4/4 time signature. Track
chunks sort events by tick with a fixed same-tick order (program
change, CC, note-off, note-on) and use standard variable-length delta
times. `exportInstrumentToMidi` reuses `exportInstrumentWith`.
`downloadMidiFile` wraps `downloadFile` with `.mid`.

Warnings recorded on the result: envelope/pitch/noise/mode data
dropped, sustain and release exported as plain note-offs, notes
clamped to the MIDI range (only when it occurs), and stereo/chip
metadata not carried.

**Add the MOD exporter**

New self-contained module emitting a ProTracker 31-sample module.

File to create: `src/exports/mod.ts`.

```typescript
const MOD_ROWS_PER_PATTERN = 64;
const MOD_AMIGA_CLOCK = 7093789.2;
const MOD_SAMPLE_CYCLE = 32; // one square-wave cycle in bytes
const MOD_PERIOD_TABLE = [856, 808, /* ... 36 entries ... */ 113];
```

`exportSongToMod(song)` normalizes the song, runs `simulateSong` with
the song's chip clock, and keeps the frames with `tick === 0` - one
row snapshot per tracker row, exactly MOD row granularity.

Structure:

- Title field: `song.title` truncated to 20 bytes, NUL padded.
- Sample records: slot 1 `DSND SQUARE` (32 bytes = 16 words, loop
  0/16 words, volume 64), slot 2 `DSND NOISE` (512 bytes = 256 words,
  loop 0/256, volume 64), slots 3-31 empty.
- Song length byte: number of MOD patterns used, `ceil(totalRows /
64)`, truncated at 128 with a warning.
- Restart byte: `floor(loopPlaylistIndex * songLength / 64)` when
  `song.loop` resolves, `0x7F` otherwise - MOD has no play-once mode.
- Order list: pattern index per position, zero padded to 128.
- `M.K.` tag at offset 1080, patterns from 1084, samples last.
- Row packing: the global row stream (`frame.lineIndex`) packs
  contiguously into 64-row patterns - no per-position padding, which
  would alter the song's timing.

Cell rules per channel (A, B, C -> MOD channels 1-3; channel 4 stays
empty):

- Note event: sample = 2 when the row's mixer leaves the channel
  noise-only, else 1; period = YM tone period converted through
  `modPeriod = MOD_AMIGA_CLOCK / (64 * freq)` with
  `freq = clock / (16 * ymPeriod)`, snapped to the nearest
  `MOD_PERIOD_TABLE` entry (the 32-byte square loop makes the named
  period sound at the note's frequency); out-of-range frequencies
  clamp to the table ends with one recorded warning. Noise rows use
  period 428.
- Release row (`'==='`): effect `EC0` (note cut), no note.
- Every row: `Cxx` set-volume from `regs[0x08 + ch] & 0x0F` scaled
  `round(v * 64 / 15)` - on note rows always, on held rows only when
  the value changed.
- Channel D, the always-empty fourth MOD channel, carries the `F`
  effects: row 0 sets the tick speed (clamped to 31 with a
  warning), row 1 sets the BPM `min(255, round(frame * 2.5))` (125
  at 50 Hz, 150 at 60 Hz). Channel D never holds notes, so the
  effects never displace a `Cxx` volume.

Sample data: slot 1 is one square cycle (16 bytes `0x40`, 16 bytes
`0xC0`); slot 2 is 512 bytes from a fixed-seed 17-bit LFSR mapped to
signed bytes - deterministic by construction.

`exportInstrumentToMod` reuses `exportInstrumentWith`.
`downloadModFile` wraps `downloadFile` with `.mod`.

Warnings recorded on the result: two generated samples approximate
all instruments, intra-row envelope movement dropped, out-of-range
periods clamped (only when it occurs), positions truncated (only when
it occurs), fourth channel and metadata not carried.

**Join the export barrel**

Files to modify: `src/exports/export.ts`.

```typescript
export * from './midi.ts';
export * from './mod.ts';
```

Both modules join the single lazy `export.js` chunk - no wiring
changes needed beyond the barrel.

**Wire the file-operations handlers**

File to modify: `src/hooks/file/useFileOperations.ts`.

Add `exportMidiWithContext` and `exportModWithContext` following the
`exportVgmWithContext` shape: instrument scope calls
`exportInstrumentToMidi`/`exportInstrumentToMod`, pattern scope uses
`getScopedSongForPattern`, the filename base comes from the existing
`exportFileNaming` helpers with `.mid`/`.mod`, and the summary lists
file name, scope, and every entry of `result.warnings`.

**Wire the export modal handlers**

Files to modify: `src/hooks/modal/useExportModal.ts`, `src/components/ModalManager.tsx`, `src/hooks/modal/useAppModals.tsx`, `src/App.tsx`.

Add `exportMidiWithContext`/`exportModWithContext` to
`UseExportModalParams`, emit `handleExportMidiFromModal`/
`handleExportModFromModal`, and pass the pair through the
`useAppModals` parameter object into `ModalManager` props
`onExportMidiFromModal`/`onExportModFromModal`, and `App.tsx` destructures and forwards both context exporters and both modal
handlers.

**Add the format buttons**

File to modify: `src/modals/ExportModal.tsx`.

Add `onExportMod` and `onExportMidi` props and MOD / MID buttons. The
format grid becomes `repeat(4, minmax(0, 1fr))` so the eight buttons
sit in two rows of four: DATA, DUMP, BIN, VGM, MAX, WAV, MOD, MID.

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation
2. Add `src/exports/midi.ts`
3. Add `src/exports/mod.ts`
4. Join the export barrel
5. Wire `useFileOperations`, `useExportModal`, `ModalManager`,
   `useAppModals`, `App.tsx`, and `ExportModal`
6. Add or update tests
7. Run verification loop

## Testing Strategy

**Unit tests**

Test file to create: `test/exports/exportMidi.test.ts`.

- `MThd` magic, format 1, division 96, correct track count.
- Tempo meta equals 480000 µs for a 6-speed 50 Hz song, 400000 for
  60 Hz.
- Note-on/note-off pairs appear with 24-tick row spacing; `--` slots
  sustain held notes; `'==='` rows emit note-offs.
- Program change emitted from `instrument.midi`; channel override
  honored.
- Byte-identical output across two runs; warnings array populated.

Test file to create: `test/exports/exportMod.test.ts`.

- `M.K.` tag at 1080, order length, pattern count `ceil(rows/64)`.
- Sample headers: two named samples with looped lengths, 29 empty.
- Note cells decode period + sample + `Cxx`; `EC0` on release rows;
  `F` speed/BPM effects on channel D rows 0 and 1.
- Byte-identical output across two runs; warnings array populated.

**Integration tests**

- `e2e/smoke.spec.ts` - one flow per format: open the export modal,
  download MID and MOD, assert `.mid`/`.mod` filenames and `MThd` /
  `M.K.` magic - mirroring the existing VGM and MAX flows.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Run `npm run test:e2e` for the export-dialog flows
