# DOSOUND TRACKER

## Overview

**DOSOUND Tracker** is a music application designed for retro computing enthusiasts and chiptune developers. 

It functions as a complete **three-track music tracker** that leverages the unique audio capabilities of the **Yamaha YM2149** Programmable Sound Generator (PSG).

The application's core feature is its ability to **export music data directly into the assembly format** compatible with the **DOSOUND** function of the **XBIOS** subsystem on the **Atari ST's TOS** operating system.

**Author:** ZoltarX / New Generation

## Features

**Three Track System:** Supports composition across three independent audio channels (Tracks A, B, and C).

**Playlist Arrangement:** Utilizes a standard tracker **playlist** to define the sequence of single-track patterns for the entire song arrangement.

**Data Export:** Allows exporting the full song or individual instrument definitions into a raw **assembly language data format** (`dc.b` directives), ready to be included and played back by custom Atari ST software.

**Data Management:** Supports loading and saving complete songs or individual instrument definitions.

## Instrument Parameters

The instrument editor provides granular control over the YM2149's parameters, editable on a timeline:

**Volume Envelope:** Define the amplitude over time for precise sound shaping (similar to ADSR).

**Tone/Noise Selection:** Choose between **tone** (square wave) or **noise** generation.

**Noise Generator Value:** Optional setting for the noise register.

**Vibrato:** Control the **pitch deviation (cents)** for vibrato effects.

**Arpeggio:** Define pitch shifts using **semitone offsets** to create arpeggiated patterns.

## Timing Modes

The tracker is designed around the Atari ST's system timing but offers flexibility.

**Standard Playback Rate:** The application plays back sounds at a base frequency of **50 Hz** (synchronized with the ST's VBLANK interrupt).

**DOSOUND Mode (Default):** This mode respects a critical limitation of the system **DOSOUND** function, where the smallest supported delay is **2 VBL cycles** (delay value of 1). Consequently, the smallest unit of time in this mode is **1/25th of a second**.

**Fast Mode (DOSOUND Disabled):** By disabling the strict DOSOUND timing constraint, the minimum time unit becomes **1/50th of a second**, allowing for finer temporal resolution.
*Note*: Music created in this mode **cannot** be guaranteed to play back correctly using the system's native XBIOS DOSOUND function.

## Project Guidelines

All detailed guidelines regarding code style, component structure, YM2149 emulation, and DOSOUND implementation are located in the `docs/` directory.

Please refer to the `docs/GUIDELINES.md` file when making changes.

## Technology Stack

**Frontend:** React (for UI/Component structure)

**Audio/Emulation:** Web Audio API, custom YM2149/DOSOUND JavaScript modules.

## Development Methodology

This project was developed using AI-assisted programming methodology, combining human creativity and direction with AI-powered code generation and assistance.

## Assembly Format

The exported data stream is a sequence of register addresses and values (`$XX,$YY`) followed by a delay command (`$FF, <delay>`).

```assembly
music:

    ; === LINE 00 ===

    ; --- PART 00 ---

    dc.b $7,$1c       ; MX T+T+N
    dc.b $1,$1,$0,$aa ; TA D-4
    dc.b $8,$C        ; VA
    dc.b $9,$0        ; VB
    dc.b $A,$0        ; VC
    dc.b $ff,1        ; DL 2
    dc.b $8,$8        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$4        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$2        ; VA
    dc.b $ff,1        ; DL 2

    ; --- PART 01 ---

    dc.b $1,$1,$0,$1c ; TA A-4
    dc.b $8,$C        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$8        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$4        ; VA
    dc.b $ff,3        ; DL 4

    ; --- PART 02 ---

    dc.b $1,$0,$0,$d5 ; TA D-5
    dc.b $8,$E        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$A        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$6        ; VA
    dc.b $ff,3        ; DL 4

    ; --- PART 03 ---

    dc.b $1,$1,$0,$aa ; TA D-4
    dc.b $8,$C        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$8        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$4        ; VA
    dc.b $ff,3        ; DL 4

    ; --- PART 04 ---

    dc.b $1,$1,$0,$1c ; TA A-4
    dc.b $8,$C        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$8        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$4        ; VA
    dc.b $ff,3        ; DL 4

    ; === END OF SONG ===

    dc.b $8,$0        ; VA
    dc.b $9,$0        ; VB
    dc.b $A,$0        ; VC

    dc.b $ff,0
```
