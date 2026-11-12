# DOSOUND Tracker

## Quick Overview

**DOSOUND Tracker** is a three-track chiptune music tracker built around the Yamaha YM2149 Programmable Sound Generator, designed for retro computing enthusiasts, chiptune composers, and anyone who appreciates the raw, unfiltered sound of retro synthesis.

Its core feature is exporting music data directly into the assembly format compatible with the DOSOUND function of the XBIOS subsystem on the Atari ST's TOS operating system. Additional exports cover binary command streams, VGM, MAX, WAV audio, register dumps, and single instruments.

For more information take a look at the manual for composers and assembly wizards:

- [MANUAL.md](public/MANUAL.md)

The exported assembly format and a commented `dc.b` example live in `MANUAL.md` under "DOSOUND Command Stream".

## Downloads

- **Electron desktop builds** can be downloaded from the project home page: https://dosound.alyx.pl
- Binaries are not code-signed - see `MANUAL.md` for the macOS quarantine workaround.

## Makers & Takers

Made by **Zoltar X / New Generation** using **Windsurf** and **GPT 5.1**.

## Development Environment

- **Node.js**: >= 26.13.0
- **npm**: >= 11.20.0

The declared versions are floors: `package.json` `engines` admits them and
newer, `.nvmrc` pins the exact Node version, and `.npmrc` enforces the floor
at install time.

## Documentation

This project follows an Agentic Software Engineering (ASE) documentation structure. All documentation lives under `docs/`.

Agents start with the [tiered read order](docs/GUIDELINES.md#read-guidelines-by-tier). For a work request without a task, follow [Intake Standby](docs/WORKFLOW.md#intake-standby) and ask what the user wants done.

_Built with dedication to authentic retro computing and the timeless appeal of 8-bit chiptune music. Every envelope, every register write, every frequency calculation aims to capture the pure essence of what made the YM2149 chip a cornerstone of computer music history._

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
