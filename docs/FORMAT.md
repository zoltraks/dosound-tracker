# Data Format Reference

This document describes the data formats produced by the following commands:

- `SAVE SONG`
- `SAVE INST`
- `COPY TRACK`
- `EXPORT DATA`
- `EXPORT DUMP`
- `EXPORT BIN`
- `EXPORT MAX`
- `EXPORT VGM`
- `EXPORT WAV`
- `SAVE MIDI CONFIG`

Examples of the YAML formats can be found under:

- `docs/example/song/*.yaml`
- `src/assets/song.yaml`

---

## SAVE SONG

### Output file

- Text format: **YAML**.
- Typical extension: `.yaml`.
- Root key: `song`.
- This is the format consumed by `LOAD SONG` via `parseSongFromYaml`.

### Root structure

```yaml
song:
  title: "Title"           # optional string
  author: "Author"         # optional string
  year: 2025               # optional integer
  speed: 6                 # required, positive integer (clamped and forced even)
  length: 64               # required, pattern length in rows (4..256)
  loop: 0                  # optional, 0-based playlist index
  playlist: [...]          # required list
  pattern: [...]           # required list (or `patterns` alias when loading)
  instrument: [...]        # required list (or `instruments` alias when loading)
```

Loader rules (from `parseSongFromYaml`):

- `title`, `author`: empty or missing → defaults.
- `speed`: invalid or ≤0 → defaults to 6, then clamped to ≥2 and forced even.
- `length`: invalid → defaults to `PATTERN_LENGTH` (64), then clamped to `[4, 256]`.
- `loop`: numeric or numeric string; clamped to `[0, playlist.length-1]`; otherwise `null`.

### Playlist

Shape of each playlist row:

```yaml
song:
  playlist:
    - A: "00"  # pattern ID used for track A
      B: "01"  # pattern ID used for track B
      C: "02"  # pattern ID used for track C
    - A: "03"  # B or C omitted → treated as "--"
```

- `A`, `B`, `C` values should be strings (pattern identifiers such as `"01"`, `"1A"`).
- Loader behaviour:
  - For each entry `e`:
    - `trackA = typeof e.A === 'string' ? e.A : '--'`.
    - Same for `B`/`C`.
  - An empty row (`- {}`) is valid and means all three tracks are `"--"`.

### Patterns list

Each pattern node has:

```yaml
- number: "01"         # pattern ID (string recommended)
  name: "Pattern 01"   # optional
  steps: [...]         # or `lines: [...]`
```

- `number`:
  - If non-empty string → used as pattern ID (uppercased internally).
  - Otherwise loader assigns a hex string ID based on index.
- `name`:
  - Optional; defaults to `"Pattern ${number}"` if missing.
- `steps` / `lines`:
  - List of step objects (see below). Loader accepts both keys; saver always writes `steps`.

### Pattern steps

Each logical row in `trackA` is encoded as a **step** with these fields:

- `note: string` (optional)
  - Note in `C-4` or `C#4` style (dash before octave unless there is `#`).
- `instrument: string` (optional)
  - Instrument number (e.g. `"00"`, `"1A"`), uppercased internally.
- `off: boolean` (optional)
  - `true` → explicit key-release row.
- `space: boolean | number` (optional)
  - `true` → single empty row.
  - integer `N > 0` → run of `N` consecutive empty rows.
- `volume: number | string` (optional)
  - Per-row volume nibble (0..15). Strings may be decimal or hex (optionally with `$` prefix) and are parsed by `parseVolumeNibble`.

Saver (`saveSong`) behaviour for each row:

- No note and no volume → `{ space: true }`.
- No note but volume present → `{ space: 1, volume: V }`.
- Note-off row → `{ note: 'OFF' }`.
- Note row → `{ note: "C-4", instrument: "01", [volume] }`.

Then it:

1. Trims trailing pure-space steps (only `space: true`).
2. Compresses runs:
   - Pure spaces: `space: N`.
   - Volume-only rows with `space: 1` and `volume` set, no other keys:
     - Single row → `{ volume: V }`.
     - Run of N>1 with same V → `{ space: N, volume: V }`.

Loader behaviour:

- Expands compressed runs (both `space: N` and `off: N`, with or without `volume`).
- For each expanded step (up to `length`):
  - `off: true` → internal key-release (`note: '===', octave: 0, instrument: '00'`).
  - `space: true` → empty cell.
  - `note` string → parsed via `parseBaseKey` into `note` + `octave`.
  - `instrument` missing/blank → defaults to `"00"`.
  - `volume` → parsed and clamped to nibble 0..15 if valid.

### Instruments list

Each instrument node has:

```yaml
- number: "00"           # instrument ID (string recommended)
  name: "Bass"           # optional
  base: "C-3"            # optional base key
  octave: 1              # optional, clamped
  sustain: 8             # optional, >=0 integer index
  color: "#abc"          # optional 3-digit hex color
  volume: [ ... ]        # required envelope (trimmed)
  arpeggio: [ ... ]      # optional envelope
  pitch: [ ... ]         # optional envelope
  noise: [ ... ]         # optional envelope
  mode: [ ... ]          # optional envelope
  midi:                  # optional MIDI configuration
    channel: 1           # MIDI channel (1-16)
    program: 0           # MIDI program (0-127)
```

Saver (`saveSong`) rules:

- Always writes `number` and `volume`.
- Writes `name` if non-empty.
- Writes `base` if different from `DEFAULT_BASE_KEY`.
- Writes `octave` if present and not default (clamped to `[MIN_OCTAVE, MAX_OCTAVE]`).
- Writes `arpeggio`, `pitch`, `noise`, `mode` only when their trimmed envelope is not `[]` or `[0]`.
- Writes `sustain` if numeric and `>= 0`.
- Writes `color` if valid 3-digit hex color.
- Writes `midi` if channel or program is set.
- Envelopes are trimmed to remove trailing repetitions of the final value.

Loader (`parseSongFromYaml`) rules:

- `number` interpreted as hex slot index where possible; otherwise index-based fallback.
- `base` parsed via `parseBaseKey` and normalized via `formatBaseKey`.
- `octave` read from number or numeric string, then clamped.
- `volume` / `arpeggio` / `pitch` / `noise` / `mode` expanded to `ENVELOPE_LENGTH` values, padding with the last value.
- `sustain` numeric or numeric string, floored and kept only if `>= 0`.
- `color` normalized to 3-digit hex format.
- `midi` channel/program parsed and clamped to valid MIDI ranges.

---

## SAVE INST

### Output file

- Text format: **YAML**.
- Typical extension: `.yaml`.
- Root key: `instrument`.
- Contains a single instrument definition, structurally similar to one element of `song.instrument`.

### Root structure

```yaml
instrument:
  type: "dosound"        # required format identifier
  version: 1             # required format version
  name: "Lead"           # optional
  base: "C-4"            # optional
  octave: 2              # optional
  sustain: 5             # optional
  color: "#abc"          # optional 3-digit hex color
  volume: [ ... ]        # required envelope
  arpeggio: [ ... ]      # optional envelope
  pitch: [ ... ]         # optional envelope
  noise: [ ... ]         # optional envelope
  mode: [ ... ]          # optional envelope
  midi:                  # optional MIDI configuration
    channel: 1           # MIDI channel (1-16)
    program: 0           # MIDI program (0-127)
```

Behaviour:

- Saver (`saveInstrument`) trims and writes fields with the same rules as `SAVE SONG` instruments, but without `number`.
- Loader (`loadInstrument`) expects root `instrument` and applies the imported parameters to the **currently selected instrument slot**, using the same parsing rules as above.
- Includes `type: "dosound"` and `version: 1` fields for format identification.

---

## COPY TRACK

### Output data

- Text format: **YAML**.
- Destination: **system clipboard** (not a file).
- Root key: `steps`.
- Semantics of each step match the pattern step format used in `SAVE SONG`.

### Clipboard structure

```yaml
steps:
  - note: "C-4"
    instrument: "00"
  - space: 3
  - off: true
  - volume: 12
  - space: 2
    volume: 10
```

Details:

- Export (`handleCopyTrack`):
  - Operates on the currently selected pattern (monotrack data from `trackA`).
  - Builds raw steps exactly like `SAVE SONG` pattern steps (including `space`, `off`, `note`, `instrument`, optional `volume`).
  - Trims trailing pure-space steps.
  - Compresses runs of pure spaces and volume-only rows using the same run-length encoding as `SAVE SONG`.
  - Serializes YAML with root `{ steps: [...] }`.

- Import (`handlePasteTrack`):
  - Expects YAML with root `steps: [...]`.
  - Expands run-length encoded steps (`space: N`, `off: N`, with or without `volume`).
  - For each row up to the current pattern length:
    - `off: true` → internal key-release (`note: '===', octave: 0, instrument: '00'`).
    - `space: true` → empty.
    - `note: string` → parsed via `parseBaseKeyString` into note + octave; instrument defaults to `"00"` if missing.
    - Optional `volume` nibble 0..15.
  - Overwrites the monotrack data (`trackA`) and per-line `volume` for the selected pattern.

---

## EXPORT DATA

### Output file

- Text format: **68k assembly source**.
- Typical extension: `.s`.
- Produced by `exportToAssembly(song, isComplexDumpMode)`.
- Used as DOSOUND-compatible music data (XBIOS DOSOUND format in assembly form).

### Structure

- Starts with label:

  ```asm
  music:

      ; START
  ```

- Body is a sequence of `dc.b` lines, each encoding a set of YM2149 register writes or a delay, e.g.:

  ```asm
      dc.b $07,$38           ; MX T+T+T
      dc.b $09,$0F           ; VB 15
      dc.b $01,$02,$00,$34   ; TA C-4
      dc.b $FF,$01           ; DL 2  (delay in frames)
  ```

- Comments describe the logical meaning (mixer, tone period, volume, delay, etc.).
- In **simple dump** mode, all relevant registers are written every frame.
- In **complex dump** mode, unchanged registers are skipped for compactness.
- Ends with lines that silence all channels and a STOP marker, for example:

  ```asm
      ; END

      dc.b $08,$00           ; VA 0
      dc.b $09,$00           ; VB 0
      dc.b $0A,$00           ; VC 0

      dc.b $FF,$00           ; STOP
  ```

---

## EXPORT DUMP

### Output file

- Text format: **68k assembly source**.
- Typical extension: `_dump.s`.
- Produced by `exportSongRegisterDump(song)`.

### Structure

- Label and header:

  ```asm
  music:
  ```

- For each simulated tick at DOSOUND timing, writes one `dc.b` line containing the full set of registers relevant to playback, in fixed order:

  ```asm
      dc.b $taFine,$taCoarse,$tbFine,$tbCoarse,$tcFine,$tcCoarse,$ns,$mx,$va,$vb,$vc
  ```

  where each placeholder is a byte value for the corresponding YM2149 register.

- No optimisation: every logical frame produces one line.
- The dump is intended for debugging/analysis of the raw register stream rather than for compact inclusion.

---

## EXPORT BIN

### Output file

- Binary format: **raw DOSOUND data bytes**.
- Typical extension: `.bin`.
- Produced by `exportToBinary(song, isComplexDumpMode)`.

### Structure

- Implementation: `exportToBinary` calls `exportToAssembly` (same content as `EXPORT DATA`), then `parseAssemblyToBinary`.
- `parseAssemblyToBinary`:
  - Scans each line for `dc.b`.
  - Extracts each `$XX` token, parses as hex, and appends the low 8 bits as one byte.
- The resulting `Uint8Array` is exactly the concatenation of all DOSOUND command bytes emitted in the assembly export.

---

## EXPORT MAX

### Output file

- Binary format: **MAX** (Music Assembly eXchange), specification v1.6.
- Typical extension: `.max`.
- Produced by `exportSongToMax(song, strategy)` or `exportInstrumentToMax(instrument, song, strategy)`.
- Contains ZX0-compressed YM2149 register streams with metadata.

### Structure

- File header: magic `"MAX "` (4 bytes).
- Version chunk: `'V'` + size + version number (currently 1).
- Optional info chunk: `'I'` + metadata (title, author, year).
- Chip definition chunk: `'C'` + YM2149 chip id (`A9`), panning, VBlank rate (50 Hz), and clock speed (2 MHz).
- Stream definition chunk: `'S'` + stream format, compression byte, 3-byte uncompressed stream size, and optional frame size.
- Data chunk: `'d'` + ZX0-compressed register stream.

### Frame capture

The export calls `simulateSong` directly and captures one register snapshot per VBLANK tick (50 Hz, 20 ms per frame). All 14 YM2149 registers (R0–R13) are included in every snapshot. Registers R11–R13 (envelope period and shape) default to 0 because the simulation does not yet model the hardware envelope generator.

### Export strategies

Each strategy selects a stream format. All strategies apply ZX0 compression with a 1024-byte ring-buffer window (`maxOffset: 1023`) before writing the data chunk.

- **Simple**: RAW8 stream format (`0x08`). Flat dump of all 14 register values per frame, with no delimiters or differencing. The stream definition chunk includes a frame size of 14.
- **Complex**: REG7 stream format (`0x07`). Differential format that writes only registers whose values changed since the previous frame, followed by a single-byte frame delimiter. The stream definition chunk omits the frame size field.
- **Optimized**: REG7 stream format (`0x07`) with delay optimization. Consecutive frame delimiters are coalesced into the minimal set of `0x80`–`0xFF` bytes, with runs longer than 128 frames split across multiple delimiters.

### REG7 frame delimiter encoding

The REG7 format uses a single delimiter byte with the high bit set:

| Value   | Meaning                        |
|---------|--------------------------------|
| `$80`   | End of frame, 1 frame delay    |
| `$81`   | End of frame, 2 frames delay   |
| `$FF`   | End of frame, 128 frames delay |

The low 7 bits encode `delay - 1`. Delays exceeding 128 frames are split across multiple consecutive delimiter bytes.

### ZX0 compression

The uncompressed stream is compressed with the ZX0 v2 optimal parser (Einar Saukas, BSD 3-Clause) ported in `src/utils/zx0.ts`. The `maxOffset` parameter is set to 1023, constraining back-references to the 1024-byte ring-buffer window expected by hardware MAX players. The stream definition chunk records compression byte `0x08` and the uncompressed stream size as a 3-byte big-endian integer.

### Instrument export

- Creates a preview song with a single pattern containing the instrument's base note.
- Exports using the same MAX format as song export.

---

## EXPORT VGM

### Output file

- Binary format: **VGM** (Video Game Music) file.
- Typical extension: `.vgm`.
- Produced by `exportSongToVgm(song)`.

### Structure

- Fixed-size VGM header (0x100 bytes):
  - Signature `"Vgm "` at bytes 0–3.
  - EOF offset at 0x04.
  - Version 0x00000171 at 0x08.
  - Total sample count at 0x18.
  - Optional loop offset at 0x1C and loop sample count at 0x20.
  - VBlank rate at 0x24.
  - Data offset (relative) at 0x34.
  - YM clock at 0x74.
- Data block starts at offset 0x100 and is a stream of commands:
  - `0xA0, reg, value` → AY/YM register write.
  - `0x63` → wait for 1/50 s (882 samples at 44100 Hz).
  - `0x66` → end of data.
- Optional GD3 tag at end of file with metadata (title, author, year).

### Song mapping

- The exporter simulates playback over playlist, patterns, and envelopes similarly to the DOSOUND export.
- For each relevant frame, it:
  - Updates an internal register map (`regs`).
  - Writes `0xA0` commands only for registers whose value changed since the last frame (based on a small set of relevant registers).
  - Writes one `0x63` wait command per simulated tick.
- Loop handling:
  - If `song.loop` is set and within playlist bounds, the exporter records:
    - The command offset where the loop begins.
    - The sample offset at that point.
  - These values are encoded into `loop offset` and `loop sample` fields in the header.

This document does not attempt to fully describe the VGM specification; it documents only how this tracker maps its internal song representation into a VGM file.

---

## EXPORT WAV

### Output file

- Binary format: **RIFF/WAVE**.
- Typical extension: `.wav`.
- Produced by `exportSongToWav(song)`.

### Header

The exporter builds a standard PCM 16‑bit, mono WAV header using:

- Sample rate: `44100 Hz`.
- Channels: `1` (mono).
- Bit depth: `16`.
- Byte rate: `sampleRate * 2`.
- Standard `RIFF` and `fmt`/`data` chunks.

### Sample data

- Playback is simulated over playlist and patterns using the same YM2149 envelopes used for export and live playback.
- For each DOSOUND tick:
  - It updates YM2149 registers via `applyInstrumentToRegisters`.
  - It generates `samplesPerTick` PCM samples at 44100 Hz using `synthTickSamples`, taking into account:
    - Tone periods and volumes for channels A/B/C.
    - Noise generator state.
    - Mixer (tone/noise enable per channel).
- Samples are clamped to [-1, 1] and written as signed 16-bit values.

The resulting WAV file is suitable for direct playback in standard audio players and provides a rendered version of the tracker song.

---

## MIDI CONFIGURATION

### Output file

- Text format: **YAML**.
- Typical extension: `.yaml`.
- Root key: `midi`.
- Contains MIDI input/output configuration settings.

### Root structure

```yaml
midi:
  version: 1             # format version
  input:                  # MIDI input configuration
    enable: true          # enable MIDI input
    agnostic: false       # ignore input volume
    device: "device-id"   # optional device identifier
  output:                 # MIDI output configuration
    enable: true          # enable MIDI output
    agnostic: false       # ignore output volume
    device: "device-id"   # optional device identifier
```

### Behaviour

- Saver (`buildMidiConfigYaml`) writes the current MIDI configuration with boolean flags and optional device identifiers.
- Loader (`parseMidiConfigFromYaml`) parses the YAML and applies settings to the current configuration.
- Boolean values can be specified as `true`/`false`, `yes`/`no`, `y`/`n`, `1`/`0`, or numeric values.
- Device identifiers are optional strings that identify specific MIDI devices.
- The `agnostic` flag determines whether volume information should be ignored when processing MIDI events.
