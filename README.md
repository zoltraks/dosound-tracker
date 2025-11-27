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

**Mode:** Choose between **tone** (square wave) or **noise** generation.

**Volume:** Define the amplitude over time for precise sound shaping (similar to ADSR).

**Arpeggio:** Define pitch shifts using **semitone offsets** to create arpeggiated patterns.

**Pitch:** Control the **pitch deviation (cents)** for vibrato effects.

**Noise:** Optional setting for the noise register.

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
