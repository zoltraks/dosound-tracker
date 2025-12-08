# MAX File Structure and Format Specification

## Document Information

**Version**: 1.1

**Date**: 2025-12-08

**State**: Release Candidate 2

## Version History

| Date           | Version     |
|----------------|-------------|
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

**MAX**, an acronym for **Music Audio eXchange**, is a comprehensive audio file format designed for authentic playback of computer music using original sound chips.

Unlike executable music formats like **SID**, **SAP**, **SNDH**, **NSF**, this format is a register-change log format similar to **VGM**, designed to drive sound chips directly through their register interfaces.

## Design Principles

**Authenticity**: Uses original chip register interfaces for accurate sound reproduction

**Efficiency**: Multiple stream formats optimized for different chip types and compression ratios

**Extensibility**: Chunk-based structure supporting future enhancements

**Hardware Integration**: Designed for ST-MAX device with direct hardware register access

**Multi-chip Support**: Handles complex setups with multiple sound chips simultaneously

## Chunk Structure

File data consists of a sequence of chunks.

Chunk is a block of data with a specific type and size.
Each chunk has a header containing a type identifier and size information.

| Size              | Value  | Type       |
|-------------------|--------|------------|
| 1 byte            | letter | Chunk type |
| 1 byte or 3 bytes | N-1    | Chunk size |
| N bytes           | *      | Chunk data |

Chunk type is a single byte ASCII character.
There are two types of chunks: short, up to 256 bytes of data, and long, up to 1677216 bytes of data.
To distinguish between them, short chunk type is a uppercase letter and long chunk type is an lowercase letter.

Chunk size specifies the number of data bytes decremented by 1.

Generally chunk order is not important, but the version chunk should be one of the first chunks in the file because of the format version number specified.

## Number Format

Multi-byte numbers are written in the Big Endian byte order standard.

This means that when a number consisting of multiple bytes like 32-bit integer 0x0A0B0C0D is stored, the most significant byte (MSB) comes first in the data stream.

## File Header

This is the begining of the file.

| Offset | Size | Example | Description     |
|--------|------|---------|-----------------|
| 0      | 4    | 'MAX '  | Magic number    |

## Version Chunk

This chunk specifies the format version.

| Offset | Size | Example | Description             |
|--------|------|---------|-------------------------|
| 0      | 1    | 'V'     | Chunk type              |
| 1      | 1    | 00      | Chunk size              |
| 2      | 1    | 01      | Version number          |

## Information Chunk

Additional information about music like composer (author), title and year of the song can be stored in this block.

| Offset | Size | Example   | Description      |
|--------|------|-----------|------------------|
| 0      | 1    | 'I'       | Chunk type       |
| 1      | 1    | 04        | Chunk size       |
| 2      | 5    | 'A Me' 00 | Information data |

Information data consists of a byte array representing characters using ASCII or UTF-8 encoding (without BOM).

This array consists of one or more lines terminated by a null byte.

Each line begins with one character specifying the type of information (title, author, year), followed by ace character and the corresponding value.

Maximum size of chunk is 256 bytes.

```
Title: My song
Author: Unknown
Year: 2024
```

In this example information would be encoded as:

``T My song`` ``00`` ``A Unknown`` ``00`` ``Y 2024`` ``00``.

## Chip Setup Chunk

This block specifies sound chip that is being used.

It may appear as many times in file as many chips are used.

| Offset | Size | Example | Description  |
|--------|------|---------|--------------|
| 0      | 2    | 'C'     | Chunk type   |
| 2      | 2    | 03      | Chunk size   |
| 4      | 1    | BB      | Chip model   |
| 5      | 1    | 03      | Chip panning |
| 6      | 2    | 00 32   | Chip speed   |

Chip update speed is defined in Hz.

Typical values are 50 (PAL VBL) and 60 (NTSC VBL) but multiplies can be used like 100 or 200.

Additional settings might be included in extended configuration.

Extended configuration is specific to chip type. 

Values for one chip type may have different meaning for another chip type.

### POKEY extension

In case of **POKEY** chip there is an additional 4 bytes of data that specify chip clock.

| Offset | Size | Example     | Description |
|--------|------|-------------|-------------|
| 8      | 4    | 00 1B 0F 87 | Chip clock  |

If chip clock is not specified it should be filled with all zeroes.

Two possible values for POKEY chip are ``00`` ``1B`` ``0F`` ``87`` for 1,77 MHz **PAL** clock and ``00`` ``1B`` ``4F`` ``4C`` for 1,79 MHz **NTSC** clock.

## Chip Model Value

These values are magic constants for different types of sound chips.

| Value | Family | Description    |
|-------|--------|----------------|
| BB    | POKEY  | POKEY          |
| A0    | AY     | AY 8910        |
| A9    | AY     | YM 2149        |
| AA    | SID    | SID 8650 (new) |
| AB    | SID    | SID 6581 (old) |

## Chip Register Maps

The following tables define the register addresses and names for each supported sound chip type.

### POKEY Register Map

| Offset | Name      | Description                    |
|--------|-----------|--------------------------------|
| $00    | AUDF1     | Audio frequency divider 1      |
| $01    | AUDC1     | Audio control 1                |
| $02    | AUDF2     | Audio frequency divider 2      |
| $03    | AUDC2     | Audio control 2                |
| $04    | AUDF3     | Audio frequency divider 3      |
| $05    | AUDC3     | Audio control 3                |
| $06    | AUDF4     | Audio frequency divider 4      |
| $07    | AUDC4     | Audio control 4                |
| $08    | AUDCTL    | Audio control global           |
| $09    | STIMER    | Sample timer                   |
| $0F    | SKCTL     | Serial port control            |

### SID Register Map

| Offset | Name     | Description                    |
|--------|----------|--------------------------------|
| $00    | FREQLO1  | Frequency low byte voice 1     |
| $01    | FREQHI1  | Frequency high byte voice 1    |
| $02    | PWLO1    | Pulse width low byte voice 1   |
| $03    | PWHI1    | Pulse width high byte voice 1  |
| $04    | CR1      | Control register 1             |
| $05    | AD1      | Attack/Decay voice 1           |
| $06    | SR1      | Sustain/Release voice 1        |
| $07    | FREQLO2  | Frequency low byte voice 2     |
| $08    | FREQHI2  | Frequency high byte voice 2    |
| $09    | PWLO2    | Pulse width low byte voice 2   |
| $0A    | PWHI2    | Pulse width high byte voice 2  |
| $0B    | CR2      | Control register 2             |
| $0C    | AD2      | Attack/Decay voice 2           |
| $0D    | SR2      | Sustain/Release voice 2        |
| $0E    | FREQLO3  | Frequency low byte voice 3     |
| $0F    | FREQHI3  | Frequency high byte voice 3    |
| $10    | PWLO3    | Pulse width low byte voice 3   |
| $11    | PWHI3    | Pulse width high byte voice 3  |
| $12    | CR3      | Control register 3             |
| $13    | AD3      | Attack/Decay voice 3           |
| $14    | SR3      | Sustain/Release voice 3        |
| $15    | FCLO     | Filter cutoff low              |
| $16    | FCHI     | Filter cutoff high             |
| $17    | FILTER   | Filter resonance and routing   |
| $18    | VOLUME   | Master volume                  |

### AY/YM Register Map

| Offset | Name                | Description                           |
|--------|---------------------|---------------------------------------|
| $00    | FREQ_FINE_A         | Channel A frequency fine adjustment   |
| $01    | FREQ_HIGH_A         | Channel A frequency coarse adjustment |
| $02    | FREQ_FINE_B         | Channel B frequency fine adjustment   |
| $03    | FREQ_HIGH_B         | Channel B frequency coarse adjustment |
| $04    | FREQ_FINE_C         | Channel C frequency fine adjustment   |
| $05    | FREQ_HIGH_C         | Channel C frequency coarse adjustment |
| $06    | NOISE               | Noise generator control               |
| $07    | MIXER               | I/O mixer/enable                      |
| $08    | VOLUME_A            | Channel A volume                      |
| $09    | VOLUME_B            | Channel B volume                      |
| $0A    | VOLUME_C            | Channel C volume                      |
| $0B    | ENVELOPE_FINE       | Envelope fine adjustment              |
| $0C    | ENVELOPE_HIGH       | Envelope coarse adjustment            |
| $0D    | ENVELOPE_SHAPE      | Envelope shape                        |
| $0E    | IO_A                | Port A data                           |
| $0F    | IO_B                | Port B data                           |

## Stereo Panning Value

This value determines on which stereo channel a given chip plays.

If this value is not specified, the playback program will decide on its own.

As a rule, in a multi-speaker configuration, odd-numbered units play on the left channel, and even-numbered units play on the right.

In the case of a single-unit stream, it is better to leave this value empty.

| Value | Panning       |
|-------|---------------|
| 00    | Not Specified |
| 01    | Front Left    |
| 02    | Front Right   |
| 03    | Center        |
| 04    | Rear Left     |
| 05    | Rear Right    |

## Stream Definition Chunk

This section specifies format and optional compression for each stream for each chip used.

| Offset | Size | Example | Description        |
|--------|------|---------|--------------------|
| 0      | 1    | 'S'     | Chunk type         |
| 1      | 1    | 01      | Chunk size         |
| 2      | 1    | 07      | Stream format      |
| 3      | 1    | 08      | Stream compression |

This block can have more data if it specifies original data length.

| Offset | Size | Example  | Description        |
|--------|------|----------|--------------------|
| 0      | 1    | 'S'      | Chunk type         |
| 1      | 1    | 04       | Chunk size         |
| 2      | 1    | 07       | Stream format      |
| 3      | 1    | 08       | Stream compression |
| 4      | 3    | 00 01 21 | Stream size        |

Stream size in bytes is mandatory if the stream is compressed.

When compression is not used, this block can be even more minimized.

| Offset | Size | Example | Description        |
|--------|------|---------|--------------------|
| 0      | 1    | 'S'     | Chunk type         |
| 1      | 1    | 00      | Chunk size         |
| 2      | 1    | 07      | Stream format      |

## Stream Data Chunk

| Offset | Size | Example   | Description          |
|--------|------|-----------|----------------------|
| 0      | 1    | 'd'       | Chunk type           |
| 1      | 3    | 00 01 FF  | Chunk size (3 bytes) |
| 4      | N    | 512 bytes | Stream data          |

## Stream Format Value

| Name   | Code | Chip  | Description                                                                            |
|--------|------|-------|----------------------------------------------------------------------------------------|
| REG7   | 07   |       | Register number (0-127) followed by register value (0-127) or (128-255) as frame delay |
| RAW8   | 08   |       | Dump of the values of all the registers one by one                                     |
| POKEY4 | 04   | POKEY | Specific to POKEY where register number is stored in 4 bits only                       |

### REG7

Data consists of the register number and the value in sequence. 

Register number can range from 0 to 127. 
If the highest bit of the register number is set, the value determines the end of the data.
Lower 7 bits determine additional delay.

Value ``$80`` simply means the end of the data frame.

This is the default format for storing stream data.
It is inspired by formats such as ``PSG`` and ``VGM``.

### RAW8

Simple dump of the values of all registers frame by frame.

This is a very inefficient data storage format, although it can still be useful for diagnostic purposes. 

The size of the frame, unfortunately, depends on the type of chip and can be 9 bytes for ``POKEY`` (it doesn't include ``STIMER`` nor ``SKCTL``), 14 bytes for ``AY``, or even 25 bytes for ``SID``.

### POKEY4

This is special, experimental format, dedicated to ``POKEY`` chip. 

It should not be used for other than diagnostic purposes.

Since the ``POKEY`` circuit might use only 9 registers, not counting the values for the ``STIMER`` and ``SKCTL``, register number fits into a 4-bit value, leaving a few values that can only be used to change the channel volume.

Tests so far indicate that this format is not very efficient for compression purposes and complicates the playback routine.

| Bits |        | Description                                                |
|------|--------|------------------------------------------------------------|
| 0000 | AUDF1  | Next byte is value for AUDF1                               |
| 0001 | AUDC1  | Next byte is value for AUDC1                               |
| 0010 | AUDF2  | Next byte is value for AUDF2                               |
| 0011 | AUDC2  | Next byte is value for AUDC2                               |
| 0100 | AUDF3  | Next byte is value for AUDF3                               |
| 0101 | AUDC3  | Next byte is value for AUDC3                               |
| 0110 | AUDF4  | Next byte is value for AUDF4                               |
| 0111 | AUDC4  | Next byte is value for AUDC4                               |
| 1000 | AUDCTL | Next byte is value for AUDCTL                              |
| 1001 | AUDV1  | Next nibble is volume part of AUDC1                        |
| 1010 | AUDV2  | Next nibble is volume part of AUDC2                        |
| 1011 | AUDV3  | Next nibble is volume part of AUDC3                        |
| 1100 | AUDV4  | Next nibble is volume part of AUDC4                        |
| 1101 |        | End of frame, next byte is how many frames to skip (1-256) |
| 1110 |        | End of frame, next nibble how many frames to skip (1-16)   |
| 1111 |        | End of frame (no skip)                                     |

## Stream Compression Value

| Name | Code | Description      |
|------|------|------------------|
| RAW  | 00   | No compression   |
| ZX0  | 08   | ZX0 compression  |
| LZSS | 10   | LZSS compression |
