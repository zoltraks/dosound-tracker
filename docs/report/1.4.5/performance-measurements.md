# Performance Measurements

Generated report recording measured evidence for the quality targets declared
in `PROJECT.md`. Produced under change record
`change/1.4.5/measure-performance-targets.md`.

## Measurement Host

All measurements ran on the same host on 2026-11-10.

| Item    | Value                                           |
| ------- | ----------------------------------------------- |
| OS      | macOS, Darwin 27.2.0 arm64 (xnu-13432.41.4)     |
| Machine | Mac16,10 (Mac mini), Apple M4, 16 GB RAM        |
| Node    | v26.13.0                                        |
| Browser | Playwright 1.65.0 chromium, headless, 1280x800  |
| Serving | `npm run build`, `dist/` via `npx vite preview` |

## Application Load

**Target**

Application loads in under 2 seconds.

**Method**

`npm run build` produced `dist/`, served locally by
`npx vite preview --port 8177`. A Playwright chromium script loaded `/` with
`waitUntil: 'load'` across five fresh browser contexts. The primary measure is
`loadEventEnd` of the navigation performance entry; wall-clock time to the
`load` event is recorded alongside.

This measures local-serving time, not cold network deploy.

**Result**

| Run | Navigation loadEventEnd | Wall to load event |
| --- | ----------------------- | ------------------ |
| 1   | 55 ms                   | 58 ms              |
| 2   | 32 ms                   | 33 ms              |
| 3   | 33 ms                   | 34 ms              |
| 4   | 32 ms                   | 34 ms              |
| 5   | 33 ms                   | 35 ms              |

Median document-complete time: 33 ms navigation, 34 ms wall. The target of
under 2000 ms is met with a wide margin on this host.

## Song File Size

**Target**

Song file size under 100KB for typical compositions.

**Method**

`wc -c` over the bundled default song, the committed test fixtures, and the
public song repository files.

**Result**

| File                                         | Bytes |
| -------------------------------------------- | ----- |
| `src/assets/song.yaml`                       | 9458  |
| `test/fixtures/bundled-song.yaml`            | 9458  |
| `test/fixtures/song-vgm-noise.yaml`          | 1561  |
| `test/fixtures/song-vgm-tone.yaml`           | 501   |
| `public/repository/song/Arp_Loop.song.yaml`  | 9479  |
| `public/repository/song/Billy.song.yaml`     | 28076 |
| `public/repository/song/Nice_Song.song.yaml` | 4427  |
| `public/repository/song/Warmball.song.yaml`  | 10759 |

The largest measured composition is 28076 bytes, about 28 percent of the
100KB budget. The target holds for every committed composition.

## Byte-Identical Export Output

**Target**

Export output byte-identical for the same input song.

**Method**

Existing verification, cited rather than duplicated. The fixture suites under
`test/exports/` - exportVgm, exportMax, exportWav, and exportAssemblyOptimized
among them - assert exact emitted bytes and fields against expected values
for fixed input songs. All exporters derive their byte stream from
`simulateSong` in `src/utils/playback/playbackSimulation.ts`, whose register
stream was measured deterministic below.

**Result**

`npx vitest run test/exports/ test/workers/sequencerWorker.test.ts` passed 57
tests across 12 files. Two consecutive `simulateSong` runs over the bundled
song emitted frame-for-frame identical register streams.

## Zero Audio Glitches

**Target**

Audio playback with zero glitches during normal operation.

**Method**

The claim is observational, so a playback-simulation proxy stands in for a
listening measure. A script drives `simulateSong` over the bundled song
(`src/assets/song.yaml`) and records per-tick register frames, run twice for
determinism. `test/workers/sequencerWorker.test.ts` covers the sequencer
worker timing that schedules real playback.

**Result**

| Measure                    | Value          |
| -------------------------- | -------------- |
| Simulated ticks (frames)   | 768            |
| Register streams identical | yes, both runs |
| Simulation cost per tick   | 0.0023 ms      |
| Real-time budget per tick  | 20 ms (50 Hz)  |
| Emulated song duration     | 15360 ms       |

Sequencer and envelope math produces stable per-tick output at roughly four
orders of magnitude under the real-time budget. This is simulation-level
evidence, not a listening record. Structured manual listening during real
playback stays the verification path for audible glitches on actual output.

## DOSOUND Hardware Compatibility

**Target**

Assembly export compatible with the DOSOUND replay routine on Atari ST
hardware, optimized for minimal memory usage.

**Method**

Not measurable locally - the project has no device-in-loop Atari ST access.
The verification path is recorded instead.

**Result**

Design evidence plus a named manual step. `src/exports/asm.ts` and
`src/exports/bin.ts` emit the DOSOUND XBIOS byte stream of register writes and
delay markers documented in `FORMAT.md` under EXPORT DATA and EXPORT BIN, and
`test/exports/` verifies that stream structure including silencing, delay
coalescing, and the STOP marker. The remaining check - replaying an exported
binary under the DOSOUND routine on real Atari ST hardware - is an owner-side
manual step outside local measurement.
