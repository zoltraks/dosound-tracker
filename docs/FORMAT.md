# Data Format Reference

This document describes the data formats produced by the following commands:

1. `SAVE SONG`
2. `SAVE INST`
3. `COPY TRACK`
4. `EXPORT DATA`
5. `EXPORT DUMP`
6. `EXPORT BIN`
7. `EXPORT VGM` (simplified)
8. `EXPORT WAV` (simplified)

Examples of the YAML formats can be found under:

- `docs/example/song/*.yaml`
- `src/assets/song.yaml`

---

## 1. SAVE SONG

### 1.1 Output file

- Text format: **YAML**.
- Typical extension: `.yaml`.
- Root key: `song`.
- This is the format consumed by `LOAD SONG` via `parseSongFromYaml`.

### 1.2 Root structure

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

### 1.3 Playlist

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

### 1.4 Patterns list (`pattern` / `patterns`)

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

### 1.5 Pattern steps

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
- Note-off row → `{ off: true, [volume] }`.
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

### 1.6 Instruments list (`instrument` / `instruments`)

Each instrument node has:

```yaml
- name: "Bass"           # optional
  base: "C-3"            # optional base key
  octave: 1              # optional, clamped
  sustain: 8             # optional, >=0 integer index
  volume: [ ... ]        # required envelope (trimmed)
  arpeggio: [ ... ]      # optional envelope
  pitch: [ ... ]         # optional envelope
  noise: [ ... ]         # optional envelope
  mode: [ ... ]          # optional envelope
```

Saver (`saveSong`) rules:

- Always writes `number` and `volume`.
- Writes `name` if non-empty.
- Writes `base` if different from `DEFAULT_BASE_KEY`.
- Writes `octave` if present and not default (clamped to `[MIN_OCTAVE, MAX_OCTAVE]`).
- Writes `arpeggio`, `pitch`, `noise`, `mode` only when their trimmed envelope is not `[]` or `[0]`.
- Writes `sustain` if numeric and `>= 0`.
- Envelopes are trimmed to remove trailing repetitions of the final value.

Loader (`parseSongFromYaml`) rules:

- `number` interpreted as hex slot index where possible; otherwise index-based fallback.
- `base` parsed via `parseBaseKey` and normalized via `formatBaseKey`.
- `octave` read from number or numeric string, then clamped.
- `volume` / `arpeggio` / `pitch` / `noise` / `mode` expanded to `ENVELOPE_LENGTH` values, padding with the last value.
- `sustain` numeric or numeric string, floored and kept only if `>= 0`.

---

## 2. SAVE INST

### 2.1 Output file

- Text format: **YAML**.
- Typical extension: `.yaml`.
- Root key: `instrument`.
- Contains a single instrument definition, structurally similar to one element of `song.instrument`.

### 2.2 Root structure

```yaml
instrument:
  name: "Lead"
  base: "C-4"        # optional
  octave: 2          # optional
  sustain: 5         # optional
  volume: [ ... ]    # required envelope
  arpeggio: [ ... ]  # optional envelope
  pitch: [ ... ]     # optional envelope
  noise: [ ... ]     # optional envelope
  mode: [ ... ]      # optional envelope
```

Behaviour:

- Saver (`saveInstrument`) trims and writes fields with the same rules as `SAVE SONG` instruments, but without `number`.
- Loader (`loadInstrument`) expects root `instrument` and applies the imported parameters to the **currently selected instrument slot**, using the same parsing rules as above.

---

## 3. COPY TRACK

### 3.1 Output data

- Text format: **YAML**.
- Destination: **system clipboard** (not a file).
- Root key: `steps`.
- Semantics of each step match the pattern step format used in `SAVE SONG`.

### 3.2 Clipboard structure

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

## 4. EXPORT DATA

### 4.1 Output file

- Text format: **68k assembly source**.
- Typical extension: `.s`.
- Produced by `exportToAssembly(song, isComplexDumpMode)`.
- Used as DOSOUND-compatible music data (XBIOS DOSOUND format in assembly form).

### 4.2 Structure (high level)

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

## 5. EXPORT DUMP

### 5.1 Output file

- Text format: **68k assembly source**.
- Typical extension: `_dump.s`.
- Produced by `exportSongRegisterDump(song)`.

### 5.2 Structure (high level)

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

## 6. EXPORT BIN

### 6.1 Output file

- Binary format: **raw DOSOUND data bytes**.
- Typical extension: `.bin`.
- Produced by `exportToBinary(song, isComplexDumpMode)`.

### 6.2 Structure

- Implementation: `exportToBinary` calls `exportToAssembly` (same content as `EXPORT DATA`), then `parseAssemblyToBinary`.
- `parseAssemblyToBinary`:
  - Scans each line for `dc.b`.
  - Extracts each `$XX` token, parses as hex, and appends the low 8 bits as one byte.
- The resulting `Uint8Array` is exactly the concatenation of all DOSOUND command bytes emitted in the assembly export.

---

## 7. EXPORT VGM (simplified)

### 7.1 Output file

- Binary format: **VGM** (Video Game Music) file.
- Typical extension: `.vgm`.
- Produced by `exportSongToVgm(song)`.

### 7.2 High-level structure

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

### 7.3 Song mapping

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

## 8. EXPORT WAV (simplified)

### 8.1 Output file

- Binary format: **RIFF/WAVE**.
- Typical extension: `.wav`.
- Produced by `exportSongToWav(song)`.

### 8.2 Header

The exporter builds a standard PCM 16‑bit, mono WAV header using:

- Sample rate: `44100 Hz`.
- Channels: `1` (mono).
- Bit depth: `16`.
- Byte rate: `sampleRate * 2`.
- Standard `RIFF` and `fmt`/`data` chunks.

### 8.3 Sample data

- Playback is simulated over playlist and patterns using the same YM2149 envelopes used for export and live playback.
- For each DOSOUND tick:
  - It updates YM2149 registers via `applyInstrumentToRegisters`.
  - It generates `samplesPerTick` PCM samples at 44100 Hz using `synthTickSamples`, taking into account:
    - Tone periods and volumes for channels A/B/C.
    - Noise generator state.
    - Mixer (tone/noise enable per channel).
- Samples are clamped to [-1, 1] and written as signed 16-bit values.

The resulting WAV file is suitable for direct playback in standard audio players and provides a rendered version of the tracker song.
