# MAX Export with ZX0 Compression Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.2.7/max-export.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Props interface named with `Props` suffix
- Destructure props in function signature
- Maintain accessibility with proper ARIA attributes
- Keep components focused on single responsibility
- No abbreviations in identifiers (use full words)

## Audio-Critical Requirements

This section is mandatory for changes that affect audio playback, timing, or the sequencer. Delete this section if the change does not involve audio.

- Does this change affect React render timing? **No.** The change is confined to the export pipeline (`src/exports/max.ts`) and a new pure utility module (`src/utils/zx0.ts`). No React components, hooks, or stores are modified.
- Does this modify `useCallback` or `useMemo` dependencies? **No.**
- Does this change state management patterns in audio paths? **No.** The export reads from `simulateSong`, which is a pure function and does not mutate live playback state.
- Does this modify the YM2149 emulator or SoundDriver? **No.** The simulation is consumed read-only.
- Must audio playback be manually tested after the change? **No.** Playback is unaffected. The exported `.max` file should be verified by round-trip decompression and by visual inspection of the byte stream against `MAX.md` examples.

Consult `GUIDELINES.md` for the audio-critical development principles before making any changes to audio-related code.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications. Update only the files affected by this change.

- `PROJECT.md` — no change. The MAX export feature is already listed; only its internal behaviour changes.
- `ARCHITECTURE.md` — no change. No new modules are added to the architecture diagram; `src/utils/zx0.ts` is a leaf utility with no callers other than `src/exports/max.ts`.
- `SPECIFICATION.md` — update the MAX export entry to reflect ZX0 compression, 14-register frames, and the corrected REG7 delimiter encoding.
- `FORMAT.md` — rewrite the `EXPORT MAX` section to document the three strategy-to-format mappings, the ZX0 compression byte (`0x08`), the 14-register frame width, the single-byte REG7 delimiter, and the mandatory stream-size field in the stream definition chunk.

## Type and State Updates

**Type definitions**

No new TypeScript interfaces or type aliases are required. The existing `MaxExportResult` interface in `src/exports/max.ts` remains valid. The ZX0 module exports plain functions operating on `Uint8Array`.

**State store modifications**

No store changes. The export pipeline is stateless and invoked on user demand.

## Step by Step Implementation

### Step 1 — Port the ZX0 compressor and decompressor

Port the BSD 3-Clause licensed ZX0 v2 optimal compressor from `pet-lab/src/utils/zx0.ts` into `dosound-tracker/src/utils/zx0.ts`. The port is a verbatim copy of the algorithm with the original attribution header preserved, because the two projects share a compatible license (MIT) and the ZX0 reference itself is BSD 3-Clause.

File to create: `src/utils/zx0.ts`.

```typescript
/**
 * ZX0 v2 optimal compressor and decompressor.
 *
 * Algorithm ported from Einar Saukas's Salvador reference implementation,
 * BSD 3-Clause licensed.
 *   Source: https://github.com/einar-saukas/ZX0
 *   (c) Copyright 2021 by Einar Saukas. All rights reserved.
 *
 * This port preserves Salvador's dynamic-programming optimal parser and bit
 * stream emitter exactly, so output bytes match Salvador (v2 format, forward,
 * non-classic) byte-for-byte for any given input.
 */

const INITIAL_OFFSET = 1;
const MAX_OFFSET_ZX0 = 32640;

// ... (full port of optimize, compress, compressZX0, decompressZX0)
```

The public API is identical to `pet-lab`:

```typescript
export function compressZX0(
  input: Uint8Array,
  options?: { maxOffset?: number }
): Uint8Array;

export function decompressZX0(input: Uint8Array): Uint8Array;
```

`maxOffset` defaults to `MAX_OFFSET_ZX0` (32640). The MAX export will call `compressZX0(stream, { maxOffset: 1023 })` to constrain back-references to the 1024-byte ring-buffer window.

### Step 2 — Add a frame collector that captures every VBLANK tick

Replace the indirect path through `exportSongRegisterDump` (which captures every second tick) with a direct call to `simulateSong` that captures every tick. This produces one register snapshot per VBLANK interrupt (50 Hz), matching the MAX frame definition.

File to modify: `src/exports/max.ts`.

```typescript
import { simulateSong, type SimulationFrame } from '../utils/playbackSimulation';
import { normalizeSongForExport } from './core';

const MAX_REGISTER_COUNT = 14; // R0..R13 inclusive

function collectSimulationFrames(song: Song): SimulationFrame[] {
  const normalized = normalizeSongForExport(song);
  const frames: SimulationFrame[] = [];
  simulateSong(normalized, (frame) => {
    frames.push(frame);
  });
  return frames;
}

function frameToRegisterBytes(frame: SimulationFrame): number[] {
  const regs = frame.registers;
  const bytes: number[] = [];
  for (let reg = 0; reg < MAX_REGISTER_COUNT; reg++) {
    bytes.push((regs[reg] ?? 0) & 0xff);
  }
  return bytes;
}
```

The simulation does not currently populate R11, R12, or R13 (envelope period and shape). They default to `0`, which is valid. In REG7 format they will be emitted once in the first frame (diffed against the all-zero initial state) and never again, because they never change. In RAW8 format they will appear as three trailing zero bytes in every frame.

### Step 3 — Rewrite the REG7 stream encoder with single-byte delimiters

The current encoder emits a two-byte end-of-frame marker (`0x80, 0x80`). The correct REG7 format uses a **single** delimiter byte: the high bit signals "end of frame" and the low 7 bits encode `delay - 1` (so `0x80` = 1 frame, `0xFF` = 128 frames). Runs longer than 128 frames are split across multiple consecutive delimiter bytes.

File to modify: `src/exports/max.ts`.

```typescript
function encodeReg7Stream(frames: SimulationFrame[], optimizeDelays: boolean): number[] {
  const prev: number[] = new Array(MAX_REGISTER_COUNT).fill(0);
  const data: number[] = [];

  for (let frame = 0; frame < frames.length; frame++) {
    const regs = frameToRegisterBytes(frames[frame]);

    for (let reg = 0; reg < MAX_REGISTER_COUNT; reg++) {
      const value = regs[reg];
      if (frame === 0 || value !== prev[reg]) {
        data.push(reg & 0x7f, value & 0xff);
        prev[reg] = value;
      }
    }

    // Single-byte frame delimiter: 0x80 = 1 frame delay.
    data.push(0x80);
  }

  return optimizeDelays ? optimizeReg7Delays(data) : data;
}
```

The delay optimizer is rewritten to operate on the single-byte delimiter scheme. It scans for consecutive delimiter bytes and coalesces them into the minimal set of `0x80`–`0xFF` bytes, splitting runs > 128 frames.

```typescript
function optimizeReg7Delays(input: number[]): number[] {
  const out: number[] = [];
  let pendingDelay = 0;

  for (let i = 0; i < input.length; i++) {
    const byte = input[i] & 0xff;

    if (byte >= 0x80) {
      // Single-byte delimiter: low 7 bits = delay - 1.
      pendingDelay += (byte & 0x7f) + 1;
      continue;
    }

    // Flush accumulated delay before the next register write.
    flushDelay(out, pendingDelay);
    pendingDelay = 0;
    out.push(byte);
  }

  flushDelay(out, pendingDelay);
  return out;
}

function flushDelay(out: number[], frames: number): void {
  while (frames > 0) {
    const chunk = frames > 128 ? 128 : frames;
    out.push(0x80 | ((chunk - 1) & 0x7f));
    frames -= chunk;
  }
}
```

### Step 4 — Encode the RAW8 stream for the simple strategy

The `simple` strategy produces a RAW8 stream: a flat dump of all 14 register values for every frame, with no delimiters and no differencing.

File to modify: `src/exports/max.ts`.

```typescript
function encodeRaw8Stream(frames: SimulationFrame[]): number[] {
  const data: number[] = [];
  for (const frame of frames) {
    data.push(...frameToRegisterBytes(frame));
  }
  return data;
}
```

### Step 5 — Apply ZX0 compression and write the stream definition chunk

After building the uncompressed stream, apply ZX0 compression with `maxOffset: 1023`. The stream definition chunk must include the **uncompressed** stream size as a 3-byte big-endian integer whenever compression is used (`MAX.md` lines 503–515).

File to modify: `src/exports/max.ts`.

```typescript
import { compressZX0 } from '../utils/zx0';

const ZX0_COMPRESSION = 0x08;
const RAW8_FORMAT = 0x08;
const REG7_FORMAT = 0x07;
const ZX0_MAX_OFFSET = 1023;

function buildStreamDefinition(
  streamFormat: number,
  compression: number,
  uncompressedSize: number,
  frameSize: number | null
): number[] {
  const data: number[] = [streamFormat & 0xff, compression & 0xff];

  // 3-byte big-endian uncompressed stream size (mandatory when compressed).
  data.push(
    (uncompressedSize >>> 16) & 0xff,
    (uncompressedSize >>> 8) & 0xff,
    uncompressedSize & 0xff
  );

  if (frameSize !== null) {
    data.push(frameSize & 0xff);
  }

  return data;
}
```

The `exportSongToMax` function is restructured to:

1. Collect simulation frames (every tick).
2. Choose the stream format based on strategy:
   - `simple` → RAW8 (`0x08`), frame size = 14.
   - `complex` → REG7 (`0x07`), no delay optimization.
   - `optimized` → REG7 (`0x07`) with delay optimization.
3. Encode the uncompressed stream.
4. Compress with `compressZX0(uncompressed, { maxOffset: ZX0_MAX_OFFSET })`.
5. Build the stream definition chunk with `compression = 0x08` and the uncompressed size.
6. Write the compressed data into the `d` chunk.

```typescript
export function exportSongToMax(song: Song, strategy: ExportStrategy = 'simple'): MaxExportResult {
  const frames = collectSimulationFrames(song);
  const frameCount = frames.length;

  let streamFormat: number;
  let uncompressed: number[];
  let frameSize: number | null;

  if (strategy === 'simple') {
    streamFormat = RAW8_FORMAT;
    uncompressed = encodeRaw8Stream(frames);
    frameSize = MAX_REGISTER_COUNT;
  } else {
    streamFormat = REG7_FORMAT;
    uncompressed = encodeReg7Stream(frames, strategy === 'optimized');
    frameSize = null;
  }

  const compressed = compressZX0(Uint8Array.from(uncompressed), {
    maxOffset: ZX0_MAX_OFFSET,
  });

  const fileBytes: number[] = [];
  fileBytes.push(0x4d, 0x41, 0x58, 0x20); // "MAX "
  fileBytes.push(...buildMaxShortChunk('V', [0x01]));

  const infoChunk = buildMaxInfoChunk(song);
  if (infoChunk) fileBytes.push(...infoChunk);

  // Chip setup chunk (unchanged from current implementation).
  fileBytes.push(...buildMaxChipChunk());

  const streamDefData = buildStreamDefinition(
    streamFormat,
    ZX0_COMPRESSION,
    uncompressed.length,
    frameSize
  );
  fileBytes.push(...buildMaxShortChunk('S', streamDefData));

  const compressedArray: number[] = [];
  for (let i = 0; i < compressed.length; i++) compressedArray.push(compressed[i]);
  fileBytes.push(...buildMaxLongChunk('d', compressedArray));

  return { buffer: new Uint8Array(fileBytes).buffer, frameCount };
}
```

### Step 6 — Remove the dependency on the asm and bin exporters

The current `exportSongToMax` calls `exportSongRegisterDump` (from `./asm`) and `parseAssemblyToBinary` (from `./bin`) to obtain register bytes. After Step 2 this indirection is no longer needed. Remove the two imports and the `buildMaxStreamFromDumpBytes` helper.

File to modify: `src/exports/max.ts`.

```typescript
// Removed imports:
// import { exportSongRegisterDump } from './asm';
// import { parseAssemblyToBinary } from './bin';
```

### Step 7 — Update FORMAT.md and SPECIFICATION.md

Rewrite the `EXPORT MAX` section in `docs/FORMAT.md` to document:

- The three strategy-to-format mappings (simple → RAW8, complex → REG7, optimized → REG7 + delay optimization).
- ZX0 compression (`0x08`) with a 1024-byte ring-buffer window (`maxOffset: 1023`).
- The 14-register frame width (R0–R13).
- The single-byte REG7 delimiter (`0x80` = 1 frame, `0xFF` = 128 frames).
- The mandatory 3-byte uncompressed stream-size field in the stream definition chunk.

Update the MAX entry in `docs/SPECIFICATION.md` to reference the corrected behaviour.

## Implementation Order

Execute the steps above in this sequence.

1. Update `FORMAT.md` and `SPECIFICATION.md`
2. Create `src/utils/zx0.ts` (Step 1)
3. Rewrite `src/exports/max.ts` (Steps 2–6)
4. Add tests for the ZX0 module (Step 8)
5. Add tests for the MAX export (Step 9)
6. Run verification loop

## Testing Strategy

**Unit tests — ZX0 module**

Port the round-trip test suite from `pet-lab/test/utils/zx0.test.ts` to verify the compressor and decompressor produce byte-identical results. The pet-lab tests already cover single-byte, two-byte, zero-run, repeating pattern, ascending sequence, pseudo-random, structured-repetition, and high-ratio compression cases.

Test file to create: `test/utils/zx0.test.ts`.

```typescript
import { describe, it, expect } from 'vitest';
import { compressZX0, decompressZX0 } from '../../src/utils/zx0';

function roundTrip(input: Uint8Array): void {
  const compressed = compressZX0(input);
  const decompressed = decompressZX0(compressed);
  expect(decompressed).toEqual(input);
}

describe('ZX0 compression', () => {
  it('round-trips a single byte', () => { /* ... */ });
  it('round-trips two bytes', () => { /* ... */ });
  it('round-trips a run of zeros', () => { /* ... */ });
  it('round-trips a repeating two-byte pattern', () => { /* ... */ });
  it('round-trips an ascending byte sequence', () => { /* ... */ });
  it('round-trips a pseudo-random buffer deterministically', () => { /* ... */ });
  it('round-trips a structured-repetition payload', () => { /* ... */ });
  it('compresses repetitive data to substantially fewer bytes', () => { /* ... */ });
  it('respects maxOffset: 1023 by never back-referencing beyond 1024 bytes', () => { /* ... */ });
});
```

The `maxOffset: 1023` test compresses a 2048-byte input where the first 1024 bytes differ from the second 1024 bytes, then verifies that decompression with the standard (unbounded) decompressor still round-trips — confirming the constrained output is a valid ZX0 stream.

**Unit tests — MAX export**

Create a new test file that exercises the three strategies and verifies the byte-level structure of the output.

Test file to create: `test/utils/exportMax.test.ts`.

```typescript
import { describe, it, expect } from 'vitest';
import { exportSongToMax } from '../../src/exports/max';
import { decompressZX0 } from '../../src/utils/zx0';
import { parseSongFromYaml } from '../../src/utils/songParser';

describe('exportSongToMax', () => {
  it('writes the MAX magic number and version chunk', () => { /* ... */ });
  it('writes the chip setup chunk with YM2149 and 50 Hz VBLANK', () => { /* ... */ });
  it('writes ZX0 compression (0x08) in the stream definition for simple strategy', () => { /* ... */ });
  it('writes the uncompressed stream size as a 3-byte big-endian integer', () => { /* ... */ });
  it('produces a REG7 stream (0x07) for the complex strategy', () => { /* ... */ });
  it('produces a REG7 stream with optimized delays for the optimized strategy', () => { /* ... */ });
  it('uses single-byte REG7 delimiters (0x80 = 1 frame, not 0x80 0x80)', () => { /* ... */ });
  it('includes all 14 registers (R0–R13) in the first REG7 frame', () => { /* ... */ });
  it('round-trips the compressed stream through decompressZX0', () => { /* ... */ });
  it('captures one frame per VBLANK tick, not every second tick', () => { /* ... */ });
});
```

The REG7 delimiter test is the critical regression guard: it asserts that after the first frame's register writes the stream contains a single `0x80` byte, not the previous two-byte `0x80, 0x80` marker.

The frame-rate test asserts that `frameCount` equals the number of simulation ticks emitted by `simulateSong` for the same song, confirming the half-speed capture bug is fixed.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Manually verify the exported `.max` file by:
  - Decompressing the `d` chunk with `decompressZX0` and confirming the result matches the expected uncompressed stream.
  - Confirming the stream definition chunk's compression byte is `0x08` and the uncompressed size field matches the decompressed length.
  - Confirming no regressions in the asm, bin, vgm, or wav exporters (they share `simulateSong` but are not modified by this change).
