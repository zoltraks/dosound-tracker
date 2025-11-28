# DOSOUND Tracker Manual for Composers and Assembly Wizards

*Real music is made in hex.*

This manual explains how to write music in **DOSOUND Tracker** and how to feed the result to your **68k / DOSOUND** playback code.

It is written for two species:

- **Composers** – you think in melodies, chords, and grooves, and you’re not afraid of hexadecimal.
- **Assembly coders** – you think in registers, stack frames, and why your VBLANK ISR crashed again.

Ideally, you are both. If not, share this file: the musician gets the top half, the coder gets the bottom half, and you meet in the middle over `dc.b`.

---

## 1. Big Picture: What DOSOUND Tracker Actually Does

- **Three hardware channels** of the **YM2149** (A, B, C).
- You write **patterns** (monotrack note data), chain them in a **playlist**, and design **instruments** using envelopes.
- The tracker simulates the YM2149 at **50 Hz VBLANK** timing and exports:
  - Human‑readable **YAML songs/instruments**.
  - **68k DOSOUND assembly data** (`dc.b` stream).
  - Optional **register dumps**, **binary blob**, **VGM**, and **WAV**.

This manual focuses on:

- **Creating songs** (patterns, playlist, instruments).
- **Understanding the data format** enough to tweak it by hand.
- **Integrating the exported data** with the **DOSOUND** XBIOS routine on an Atari ST or your own replay.

If that sounds like overkill for one PSG chip, remember: your DAW uses more RAM to draw a single button.

---

## 2. Core Concepts (for Both Musicians and Coders)

### 2.1 Song, Patterns, Playlist, Instruments

A **song** in DOSOUND Tracker is:

- **Metadata** – `title`, `author`, `year`, `speed`, `length` (pattern length).
- **Playlist** – which pattern plays on each of the three tracks per song line.
- **Patterns** – monotrack step lists, always interpreted as **Track A** internally.
- **Instruments** – envelopes and mode settings describing how a note evolves over time.

Conceptually:

- **Patterns** = musical phrases.
- **Playlist** = arrangement (which pattern plays where on tracks A/B/C).
- **Instruments** = sound design.

### 2.2 Time and Speed

Two clocks matter:

- **VBLANK / DOSOUND tick**: 50 Hz → one tick = 20 ms.
- **Tracker speed** (`speed`): how many ticks per **row** in a pattern.

Rules (from the implementation):

- `speed` is clamped to **even** values (2, 4, 6, …).
- **Envelope steps** advance every **2 ticks** (40 ms) → “envelope FPS” is `50 / 2 = 25 Hz`.

Approximate pattern duration:

- Let `S` = `speed`, `L` = `length` (rows per pattern).
- One row lasts `S * 20 ms`.
- One pattern lasts `L * S * 20 ms`.

Example:

- `speed: 4`, `length: 64` → `64 * 4 * 20 ms = 5120 ms ≈ 5.12 s` per pattern.

The music will still be faster than your loader.

---

## 3. Anatomy of a Song File (Composer‑Friendly YAML)

Full format details live in `docs/FORMAT.md`. This section is a **gentle version** aimed at usage, not validation.

### 3.1 Song Root

Conceptually:

- `title`: Optional; defaults to something generic if you forget.
- `author`: Optional; defaults to a placeholder.
- `year`: Optional; defaults to current year if missing.
- `speed`: Required. Positive integer, forced to **even** and at least **2**.
- `length`: Required. Pattern length, clamped to **4..256** rows.
- `loop`: Optional. 0‑based playlist index where playback loops (for exports that support looping).
- `playlist`: Required list of rows (arrangement).
- `pattern` / `patterns`: Required list of pattern definitions.
- `instrument` / `instruments`: Required list of instruments.

If you mess something up, the loader will attempt to rescue your tune instead of throwing it into the nearest bit bucket.

### 3.2 Playlist: Arranging Patterns on Tracks A/B/C

Each playlist entry is one **song line**:

- `A`: pattern ID for Track A.
- `B`: pattern ID for Track B.
- `C`: pattern ID for Track C.

Semantics:

- Pattern IDs are **hex strings** like `"00"`, `"1A"`, `"3F"`.
- Missing or non-string values become `"--"`, which means **no pattern** on that track for this song line.
- When a track has `"--"`, any previously playing note can **sustain** across this playlist position (thanks to the export logic).

Think of the playlist as a table:

- Rows = time.
- Columns = Track A/B/C pattern ID.

Example mental picture:

- Row 0: A=`00`, B=`01`, C=`--` → lead + bass.
- Row 1: A=`00`, B=`01`, C=`02` → same lead & bass, add drums.

### 3.3 Patterns: Monotrack Note Data

Patterns are **monotrack** from the file format’s point of view:

- Each pattern has a `number` (ID) and optional `name`.
- Steps (called `steps` or `lines`) are **Track A** in the internal representation.
- In the playlist, that same pattern ID can be assigned to Track A, B, or C.

A pattern is just an **ordered list of steps**, up to `length` rows. The loader also supports run‑length compression using `space` and `off` counters.

#### 3.3.1 Step Building Blocks

Each step can contain combinations of:

- **`note`** – like `"C-3"` or `"C#4"`.
  - Format: `NOTE` + optional `#` + `-` + `OCTAVE`.
  - Examples: `C-3`, `D#2`, `G-5`.
- **`instrument`** – hex string like `"00"`, `"1A"`, `"FF"`. Defaults to `"00"`.
- **`volume`** – optional per‑row **volume nibble** (0..15) for this channel.
  - Can be number (**3**, **15**) or string (`"C"`, `"0C"`, `"$0C"`).
- **`space`** – empty rows (no note on this pattern track).
  - `space: true` → one empty row.
  - `space: N` (N>0) → **N consecutive empty steps**.
- **`off`** – explicit note‑off / key release.
  - `off: true` → note‑off on this row.
  - `off: N` → **N consecutive note‑offs** (expanded by the loader).

Internally, note‑offs are represented as a special note:

- `note: '==='`, `octave: 0`, `instrument: '00'`.

You don’t normally write that directly in YAML; `off: true` is friendlier than `"==="`.

#### 3.3.2 How Steps Expand

For each pattern:

1. The loader **expands runs**:
   - `space: N` → N rows with `space: true`.
   - `off: N` → N rows with `off: true`.
   - When combined with `volume`, the volume is copied into each expanded row.
2. For each row up to `length`:
   - `off: true` → internal note‑off on Track A.
   - `space: true` → empty step.
   - `note: "X-Y"` → parsed into `note` + `octave`.
   - `instrument` missing → `"00"`.
   - `volume` → parsed to 0..15 if possible.

The result is a fixed‑length pattern of `length` rows.

---

## 4. Instruments: Your Tiny Synthesizers

An **instrument** describes how a note evolves over time on the YM2149. It contains **envelopes** for volume, pitch, noise, and mode.

Internally, an instrument has:

- `id` – hex slot index `00..FF`.
- `name` – label (optional, but friends don’t let friends leave this empty).
- `base` – base key, e.g. `"C-4"`.
- `octave` – base octave for some exports.
- `sustain` – optional sustain index in the envelope (0‑based).
- `volumeEnvelope[0..31]` – 0..15.
- `arpeggioEnvelope[0..31]` – semitone offsets (approx. -24..+24).
- `pitchEnvelope[0..31]` – raw divider delta, “vibrato / slide” in divider units.
- `noiseEnvelope[0..31]` – 0..31.
- `modeEnvelope[0..31]` – 0 = tone, 1 = noise, 2 = tone+noise.

In YAML, each instrument element (inside `song.instrument` or `instrument.instrument`) looks like:

- `number`: hex slot index string, e.g. `"00"`, `"1A"`.
- `name`, `base`, `octave`, `sustain`.
- `volume`, `arpeggio`, `pitch`, `noise`, `mode`: each is a **short list**; loader expands to **ENVELOPE_LENGTH = 32** steps.

### 4.1 Volume Envelope (Loudness over Time)

- Values: **0..15** (hex `0x0..0xF`).
- Step 0 → note start; higher = louder.
- Each step is held for **40 ms** (2 ticks).

Typical shapes:

- **Pluck:** `[15, 12, 8, 4, 0]` – fast decay.
- **Pad:** `[8, 9, 10, 10, 9, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 0]` – gentle fade.
- **Perc hit:** `[15, 10, 4, 0]` – clicky and short.

The loader will extend the envelope to 32 steps by **repeating the last value**. Exporters stop early if your song does not need the full length.

### 4.2 Arpeggio Envelope (Chords in One Channel)

- Values: **semitone offsets** relative to the played note.
- Range (from `constants/music.ts`): `ARPEGGIO_MIN = -24`, `ARPEGGIO_MAX = 24`.
- Positive values move pitch up, negative move down.

Examples:

- **Octave arp:** `[0, 12, 0, 12, ...]` → toggles between root and octave.
- **Major triad cycle:** `[0, 4, 7, 4, 0, ...]`.
- **Seventh stabs:** `[0, 4, 7, 10, 7, 4, 0, ...]`.

At each envelope step, the exporter computes:

- `frequency = baseFrequency * 2^(arpeggio/12)`.

This is how the tracker creates the illusion of full chords in a single square‑wave channel. SID fans call this cheating; we call it **optimal use of available resources**.

### 4.3 Pitch Envelope (Fine Bends & Slides)

- Values: integers in range `PITCH_MIN = -128` to `PITCH_MAX = 128`.
- Applied directly to the **YM2149 divider** (`period = (period - pitchDelta) & 0x0FFF`).

Use cases:

- **Portamento down:** gradually decreasing pitch envelope (small positive deltas reduce divider → raise pitch; negative deltas increase divider → lower pitch). See example instruments like `Slide Down` / `Slide Up` in `Arp_Loop.yaml`.
- **Vibrato:** oscillating pattern like `[0, 2, 0, -2, 0, 2, 0, -2, ...]`.

Rule of thumb:

- Small values (±1..±10) = subtle.
- Large values (±30..±100) = sci‑fi divebomb, intro to a demo, or *“I broke the tune on purpose”*.

### 4.4 Noise Envelope (Percussion Texture)

- Values: `0..31` (`NOISE_MAX = 0x1F`).
- Higher values produce **faster / noisier** sounds.

Example uses:

- **Hi‑hat:** noise starts high and quickly drops to 0.
- **Snare:** mid noise that decays while volume also decays.
- **Kick with click:** noise at the beginning only.

### 4.5 Mode Envelope (Tone / Noise / Both)

Per envelope step, the **mode** controls the YM2149 mixer bits for a channel:

- `0` → **tone only** (melodic).
- `1` → **noise only** (percussive).
- `2` → **tone + noise**.

Examples:

- Pure lead: `mode: [0]`.
- Hi‑hat: `mode: [1, 1, 1, 0]` (noise that switches to silence at end).
- Snare: `mode: [1, 0, 1, 1, 1, 1, 1, 1, 0]` (complex mix of tone+noise).

The exporter uses these values to set bits in register `R7` (mixer), per channel.

### 4.6 Sustain Point

`sustain` is an optional **0‑based envelope index**.

- While a note is held, if the envelope step reaches `sustain`, it **stays there**.
- A note‑off (`off: true` in the pattern) marks the channel as **released**, and then the envelope continues advancing beyond the sustain index until the end.

This allows you to:

- Build **loop‑sounding** sustained notes without manually repeating values.
- Control **release tails** accurately.

Internally, the export logic:

- Freezes the envelope at `sustain` while not released.
- Once released, it increments steps on every second tick until the end of the envelope.

---

## 5. Writing Patterns Like a Tracker Person

You can either use the UI or edit the YAML directly. This section focuses on the **musical meaning** rather than every key combo.

### 5.1 Notes, Rests, and Offs

Symbols (conceptually):

- `C-3` – play C in octave 3 with the selected instrument.
- `---` – no event (space; continue whatever is already sounding).
- `===` – explicit note‑off: stop or release the current note.

In YAML steps:

- `note: "C-3"` → triggers the note.
- `space: true` or `space: N` → rest(s).
- `off: true` or `off: N` → note‑off(s).

### 5.2 Per‑Row Volume Column

Each pattern line can have an optional `volume` nibble (0..15). This acts as a **multiplier** on the instrument’s volume envelope.

- Internally, the exporter computes:
  - `effectiveVolume = floor( instrumentVolume * volumeNibble / 15 )`.
- `volume: 15` → no change.
- `volume: 8` → roughly half.
- `volume: 0` → silence on that channel for this note.

Use cases:

- Accents: make some hits louder than others.
- Swell inside a pattern: gradually raise `volume` from 4 → 15.
- Quick mutes: `volume: 0` without changing the instrument.

### 5.3 Example: Simple Bass Pattern

Imagine a 16‑row pattern (length = 16) with a simple bass every 4 rows:

- Rows 0, 4, 8, 12: `C-2` with instrument `01`.
- Everything else: space.

The tracker will expand `space: 3` etc. to fill up the remaining rows. You can then reuse this pattern across multiple playlist rows on different tracks.

### 5.4 Example: Melody + Bass + Drums

Strategy:

- **Pattern `00`** – lead/melody.
- **Pattern `01`** – bassline.
- **Pattern `02`** – drums.

Playlist:

- Row 0: `A: "00", B: "01", C: "02"`.
- Row 1: `A: "00", B: "01", C: "02"` (repeat or use other pattern IDs).

You can later swap `02` with a different drum pattern ID to get instant variations without touching the melody.

---

## 6. Composer Workflow: From Idea to Finished Tune

### 6.1 Step 1 – Choose Speed and Length

- Recommended starting values:
  - `speed: 4` (quite common for a moderate tempo).
  - `length: 64` (classic tracker pattern length).
- For faster songs, try `speed: 2`.
- For slower ones, `speed: 6` or `8`.

Don’t worry about precise BPM at first. You are writing for a YM2149, not for a metronome festival.

### 6.2 Step 2 – Design a Few Instruments

Start with:

- **01 – Bass**
  - Volume: short decay.
  - Mode: tone only.
- **02 – Lead**
  - Volume: longer decay.
  - Arpeggio: optional chord movement.
- **03 – Kick**
  - Volume: tight exponential decay.
  - Noise: spike at the beginning.
  - Mode: noise+tone.
- **04 – Snare / Hat**
  - Volume: very short.
  - Noise: medium or high.
  - Mode: noise.

Use the on‑screen envelope views to sculpt the curves. If it looks like a ski slope, it will probably sound like one.

### 6.3 Step 3 – Write a Bass Pattern

- Start with Track A in a blank pattern.
- Lay down a root note on row 0 (`C-2` with instrument 01).
- Add more hits every 4th or 8th row.
- Use the volume column to accent the first beat of each bar.

Seriously, a nice bass can carry half the track while you think about the melody.

### 6.4 Step 4 – Add Melody and Harmonies

- New pattern for your lead.
- Use higher octaves and different instrument.
- Consider simple arpeggios first: repeating triads and scales.

### 6.5 Step 5 – Drums and Percussion

- One pattern for kick + snare.
- Another for variations or fills.
- Add hi‑hat patterns with shorter, noisier instruments.

If your drums sound like a broken printer, you’re close.

### 6.6 Step 6 – Build the Playlist

- Start with a small set of rows, e.g. 8–16 playlist entries.
- Arrange intro, verse, chorus by selecting pattern IDs for each track.
- Use special playlist rows for breaks by leaving some tracks as `"--"`.

Remember: the playlist is cheap. Patterns are reusable. Go wild.

### 6.7 Step 7 – Looping

- Set `loop` to the 0‑based index in the playlist where you’d like the song to loop.
- Exports that support looping (e.g. VGM) will mark this loop accordingly.

If you want a tune that never ends, set the loop somewhere before your sanity does.

### 6.8 Step 8 – Export and Listen Outside the Editor

Use the UI commands (or menu options) corresponding to:

- **SAVE SONG** – YAML.
- **SAVE INST** – single instrument YAML.
- **EXPORT DATA** – DOSOUND assembly.
- **EXPORT BIN** – raw DOSOUND bytes.
- **EXPORT VGM** / **EXPORT WAV** – for playback in external tools.

Then:

- Play the WAV on your favourite player.
- Put the assembly into your Atari ST project and call DOSOUND.

If it sounds good on tiny PSG, it’ll sound legendary everywhere else.

---

## 7. Technical Deep Dive: How Export to DOSOUND Works

This section is especially for **coders** (but musicians can peek to impress their local assembler wizard).

### 7.1 Internal Simulation

The core export function (`exportToAssembly`) does this:

1. **Initialize registers**:
   - Mixer (`R7`) = `0x38` (tones enabled, noise off by default for all channels in this tracker’s mapping).
   - Volumes (`R8`, `R9`, `R10`) = 0.
2. For each **playlist entry** and **pattern line**:
   - Determine the note (if any) for each channel.
   - On the first tick of a row:
     - Detect new notes vs. note‑offs.
     - Apply **sustain** logic for instruments.
     - Update per‑channel **volume modifier** from the pattern line’s `volume` (if provided).
   - Apply instrument envelopes:
     - Volume, arpeggio, pitch, mode, noise.
     - Compute a `toneMeta` helper for nicer `TA` comments.
   - Advance envelope step every **2 ticks** (40 ms) per active note.
3. For each relevant frame (usually every 2 ticks), capture:
   - The current **register map**.
   - Line index and tick index.
   - Tone metadata (note + pitch delta).
4. Pass the collected frames into `formatFramesToAssembly`.

Result: a list of frames each representing the YM2149 state at a given **DOSOUND tick**.

### 7.2 DOSOUND Command Stream

In DOSOUND format (see classic Atari ST docs), commands are typically encoded as:

- **Register write**: two or more bytes.
- **Delay**: special command using `$FF` followed by a delay count.
- **End**: `$FF, 0`.

DOSOUND Tracker follows this convention in assembly export:

- `dc.b $reg, $value` for register writes.
- `dc.b $FF, N` for **delay N frames** (at 50 Hz).
- `dc.b $FF, 0` at the end → **STOP marker**.

The example in `README.md` illustrates this, with comments such as `TA D-4`, `VA`, etc. Only **changed registers** are written in complex dump mode to keep data compact.

### 7.3 Complex Dump Mode vs Simple Dump Mode

- **Simple dump mode**:
  - Writes all relevant registers for every exported frame.
  - Easier to debug, bigger size.
- **Complex dump mode** (when `isComplexDumpMode = true`):
  - Tracks `lastRegs` map.
  - Writes only registers that **changed** since the previous frame.
  - Inserts beat markers between playlist positions.
  - Forces tone registers (`R0..R5`) to be rewritten after beat markers so every playlist line starts well‑defined.

In both cases, the stream ends by silencing channels (volumes to 0) and appending `dc.b $FF,0`.

### 7.4 Binary Export

`EXPORT BIN` is implemented as:

1. Call `exportToAssembly(song, isComplexDumpMode)`.
2. Parse every `dc.b` line and extract `$XX` tokens.
3. Pack them into a `Uint8Array` of raw bytes.

This binary is exactly what a DOSOUND routine expects as its command stream.

### 7.5 Register Summary

Relevant YM2149 registers used:

- `R0, R1` – Tone period channel A.
- `R2, R3` – Tone period channel B.
- `R4, R5` – Tone period channel C.
- `R6` – Noise period.
- `R7` – Mixer (enable/disable tone+noise per channel).
- `R8, R9, R10` – Volumes for A/B/C.

Other registers (envelopes in the chip’s own hardware sense) are not used directly; instead, DOSOUND Tracker emulates envelopes and writes plain tone+noise registers.

---

## 8. Integrating with Your Atari ST / 68k Code

This section assumes you already know how to:

- Assemble 68k code.
- Call XBIOS / DOSOUND or your own replay routine.

### 8.1 Basic Workflow

1. In DOSOUND Tracker, use **EXPORT DATA** to produce e.g. `music.s`.
2. Add `music.s` to your project and assemble it.
   - It defines a label like `music:` at the start of the data stream.
3. In your 68k code:
   - Call the DOSOUND function (via XBIOS or your own player) with the address of `music`.
   - The player processes the stream of register writes and delays until the stop marker.

Check your preferred Atari ST documentation for the exact function signature of DOSOUND or your playback routine. The important part is: **you pass a pointer to this `dc.b` stream; it runs until `$FF,0`.**

### 8.2 Memory & Performance Tips

- Always use **complex dump mode** for release builds:
  - Smaller data.
  - Fewer register writes per frame.
- Group songs and sound effects:
  - Many short SFX can share instruments or patterns.
- Use volume‑based optimization:
  - When a channel is silent (volume 0) and stays that way, exports avoid wasting data on that channel.

If your demo still runs too slowly, it’s not the music’s fault. It’s your 3D routine.

### 8.3 Manual Tweaks to Exported Assembly

Because the export format is human‑readable assembly, you can:

- Rename the label from `music` to something else if your codebase demands.
- Split the data into sections (intro, loop) manually.
- Insert your own comments.

However, be careful when hand‑editing the **`$FF` delay commands** or register sequences, or you’ll create mysterious “why is channel B screaming forever?” bugs.

---

## 9. For Instrument Designers: Patterns in the Example Songs

The repository ships with example songs under `docs/example/song/` such as:

- `Nice_Song.yaml`
- `Warmball.yaml`
- `Arp_Loop.yaml`

These demonstrate:

- Use of **arpeggio envelopes** to build rich leads.
- Typical **kick, snare, and hi‑hat** configurations.
- Bass instruments with different volumes and base notes.
- Slide‑up and slide‑down FX using **pitch envelopes**.

You can load them, inspect their instruments, and steal—sorry, **learn** from them:

- Look at volume shapes for kicks (`Kick`, `Bass`, etc.).
- Examine noise patterns for snares and hats (`Hihat`, `Snare`).
- Study arpeggiated leads (`Arp Quick`, `Nice Arp`).

If your own instruments look similar, congratulations: you’ve just reverse‑engineered the sound of the project.

---

## 10. Troubleshooting & FAQ

### 10.1 My Tune Is Too Quiet / Too Loud

- Check **per‑row volume**:
  - Are many rows using low `volume` nibble values like 3 or 4?
- Check **instrument volume envelope**:
  - If top values are like 5–7, it’ll sound subtle.
  - Try raising peaks to 12–15.

### 10.2 Notes Don’t Stop When I Expect

- Ensure you actually send **note‑offs** (`off: true` in steps, or `===` in pattern view) when using **sustain**.
- Without sustain, note‑off rows will immediately set channel volume to 0.

### 10.3 Exported Data Sounds Different from Live Playback

- Make sure the **song speed** matches your expectation; exports use the same logic as playback.
- Remember that **envelopes advance every 2 ticks**; extremely short notes may not traverse much of the envelope.
- Check that you did not accidentally set huge **pitch envelope** values.

### 10.4 My Atari ST Crashes When Starting the Music

- Confirm that the **address** passed to DOSOUND points to the beginning of the exported data (`music:` label).
- Make sure the code is assembled and linked correctly into your program.
- Ensure that the memory region holding the music data is not overwritten by your own code or stack.

### 10.5 Why Hex Everywhere?

Because:

- Instruments are stories in hexadecimal.
- Also, it looks cooler in screenshots.

---

## 11. Closing Words

DOSOUND Tracker is a love letter to:

- The **YM2149**,
- The **Atari ST**,
- And everyone who ever thought, *“I can do better than this sample pack.”*

Use this manual as a **field guide**:

- Composers: think in patterns and envelopes.
- Coders: think in registers and delays.

When both sides meet, what comes out of the monitor speakers is more than the sum of 16 volume levels and a few random bits of noise.

Now go write something that will make 2025 hardware jealous of 1985 silicon.
