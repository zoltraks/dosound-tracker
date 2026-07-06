# MAX Format Specification

## Document Information

**Version**: 1.7

**Date**: 2026-07-07

**State**: Release Candidate 7

## Version History

| Date           | Version     |
|----------------|-------------|
| **2026-07-07** | Version 1.7 |
| **2026-07-05** | Version 1.6 |
| **2026-06-20** | Version 1.5 |
| **2026-01-18** | Version 1.4 |
| **2026-01-13** | Version 1.3 |
| **2025-12-25** | Version 1.2 |
| **2025-12-08** | Version 1.1 |
| **2025-12-06** | Version 1.0 |
| **2024-11-29** | Version 0.9 |
| **2024-11-23** | Version 0.8 |
| **2024-11-11** | Version 0.7 |
| **2024-10-14** | Version 0.6 |
| **2024-10-05** | Version 0.5 |
| **2024-09-28** | Version 0.4 |
| **2024-09-25** | Version 0.3 |

## Quick Overview

**MAX** is a comprehensive audio file format designed for authentic playback of computer
music using original sound chips.

Unlike executable music formats like **SID**, **SAP**, **SNDH**, **NSF**,
this format is a register-change log format similar to **VGM**,
designed to drive sound chips directly through their register interfaces.

The name **MAX** can be interpreted as an acronym for **Music Audio eXchange**.

## Design Principles

**Authenticity**: Uses original chip register interfaces for accurate sound reproduction

**Efficiency**: Multiple stream formats optimized for different chip types and compression

**Extensibility**: Chunk-based structure supporting future enhancements

**Hardware Integration**: Designed for ST-MAX device with direct hardware register access

**Multi-chip Support**: Handles complex setups with multiple sound chips simultaneously

## Chunk Structure

File data consists of a sequence of chunks.
A chunk is a block of data with a specific type and size.
Each chunk has a header containing a type identifier and size information.

| Size              | Value  | Type       |
|-------------------|--------|------------|
| 1 byte            | letter | Chunk type |
| 1 byte or 3 bytes | N-1    | Chunk size |
| N bytes           | *      | Chunk data |

Chunk type is a single-byte ASCII character.
There are two types of chunks: short chunks (up to 256 bytes of data)
and long chunks (up to 16,777,216 bytes of data).
Short chunk types use uppercase letters, while long chunk types use lowercase letters.

The chunk size field specifies the number of data bytes minus one.

Chunk order is generally not significant. However, the version chunk should appear
as one of the first chunks in the file to specify the format version number.

## Number Format

Multi-byte numbers are written in the Big Endian byte order standard.

This means that when a number consisting of multiple bytes like 32-bit integer 0x0A0B0C0D is stored,
the most significant byte (MSB) comes first in the data stream.

In all tables, values in the "Offset", "Value", "Address" columns are hexadecimal numbers.

## File Header

This is the beginning of the file.

| Offset | Size | Example | Description  |
|--------|------|---------|--------------|
| ``00`` | 4    | 'MAX '  | Magic number |

## Version Chunk

This chunk specifies the format version.

| Offset | Size | Example | Description    |
|--------|------|---------|----------------|
| ``00`` | 1    | 'V'     | Chunk type     |
| ``01`` | 1    | 00      | Chunk size     |
| ``02`` | 1    | 01      | Version number |

## Information Chunk

Additional information about a piece of music, such as the composer (author), title, and year, can be stored in this chunk.

| Offset | Size | Example   | Description      |
|--------|------|-----------|------------------|
| ``00`` | 1    | 'I'       | Chunk type       |
| ``01`` | 1    | 04        | Chunk size       |
| ``02`` | 5    | 'A Me' 00 | Information data |

Information data consists of a byte array representing characters using ASCII or UTF-8 encoding (without BOM).

This array consists of one or more lines terminated by a null byte.

Each line begins with one character specifying the type of information (title, author, year),
followed by a space character and the corresponding value.

The maximum chunk size is 256 bytes.

```
Title: My song
Author: Unknown
Year: 2024
```

In this example information would be encoded as:

``T My song`` ``00`` ``A Unknown`` ``00`` ``Y 2024`` ``00``.

## Total Time Chunk

This chunk stores the total duration of the music as a pre-computed value.

It allows players and tools to display the duration without decompressing and counting stream frames.

When this chunk is absent, the total time can be derived from the frame count and chip speed.

There should be only one total time chunk in the file.

It represents the overall file duration, which is the longest stream block when multiple blocks are present.

| Offset | Size | Example | Description   |
|--------|------|---------|---------------|
| ``00`` | 1    | 'T'     | Chunk type    |
| ``01`` | 1    | 04      | Chunk size    |
| ``02`` | 1    | 00      | Hours         |
| ``03`` | 1    | 01      | Minutes       |
| ``04`` | 1    | 20      | Seconds       |
| ``05`` | 2    | 03 0F   | Milliseconds  |

Hours, minutes, and seconds are each stored as a single unsigned byte.

Milliseconds is stored as a 2-byte Big Endian unsigned integer.

Valid ranges are 0-255 for hours, 0-59 for minutes, 0-59 for seconds, and 0-999 for milliseconds.

The maximum chunk size is 256 bytes.

Example for a duration of 1 minute 32.783 seconds:

```
T 04 00 01 20 03 0F
```

## Metadata Chunk

The metadata chunk stores structured key-value data.

This allows preserving source-specific properties, such as VGM version or offsets,
in a clean and queryable format.

There should be only one metadata chunk in the file.
It is a long chunk to ensure it can accommodate extensive metadata sets.

| Offset | Size | Example     | Description     |
|--------|------|-------------|-----------------|
| ``00`` | 1    | 'm'         | Chunk type      |
| ``01`` | 3    | ...         | Chunk size      |
| ``04`` | ...  | ...         | Key-Value pairs |

### Key-Value Pair Structure

Data consists of a sequence of keys and values represented as null-terminated ASCII strings.

Format: ``Key`` + ``00`` + ``Value`` + ``00``

Example: ``vgm.version`` ``00`` ``1.51`` ``00``

### Key Naming Convention

Key names must follow specific rules.

They must not contain any spaces or other whitespace characters.

Key names are treated as case-insensitive, but the standard convention is to use lowercase letters.

When a key name consists of multiple words, the words should be separated by dots, i.e. ``vgm.loop.samples``.

Keys should be organized by their source or application using prefixes.

Keys for fields imported from VGM headers should begin with ``vgm.``,
while keys for fields imported from GD3 tags should start with ``gd3.``.

### Standard VGM Keys

The following keys are standard for imported VGM data.
Values are strings (decimal or version strings) representing official VGM header fields.

- **vgm.version**: (4 bytes) VGM Version (e.g., 0x00000151 -> "1.51")
- **vgm.total.samples**: (4 bytes) Total number of samples
- **vgm.loop.samples**: (4 bytes) Number of loop samples
- **vgm.loop.offset**: (4 bytes) Loop offset
- **vgm.rate**: (4 bytes) Recording rate (data at 0x24)
- **vgm.volume.modifier**: (1 byte) Volume modifier
- **vgm.loop.modifier**: (1 byte) Loop modifier
- **vgm.data.offset**: (4 bytes) Original relative data offset

## Chip Setup Chunk

This chunk specifies the sound chip being used.

It may appear multiple times in a file, once for each sound chip used.

| Offset | Size | Example | Description  |
|--------|------|---------|--------------|
| ``00`` | 2    | 'C'     | Chunk type   |
| ``02`` | 2    | 03      | Chunk size   |
| ``04`` | 1    | BB      | Chip model   |
| ``05`` | 1    | 03      | Chip panning |
| ``06`` | 2    | 00 32   | Chip speed   |

Chip update speed is defined in Hz.

Typical values are 50 Hz (PAL VBL) and 60 Hz (NTSC VBL), although multiples such as 100 Hz or 200 Hz may also be used.

Additional settings might be included in extended configuration.

Extended configuration is specific to chip type. 

Values for one chip type may have a different meaning for another chip type.

## Timing Relationship

Frame duration is determined by the chip speed specified in the chip setup chunk.

For a chip configured at 50 Hz (PAL VBL), each frame corresponds to a 20 ms interval.

At 60 Hz (NTSC VBL), frame duration is approximately 16.67 ms.

Multiple register writes may occur within a single frame.

## Clock Speed Setup

Chip setup chunk might be extended by additional information about chip clock speed.

| Offset | Size | Example     | Description |
|--------|------|-------------|-------------|
| ``08`` | 4    | 00 1B 0F 87 | Chip clock  |

The chip clock frequency is stored as a 4-byte Big-Endian integer representing the clock frequency in hertz.

If it is not specified, the field should be filled with zeroes.

Two possible values for **POKEY** chip are ``00 1B 0F 87`` for 1,77 MHz **PAL** clock
and ``00 1B 4F 4C`` for 1,79 MHz **NTSC** clock.

For **YM 2149** the default clock is 2 MHz and is encoded as ``00 1E 84 80``.

For an AY-8910 using a 1 MHz clock, this value is encoded as ``00 0F 42 40``.

## Chip Model Value

These values are magic constants for different types of sound chips.

| Value  | Description | Family | System                      |
|--------|-------------|--------|-----------------------------|
| ``BB`` | POKEY       |        | Atari 8-bit family          |
| ``A0`` | AY 8910     | AY     | Amstrad CPC, ZX Spectrum    |
| ``A9`` | YM 2149     | AY     | Atari ST                    |
| ``AA`` | SID 8650    | SID    | Commodore C64 (new)         |
| ``AB`` | SID 6581    | SID    | Commodore C64 (old)         |
| ``26`` | TIA         |        | Atari 2600                  |
| ``50`` | SN 76489    |        | Sega PSG, Master System     |
| ``52`` | YM 2612     |        | Sega Genesis (OPN2)         |
| ``54`` | YM 2151     |        | Arcade (OPM)                |
| ``55`` | YM 2203     | OPN    | NEC PC-88/98                |
| ``56`` | YM 2413     |        | MSX (OPLL)                  |
| ``58`` | YM 2608     | OPNA   | NEC PC-88                   |
| ``59`` | YM 2610     | OPNB   | Neo Geo                     |
| ``60`` | VIC         |        | Commodore VIC-20            |
| ``61`` | TED         |        | Commodore Plus/4, C16, C116 |

## Chip Register Maps

The following tables define the register addresses and names for each supported sound chip type.

### POKEY Register Map

| Offset | Name   | Description               |
|--------|--------|---------------------------|
| ``00`` | AUDF1  | Audio frequency divider 1 |
| ``01`` | AUDC1  | Audio control 1           |
| ``02`` | AUDF2  | Audio frequency divider 2 |
| ``03`` | AUDC2  | Audio control 2           |
| ``04`` | AUDF3  | Audio frequency divider 3 |
| ``05`` | AUDC3  | Audio control 3           |
| ``06`` | AUDF4  | Audio frequency divider 4 |
| ``07`` | AUDC4  | Audio control 4           |
| ``08`` | AUDCTL | Audio control global      |
| ``09`` | STIMER | Sample timer              |
| ``0F`` | SKCTL  | Serial port control       |

### SID Register Map

| Offset | Name    | Description                   |
|--------|---------|-------------------------------|
| ``00`` | FREQLO1 | Frequency low byte voice 1    |
| ``01`` | FREQHI1 | Frequency high byte voice 1   |
| ``02`` | PWLO1   | Pulse width low byte voice 1  |
| ``03`` | PWHI1   | Pulse width high byte voice 1 |
| ``04`` | CR1     | Control register 1            |
| ``05`` | AD1     | Attack/Decay voice 1          |
| ``06`` | SR1     | Sustain/Release voice 1       |
| ``07`` | FREQLO2 | Frequency low byte voice 2    |
| ``08`` | FREQHI2 | Frequency high byte voice 2   |
| ``09`` | PWLO2   | Pulse width low byte voice 2  |
| ``0A`` | PWHI2   | Pulse width high byte voice 2 |
| ``0B`` | CR2     | Control register 2            |
| ``0C`` | AD2     | Attack/Decay voice 2          |
| ``0D`` | SR2     | Sustain/Release voice 2       |
| ``0E`` | FREQLO3 | Frequency low byte voice 3    |
| ``0F`` | FREQHI3 | Frequency high byte voice 3   |
| ``10`` | PWLO3   | Pulse width low byte voice 3  |
| ``11`` | PWHI3   | Pulse width high byte voice 3 |
| ``12`` | CR3     | Control register 3            |
| ``13`` | AD3     | Attack/Decay voice 3          |
| ``14`` | SR3     | Sustain/Release voice 3       |
| ``15`` | FCLO    | Filter cutoff low             |
| ``16`` | FCHI    | Filter cutoff high            |
| ``17`` | FILTER  | Filter resonance and routing  |
| ``18`` | VOLUME  | Master volume                 |

### AY/YM Register Map

| Offset | Name           | Description                           |
|--------|----------------|---------------------------------------|
| ``00`` | FREQ_FINE_A    | Channel A frequency fine adjustment   |
| ``01`` | FREQ_HIGH_A    | Channel A frequency coarse adjustment |
| ``02`` | FREQ_FINE_B    | Channel B frequency fine adjustment   |
| ``03`` | FREQ_HIGH_B    | Channel B frequency coarse adjustment |
| ``04`` | FREQ_FINE_C    | Channel C frequency fine adjustment   |
| ``05`` | FREQ_HIGH_C    | Channel C frequency coarse adjustment |
| ``06`` | NOISE          | Noise generator control               |
| ``07`` | MIXER          | I/O mixer/enable                      |
| ``08`` | VOLUME_A       | Channel A volume                      |
| ``09`` | VOLUME_B       | Channel B volume                      |
| ``0A`` | VOLUME_C       | Channel C volume                      |
| ``0B`` | ENVELOPE_FINE  | Envelope fine adjustment              |
| ``0C`` | ENVELOPE_HIGH  | Envelope coarse adjustment            |
| ``0D`` | ENVELOPE_SHAPE | Envelope shape                        |
| ``0E`` | IO_A           | Port A data  (not used)               |
| ``0F`` | IO_B           | Port B data  (not used)               |

Registers IO_A (``0E``) and IO_B (``0F``) are general purpose hardware I/O ports.

They are not sound registers and are not writable as music data.

Stream formats carry only the sound registers ``00`` through ``0D``, so IO_A and IO_B are excluded from MAX streams.

### TIA Register Map

| Offset | Name  | Description                                |
|--------|-------|--------------------------------------------|
| ``00`` | AUDC0 | Audio control channel 0 (4-bit distortion) |
| ``01`` | AUDC1 | Audio control channel 1 (4-bit distortion) |
| ``02`` | AUDF0 | Audio frequency channel 0 (5-bit divider)  |
| ``03`` | AUDF1 | Audio frequency channel 1 (5-bit divider)  |
| ``04`` | AUDV0 | Audio volume channel 0 (4-bit volume)      |
| ``05`` | AUDV1 | Audio volume channel 1 (4-bit volume)      |

### VIC Register Map

| Offset | Name     | Description         |
|--------|----------|---------------------|
| ``00`` | CH1_FREQ | Channel 1 frequency |
| ``01`` | CH2_FREQ | Channel 2 frequency |
| ``02`` | CH3_FREQ | Channel 3 frequency |
| ``03`` | VOLUME   | Master volume       |

### TED Register Map

| Offset | Name          | Description                       |
|--------|---------------|-----------------------------------|
| ``00`` | SND_FREQ_LO_1 | Channel 1 frequency (low 8 bits)  |
| ``01`` | SND_FREQ_LO_2 | Channel 2 frequency (low 8 bits)  |
| ``02`` | SND_FREQ_HI_1 | Channel 1 frequency (high 2 bits) |
| ``03`` | SCR_VOLUME    | Control register value and volume |
| ``04`` | SND_FREQ_HI_2 | Channel 1 frequency (high 2 bits) |

When replaying the stream, register offsets must be mapped to the appropriate
physical memory addresses for hardware playback.

| Address  | Mask            | Description   |
|----------|-----------------|---------------|
| ``FF0E`` | X X X X X X X X | SND_FREQ_LO_1 |
| ``FF0F`` | X X X X X X X X | SND_FREQ_LO_2 |
| ``FF10`` | - - - - - - X X | SND_FREQ_HI_1 |
| ``FF11`` | X X X X X X X X | SCR_VOLUME    |
| ``FF12`` | - - - - - - X X | SND_FREQ_HI_2 |

### SN 76489 Register Map

| Offset | Name          | Description                                                  |
|--------|---------------|--------------------------------------------------------------|
| ``00`` | TONE_1        | Tone generator 1 frequency (low 8 bits)                      |
| ``01`` | VOLUME_1      | Tone generator 1 frequency (high 2 bits) and volume (4 bits) |
| ``02`` | TONE_2        | Tone generator 2 frequency (low 8 bits)                      |
| ``03`` | VOLUME_2      | Tone generator 2 frequency (high 2 bits) and volume (4 bits) |
| ``04`` | TONE_3        | Tone generator 3 frequency (low 8 bits)                      |
| ``05`` | VOLUME_3      | Tone generator 3 frequency (high 2 bits) and volume (4 bits) |
| ``06`` | NOISE_CONTROL | Noise control (3 bits)                                       |
| ``07`` | NOISE_VOLUME  | Noise volume (4 bits)                                        |

### YM 2612 Register Map

| Offset | Name         | Description                                 |
|--------|--------------|---------------------------------------------|
| ``22`` | LFO          | LFO frequency control                       |
| ``24`` | TIMER_A_MSB  | Timer A value (MSB)                         |
| ``25`` | TIMER_A_LSB  | Timer A value (LSB)                         |
| ``26`` | TIMER_B      | Timer B value                               |
| ``27`` | TIMER_CTRL   | Timer control and CH3/6 mode                |
| ``28`` | KEY_ON       | Key on/off control                          |
| ``2A`` | DAC_DATA     | DAC data (8-bit)                            |
| ``2B`` | DAC_ENABLE   | DAC enable                                  |
| ``30`` | DT_MUL_OP1   | Detune and multiply (operator 1)            |
| ``34`` | DT_MUL_OP3   | Detune and multiply (operator 3)            |
| ``38`` | DT_MUL_OP2   | Detune and multiply (operator 2)            |
| ``3C`` | DT_MUL_OP4   | Detune and multiply (operator 4)            |
| ``40`` | TL_OP1       | Total level (operator 1)                    |
| ``44`` | TL_OP3       | Total level (operator 3)                    |
| ``48`` | TL_OP2       | Total level (operator 2)                    |
| ``4C`` | TL_OP4       | Total level (operator 4)                    |
| ``50`` | RS_AR_OP1    | Rate scaling and attack rate (operator 1)   |
| ``54`` | RS_AR_OP3    | Rate scaling and attack rate (operator 3)   |
| ``58`` | RS_AR_OP2    | Rate scaling and attack rate (operator 2)   |
| ``5C`` | RS_AR_OP4    | Rate scaling and attack rate (operator 4)   |
| ``60`` | AM_D1R_OP1   | AM enable and first decay rate (operator 1) |
| ``64`` | AM_D1R_OP3   | AM enable and first decay rate (operator 3) |
| ``68`` | AM_D1R_OP2   | AM enable and first decay rate (operator 2) |
| ``6C`` | AM_D1R_OP4   | AM enable and first decay rate (operator 4) |
| ``70`` | D2R_OP1      | Second decay rate (operator 1)              |
| ``74`` | D2R_OP3      | Second decay rate (operator 3)              |
| ``78`` | D2R_OP2      | Second decay rate (operator 2)              |
| ``7C`` | D2R_OP4      | Second decay rate (operator 4)              |
| ``80`` | D1L_RR_OP1   | Sustain level and release rate (operator 1) |
| ``84`` | D1L_RR_OP3   | Sustain level and release rate (operator 3) |
| ``88`` | D1L_RR_OP2   | Sustain level and release rate (operator 2) |
| ``8C`` | D1L_RR_OP4   | Sustain level and release rate (operator 4) |
| ``90`` | SSG_EG_OP1   | SSG-EG (operator 1)                         |
| ``94`` | SSG_EG_OP3   | SSG-EG (operator 3)                         |
| ``98`` | SSG_EG_OP2   | SSG-EG (operator 2)                         |
| ``9C`` | SSG_EG_OP4   | SSG-EG (operator 4)                         |
| ``A0`` | FREQ_LSB     | Frequency LSB (channels 1-3/4-6)            |
| ``A4`` | FREQ_MSB     | Frequency MSB and block (channels 1-3/4-6)  |
| ``A8`` | CH3_FREQ_LSB | Channel 3 extended frequency LSB            |
| ``AC`` | CH3_FREQ_MSB | Channel 3 extended frequency MSB            |
| ``B0`` | FB_ALGO      | Feedback and algorithm (channels 1-3/4-6)   |
| ``B4`` | LR_AMS_PMS   | Stereo, AMS, and PMS (channels 1-3/4-6)     |

## Stereo Panning Value

This value determines on which stereo channel a given chip plays.

If this value is not specified, the playback program will decide on its own.

As a rule, in a multi-speaker configuration, odd-numbered units play on the left channel,
and even-numbered units play on the right.

In the case of a single-unit stream, it is better to leave this value empty.

| Value  | Panning       |
|--------|---------------|
| ``00`` | Not Specified |
| ``01`` | Front Left    |
| ``02`` | Front Right   |
| ``03`` | Center        |
| ``04`` | Rear Left     |
| ``05`` | Rear Right    |

## Stream Definition Chunk

This chunk specifies the format and optional compression used for a stream associated with a particular chip.

| Offset | Size | Example | Description        |
|--------|------|---------|--------------------|
| ``00`` | 1    | 'S'     | Chunk type         |
| ``01`` | 1    | 01      | Chunk size         |
| ``02`` | 1    | 07      | Stream format      |
| ``03`` | 1    | 08      | Stream compression |

This block can have more data if it specifies original data length.

| Offset | Size | Example  | Description        |
|--------|------|----------|--------------------|
| ``00`` | 1    | 'S'      | Chunk type         |
| ``01`` | 1    | 04       | Chunk size         |
| ``02`` | 1    | 07       | Stream format      |
| ``03`` | 1    | 08       | Stream compression |
| ``04`` | 3    | 00 01 21 | Stream size        |

Stream size in bytes is mandatory if the stream is compressed.

If the stream size is not specified, the field should be filled with zeroes.

Additionally, frame size might be included where each frame data block has a constant length,
which is important for frame dump formats like RAW8.

| Offset | Size | Example  | Description        |
|--------|------|----------|--------------------|
| ``00`` | 1    | 'S'      | Chunk type         |
| ``01`` | 1    | 05       | Chunk size         |
| ``02`` | 1    | 08       | Stream format      |
| ``03`` | 1    | 00       | Stream compression |
| ``04`` | 3    | 00 00 00 | Stream size        |
| ``07`` | 1    | 09       | Frame size         |

When no compression is used and frame size is not relevant, this block can be minimized.

| Offset | Size | Example | Description   |
|--------|------|---------|---------------|
| ``00`` | 1    | 'S'     | Chunk type    |
| ``01`` | 1    | 00      | Chunk size    |
| ``02`` | 1    | 07      | Stream format |

## Stream Data Chunk

| Offset | Size | Example   | Description          |
|--------|------|-----------|----------------------|
| ``00`` | 1    | 'd'       | Chunk type           |
| ``01`` | 3    | 00 01 FF  | Chunk size (3 bytes) |
| ``04`` | N    | 512 bytes | Stream data          |

## Stream Format Value

| Name   | Code | Chip  | Description                                                      |
|--------|------|-------|------------------------------------------------------------------|
| RAW8   | 08   | ANY   | Dump of all the register values one by one, frame by frame       |
| REG7   | 07   | ANY   | Register number and value pairs with frame delimiter and delay   |
| REG7N  | 17   | ANY   | REG7 variant with negative frame delays (CPU-friendly)           |
| TIA    | 26   | TIA   | TIA optimized stream format with combined register pairs         |
| POKEY4 | 04   | POKEY | Specific to POKEY where register number is stored in 4 bits only |

## Stream Data Types

There are two types of stream data.

The first type is a dump format.
In this format, each frame contains complete values for all registers relevant to the given sound chip model.

The RAW8 and TIA formats are dump formats.

The second type is a differential format.
In this format, the data for a given frame contains only the values of registers that differ from the previously set state.

The REG7, REG7N, and POKEY4 formats are differential formats.
This means that the data is a log of register value change writes.

At the beginning of playback, the player must set all registers of the sound chip to their initial values.
In most cases, the initial value is simply zero.
However, there may be exceptions specific to a given sound chip.
For example, the SKCTL register in the POKEY chip requires a specific reset sequence.
See the Player Implementation section for the complete chip reset procedure.

From the very first frame, the change log contains only the data of those registers whose values must be set in that given frame.

## RAW8 Stream Format

Simple dump of the values of all registers frame by frame.

This is a very inefficient data storage format, although it can still be useful for diagnostic purposes. 

It is important to include frame size information in stream definition chunk.
If it is not specified or set to 0 the default size of the frame will be used which depends on the chip type.

The default size of the frame depends on the type of chip and can be 9 bytes for ``POKEY``
if it doesn't include ``STIMER`` nor ``SKCTL``, 11 or 14 bytes for ``AY``, or even 25 bytes for ``SID``.

### POKEY Frame Layout

For POKEY chip, the standard 9-byte frame layout consists of registers at offsets ``00`` through ``08`` in sequential order:

1. ``AUDF1``
2. ``AUDC1``
3. ``AUDF2``
4. ``AUDC2``
5. ``AUDF3``
6. ``AUDC3``
7. ``AUDF4``
8. ``AUDC4``
9. ``AUDCTL``

Registers ``STIMER`` and ``SKCTL`` are not included in the 9-byte stream.

**Example POKEY RAW8 Frame**:

```
FF FF C7 65 A6 65 A6 50 E6
```

Represents:
- AUDF1: FF
- AUDC1: FF
- AUDF2: C7
- AUDC2: 65
- AUDF3: A6
- AUDC3: 65
- AUDF4: A6
- AUDC4: 50
- AUDCTL: E6

## REG7 Stream Format

This is the default format for storing stream data. Inspired by formats such as ``PSG`` and ``VGM``.

Data consists of sequential register number and value pairs.

Each pair contains:

- **Register address** (1 byte): Valid range 0x00-0x7F (0-127)

- **Register value** (1 byte): Value to write to the specified register

When the high bit (bit 7) of the register address byte is set (values 0x80-0xFF), that byte is a frame delimiter.

The frame delimiter byte signals that all subsequent register writes belong to the next or a later frame.

| Value   | Meaning                        |
|---------|--------------------------------|
| ``$80`` | End of frame, 1 frame delay    |
| ``$81`` | End of frame, 2 frames delay   |
| ``$82`` | End of frame, 3 frames delay   |
| ``$FF`` | End of frame, 128 frames delay |

The lower 7 bits (0x00-0x7F) specify additional frame delays beyond the current frame.

**Example Sequence**

```
00 A4    ; Write 0xA4 to register 0x00
01 8F    ; Write 0x8F to register 0x01
80       ; End of frame, 1 frame delay
00 B2    ; Write 0xB2 to register 0x00
82       ; End of frame, 3 frames delay
```

**Extended Delays**

Since a single frame delimiter can encode a maximum delay of 128 frames (value ``$FF``),
delays exceeding 128 frames must be split across multiple consecutive frame delimiters.

For example, to encode a 200-frame delay:

```
FF       ; End of frame, 128 frames delay
C7       ; End of frame, 72 frames delay
         ; Total delay: 128 + 72 = 200 frames
```

## REG7N Stream Format

This format is a counterpart to the **REG7** format but uses a different frame delimiter scheme.

Instead of using the high bit (0x80-0xFF) as frame delimiters, it uses negative values (0x80-0xFF)
to represent frame delays.

### Frame Delimiter System

In REG7N format, values from 0x80 to 0xFF are interpreted as frame delay indicators:

| Value  | Description                    |
|--------|--------------------------------|
| ``FF`` | End of frame, 1 frame delay    |
| ``FE`` | End of frame, 2 frames delay   |
| ``FD`` | End of frame, 3 frames delay   |
| ``82`` | End of frame, 126 frames delay |
| ``81`` | End of frame, 127 frames delay |
| ``80`` | End of frame, 128 frames delay |

### Delay Calculation

The frame delay is calculated as: ``delay_frames = 256 - delimiter_value``

- **FF (255)**: 256 - 255 = 1 frame delay
- **FE (254)**: 256 - 254 = 2 frames delay
- **FD (253)**: 256 - 253 = 3 frames delay
- **82 (130)**: 256 - 130 = 126 frames delay
- **81 (129)**: 256 - 129 = 127 frames delay
- **80 (128)**: 256 - 128 = 128 frames delay

### Comparison with REG7

| Format | Delimiter Value Range | Delay Direction | Example           |
|--------|-----------------------|-----------------|-------------------|
| REG7N  | 0x80-0xFF             | Negative        | ``FF`` (1 frame)  |
| REG7N  | 0x80-0xFF             | Negative        | ``FE`` (2 frames) |
| REG7N  | 0x80-0xFF             | Negative        | ``FD`` (3 frames) |
| REG7   | 0x80-0xFF             | Positive        | ``82`` (3 frames) |
| REG7   | 0x80-0xFF             | Positive        | ``81`` (2 frames) |
| REG7   | 0x80-0xFF             | Positive        | ``80`` (1 frame)  |

### Advantages

- **Intuitive timing**: Lower hex values mean longer delays
- **Consistent range**: Uses the same 0x80-0xFF range as REG7
- **Easy conversion**: Simple mathematical transformation between formats

It might be easier to check the highest bit (7) and count upwards to 0 without performing 
logical AND operation to clear the bit or compare values while counting the delay.

### Example Sequence

```
00 A4    ; Write 0xA4 to register 0x00
01 8F    ; Write 0x8F to register 0x01
FF       ; End of frame, 1 frame delay
00 B2    ; Write 0xB2 to register 0x00
FD       ; End of frame, 3 frames delay
```

## TIA Stream Format

This is an optimized format specifically designed for the **TIA** (Television Interface Adapter) chip used in Atari 2600 console.

The TIA chip has two independent sound channels and uses 6 registers to control sound generation.

- ``AUDC0`` and ``AUDC1`` (Audio Control) - 4 lower bits set distortion type
- ``AUDF0`` and ``AUDF1`` (Audio Frequency) - 5 lower bits specify frequency divider
- ``AUDV0`` and ``AUDV1`` (Audio Volume) - 4 lower bits set volume level

### Combined Register Pairs

TIA stream format combines related registers AUDC with AUDV into a single byte for optimized storage.

- **AUDX0** = ``AUDC0`` (shifted to upper 4 bits) + ``AUDV0`` (lower 4 bits)
- **AUDX1** = ``AUDC1`` (shifted to upper 4 bits) + ``AUDV1`` (lower 4 bits)

### Frame Organization

Each data frame consists of exactly 4 bytes.

1. **AUDF0** (Audio frequency channel 0)
2. **AUDX0** (Combined audio control + volume channel 0)
3. **AUDF1** (Audio frequency channel 1)
4. **AUDX1** (Combined audio control + volume channel 1)

### Wait Mechanism

The TIA stream format includes a built-in wait mechanism using the first byte of each frame.

- If AUDF0 has bit 7 set (value ≥ 128), it indicates a delay of additional frames
- The wait value is calculated as: ``wait_frames = DELAY - 127``
- When DELAY = 128 it means 1 additional frame (2 frames total)
- When DELAY = 129 it means 2 additional frames (3 frames total)
- When DELAY = 255 it means 128 additional frames (129 frames total)

## POKEY4 Stream Format

This is a special experimental format dedicated to the ``POKEY`` chip.

It should not be used for purposes other than diagnostics.

Since the ``POKEY`` circuit might use only 9 registers, not counting the values
for the ``STIMER`` and ``SKCTL``, the register number fits into a 4-bit value,
leaving several codes available for volume-only updates.

Tests indicate that this format offers little compression benefit and increases playback complexity.

| Bits     |        | Description                                                |
|----------|--------|------------------------------------------------------------|
| ``0000`` | AUDF1  | Next byte is value for AUDF1                               |
| ``0001`` | AUDC1  | Next byte is value for AUDC1                               |
| ``0010`` | AUDF2  | Next byte is value for AUDF2                               |
| ``0011`` | AUDC2  | Next byte is value for AUDC2                               |
| ``0100`` | AUDF3  | Next byte is value for AUDF3                               |
| ``0101`` | AUDC3  | Next byte is value for AUDC3                               |
| ``0110`` | AUDF4  | Next byte is value for AUDF4                               |
| ``0111`` | AUDC4  | Next byte is value for AUDC4                               |
| ``1000`` | AUDCTL | Next byte is value for AUDCTL                              |
| ``1001`` | AUDV1  | Next nibble is volume part of AUDC1                        |
| ``1010`` | AUDV2  | Next nibble is volume part of AUDC2                        |
| ``1011`` | AUDV3  | Next nibble is volume part of AUDC3                        |
| ``1100`` | AUDV4  | Next nibble is volume part of AUDC4                        |
| ``1101`` |        | End of frame, next byte is how many frames to skip (1-256) |
| ``1110`` |        | End of frame, next nibble how many frames to skip (1-16)   |
| ``1111`` |        | End of frame (no skip)                                     |

## Stream Compression Value

| Value  | Name | Description      |
|--------|------|------------------|
| ``00`` | RAW  | No compression   |
| ``04`` | LZ4  | LZ4 compression  |
| ``08`` | ZX0  | ZX0 compression  |
| ``10`` | LZSS | LZSS compression |

## Player Implementation

This section describes how a player should process a MAX file to produce sound.

### Initialization

Before replay begins, the player must prepare the sound hardware and all internal state.

**Parse the file header**

Read the 4-byte magic number at offset ``00`` and verify it matches ``'MAX '``.
Reject the file if the magic number does not match.

**Read the version chunk**

Locate the version chunk (type ``'V'``) and read the version number.
The player should verify that it supports the declared version.
If the version is unsupported, the player should reject the file or apply backward-compatible handling.

**Read chip setup chunks**

Locate all chip setup chunks (type ``'C'``).
Each chunk identifies a sound chip model, panning, update speed, and clock rate.
The player must configure each sound chip according to these parameters before processing any stream data.

**Read stream definition chunks**

Locate all stream definition chunks (type ``'S'``).
Each stream definition specifies the stream format, compression method, uncompressed stream size, and optional frame size.
The player must prepare the appropriate decoder for each stream based on these parameters.

### Chip Reset

At the beginning of replay, the player must reset all sound chips by zeroing every register.

This ensures that the differential formats (REG7, REG7N, POKEY4) start from a known state.
Since these formats only encode register changes relative to the previous state, the initial state must be deterministic.

**General reset procedure**

For each sound chip identified in the file:

1. Write zero to every programmable register.
2. Apply any chip-specific reset requirements described below.

**POKEY reset**

The POKEY chip requires a specific reset sequence for the ``SKCTL`` register.

1. Write ``0`` to ``SKCTL`` to disable all serial and timer functions.
2. Write ``3`` to ``SKCTL`` to re-enable the keyboard scan and two-tone mode with normal operation.

This two-step sequence ensures that the POKEY chip is fully reset and ready for replay.
Writing ``SKCTL`` to ``0`` first clears all internal state, and writing ``3`` restores the normal operating configuration expected by the stream data.

All other POKEY registers (``AUDF1``, ``AUDC1``, ``AUDF2``, ``AUDC2``, ``AUDF3``, ``AUDC3``, ``AUDF4``, ``AUDC4``, ``AUDCTL``) should be zeroed during reset.

### Stream Playback

After chip reset, the player processes each stream in order.

**Decompress the stream data**

If the stream definition specifies a compression method other than ``RAW`` (``00``), the player must decompress the stream data chunk (type ``'d'``) before parsing register writes.

The uncompressed stream size from the stream definition chunk indicates the expected output length after decompression.

**Parse register writes**

For dump formats (RAW8, TIA), each frame contains a fixed number of register values.
The player writes every value in the frame to the corresponding register.

For differential formats (REG7, REG7N, POKEY4), the player reads register number and value pairs until a frame delimiter is encountered.
Only the specified registers are written.
The frame delimiter indicates the end of the current frame and the delay before the next frame.

**Apply frame delays**

After processing all register writes in a frame, the player waits for the number of frames specified by the frame delimiter before processing the next frame.

The frame duration is determined by the chip update speed from the chip setup chunk.
For example, a 50 Hz update speed means each frame lasts 20 ms.

**Handle loop points**

If the file contains a loop chunk, the player should jump to the specified loop point when the end of the stream is reached.
If no loop chunk is present, playback stops at the end of the last stream.
