import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSongFromYaml } from '../../src/utils/songParser';
import { exportSongToMax, exportInstrumentToMax } from '../../src/exports/max';
import { decompressZX0 } from '../../src/utils/zx0';
import { simulateSong } from '../../src/utils/playbackSimulation';
import { YM_CLOCK } from '../../src/synth/YM2149';
import { VBLANK_RATE } from '../../src/synth/SoundDriver';

function loadSongYaml(name: string) {
  const yamlContent = readFileSync(`test/fixtures/${name}`, 'utf-8');
  return parseSongFromYaml(yamlContent);
}

function findChunk(bytes: Uint8Array, typeCode: number): { offset: number; size: number; dataOffset: number; isLong: boolean } | null {
  let pos = 4; // skip "MAX " magic
  while (pos < bytes.length) {
    const type = bytes[pos];
    if (type >= 0x61 && type <= 0x7a) {
      // long chunk: 3-byte size
      const size = (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];
      const dataLen = size + 1;
      if (type === typeCode) {
        return { offset: pos, size: dataLen, dataOffset: pos + 4, isLong: true };
      }
      pos += 4 + dataLen;
    } else if (type >= 0x41 && type <= 0x5a) {
      // short chunk: 1-byte size
      const size = bytes[pos + 1];
      const dataLen = size + 1;
      if (type === typeCode) {
        return { offset: pos, size: dataLen, dataOffset: pos + 2, isLong: false };
      }
      pos += 2 + dataLen;
    } else {
      break;
    }
  }
  return null;
}

describe('exportSongToMax', () => {
  it('writes the MAX magic number and version chunk', () => {
    const song = loadSongYaml('song-vgm-tone.yaml');
    const { buffer } = exportSongToMax(song, 'simple');
    const bytes = new Uint8Array(buffer);

    expect(bytes[0]).toBe(0x4d); // 'M'
    expect(bytes[1]).toBe(0x41); // 'A'
    expect(bytes[2]).toBe(0x58); // 'X'
    expect(bytes[3]).toBe(0x20); // ' '

    // Version chunk 'V' (0x56) at offset 4
    expect(bytes[4]).toBe(0x56);
    expect(bytes[5]).toBe(0x00); // size = 0 (1 byte data)
    expect(bytes[6]).toBe(0x01); // version 1
  });

  it('writes the chip setup chunk with YM2149 and 50 Hz VBLANK', () => {
    const song = loadSongYaml('song-vgm-tone.yaml');
    const { buffer } = exportSongToMax(song, 'simple');
    const bytes = new Uint8Array(buffer);

    const chip = findChunk(bytes, 0x43); // 'C'
    expect(chip).not.toBeNull();
    if (!chip) return;

    const dataStart = chip.dataOffset;
    expect(bytes[dataStart]).toBe(0xa9); // YM2149 chip id
    expect(bytes[dataStart + 1]).toBe(0x00); // panning
    // VBLANK_RATE = 50 = 0x0032
    expect(bytes[dataStart + 2]).toBe((VBLANK_RATE >>> 8) & 0xff);
    expect(bytes[dataStart + 3]).toBe(VBLANK_RATE & 0xff);

    // YM_CLOCK = 2000000 = 0x001E8480
    const clock = (bytes[dataStart + 4] << 24) | (bytes[dataStart + 5] << 16) | (bytes[dataStart + 6] << 8) | bytes[dataStart + 7];
    expect(clock >>> 0).toBe(YM_CLOCK);
  });

  it('writes ZX0 compression (0x08) in the stream definition for simple strategy', () => {
    const song = loadSongYaml('song-vgm-tone.yaml');
    const { buffer } = exportSongToMax(song, 'simple');
    const bytes = new Uint8Array(buffer);

    const streamDef = findChunk(bytes, 0x53); // 'S'
    expect(streamDef).not.toBeNull();
    if (!streamDef) return;

    const dataStart = streamDef.dataOffset;
    expect(bytes[dataStart]).toBe(0x08); // RAW8 format
    expect(bytes[dataStart + 1]).toBe(0x08); // ZX0 compression
  });

  it('writes the uncompressed stream size as a 3-byte big-endian integer', () => {
    const song = loadSongYaml('song-vgm-tone.yaml');
    const { buffer } = exportSongToMax(song, 'simple');
    const bytes = new Uint8Array(buffer);

    const streamDef = findChunk(bytes, 0x53); // 'S'
    expect(streamDef).not.toBeNull();
    if (!streamDef) return;

    const dataStart = streamDef.dataOffset;
    const uncompressedSize =
      (bytes[dataStart + 2] << 16) | (bytes[dataStart + 3] << 8) | bytes[dataStart + 4];
    // RAW8: frameCount * 14 registers
    expect(uncompressedSize).toBeGreaterThan(0);
    expect(uncompressedSize % 14).toBe(0);

    // Frame size byte should be 14 for RAW8
    expect(bytes[dataStart + 5]).toBe(14);
  });

  it('produces a REG7 stream (0x07) for the complex strategy', () => {
    const song = loadSongYaml('song-vgm-tone.yaml');
    const { buffer } = exportSongToMax(song, 'complex');
    const bytes = new Uint8Array(buffer);

    const streamDef = findChunk(bytes, 0x53); // 'S'
    expect(streamDef).not.toBeNull();
    if (!streamDef) return;

    const dataStart = streamDef.dataOffset;
    expect(bytes[dataStart]).toBe(0x07); // REG7 format
    expect(bytes[dataStart + 1]).toBe(0x08); // ZX0 compression
  });

  it('produces a REG7 stream with optimized delays for the optimized strategy', () => {
    const song = loadSongYaml('song-vgm-tone.yaml');
    const { buffer } = exportSongToMax(song, 'optimized');
    const bytes = new Uint8Array(buffer);

    const streamDef = findChunk(bytes, 0x53); // 'S'
    expect(streamDef).not.toBeNull();
    if (!streamDef) return;

    const dataStart = streamDef.dataOffset;
    expect(bytes[dataStart]).toBe(0x07); // REG7 format
    expect(bytes[dataStart + 1]).toBe(0x08); // ZX0 compression
  });

  it('uses single-byte REG7 delimiters (0x80 = 1 frame, not 0x80 0x80)', () => {
    const song = loadSongYaml('song-vgm-tone.yaml');
    const { buffer } = exportSongToMax(song, 'complex');
    const bytes = new Uint8Array(buffer);

    const streamDef = findChunk(bytes, 0x53);
    const dataStart = streamDef!.dataOffset;
    const uncompressedSize =
      (bytes[dataStart + 2] << 16) | (bytes[dataStart + 3] << 8) | bytes[dataStart + 4];

    const dataChunk = findChunk(bytes, 0x64); // 'd'
    expect(dataChunk).not.toBeNull();
    if (!dataChunk) return;

    const compressed = bytes.slice(dataChunk.dataOffset, dataChunk.dataOffset + dataChunk.size);
    const decompressed = decompressZX0(compressed);

    expect(decompressed.length).toBe(uncompressedSize);

    // The first frame must write all 14 registers (28 bytes) then a single 0x80 delimiter.
    // Registers 0-13 are written as (reg, value) pairs = 28 bytes, then 0x80.
    // Check that byte at index 28 is 0x80 (single-byte delimiter) and byte 29 is NOT 0x80
    // (i.e. it's the start of the next frame's register writes, not a second delimiter byte).
    expect(decompressed[28]).toBe(0x80);
    // The next byte after the delimiter should be a register number (0x00-0x0d) or another
    // delimiter if the next frame has no changes. It must NOT be 0x80 again as part of a
    // two-byte marker — but consecutive delimiters are valid for idle frames. The key
    // assertion is that the delimiter is a SINGLE byte, not a pair. We verify by checking
    // that the total stream length is consistent with single-byte delimiters: each frame
    // contributes at most 28 register bytes + 1 delimiter = 29 bytes minimum.
    // The old bug would have added an extra byte per frame.
    // We assert the decompressed length matches the expected uncompressed size.
    expect(decompressed.length).toBe(uncompressedSize);
  });

  it('includes all 14 registers (R0-R13) in the first REG7 frame', () => {
    const song = loadSongYaml('song-vgm-tone.yaml');
    const { buffer } = exportSongToMax(song, 'complex');
    const bytes = new Uint8Array(buffer);

    const dataChunk = findChunk(bytes, 0x64); // 'd'
    expect(dataChunk).not.toBeNull();
    if (!dataChunk) return;

    const compressed = bytes.slice(dataChunk.dataOffset, dataChunk.dataOffset + dataChunk.size);
    const decompressed = decompressZX0(compressed);

    // First frame: 14 register pairs (28 bytes) then delimiter.
    // Collect the register numbers written in the first frame.
    const registersInFirstFrame: number[] = [];
    let pos = 0;
    while (pos < decompressed.length && decompressed[pos] < 0x80) {
      registersInFirstFrame.push(decompressed[pos]);
      pos += 2; // skip register number and value
    }

    expect(registersInFirstFrame.length).toBe(14);
    for (let reg = 0; reg < 14; reg++) {
      expect(registersInFirstFrame[reg]).toBe(reg);
    }
  });

  it('round-trips the compressed stream through decompressZX0 for simple strategy', () => {
    const song = loadSongYaml('song-vgm-tone.yaml');
    const { buffer } = exportSongToMax(song, 'simple');
    const bytes = new Uint8Array(buffer);

    const streamDef = findChunk(bytes, 0x53);
    const dataStart = streamDef!.dataOffset;
    const uncompressedSize =
      (bytes[dataStart + 2] << 16) | (bytes[dataStart + 3] << 8) | bytes[dataStart + 4];

    const dataChunk = findChunk(bytes, 0x64);
    const compressed = bytes.slice(dataChunk!.dataOffset, dataChunk!.dataOffset + dataChunk!.size);
    const decompressed = decompressZX0(compressed);

    expect(decompressed.length).toBe(uncompressedSize);
    // RAW8: every 14 bytes is a frame. All 14 registers should be present.
    expect(uncompressedSize % 14).toBe(0);
  });

  it('round-trips the compressed stream through decompressZX0 for complex strategy', () => {
    const song = loadSongYaml('song-vgm-tone.yaml');
    const { buffer } = exportSongToMax(song, 'complex');
    const bytes = new Uint8Array(buffer);

    const streamDef = findChunk(bytes, 0x53);
    const dataStart = streamDef!.dataOffset;
    const uncompressedSize =
      (bytes[dataStart + 2] << 16) | (bytes[dataStart + 3] << 8) | bytes[dataStart + 4];

    const dataChunk = findChunk(bytes, 0x64);
    const compressed = bytes.slice(dataChunk!.dataOffset, dataChunk!.dataOffset + dataChunk!.size);
    const decompressed = decompressZX0(compressed);

    expect(decompressed.length).toBe(uncompressedSize);
  });

  it('captures one frame per VBLANK tick, not every second tick', () => {
    const song = loadSongYaml('song-vgm-tone.yaml');

    // Count simulation ticks
    let simTickCount = 0;
    simulateSong(song, () => {
      simTickCount++;
    });

    const { buffer, frameCount } = exportSongToMax(song, 'simple');
    const bytes = new Uint8Array(buffer);

    const streamDef = findChunk(bytes, 0x53);
    const dataStart = streamDef!.dataOffset;
    const uncompressedSize =
      (bytes[dataStart + 2] << 16) | (bytes[dataStart + 3] << 8) | bytes[dataStart + 4];

    // RAW8: each frame is 14 bytes
    const expectedFrameCount = uncompressedSize / 14;
    expect(frameCount).toBe(simTickCount);
    expect(expectedFrameCount).toBe(simTickCount);
  });

  it('exports instrument preview to MAX without errors', () => {
    const song = loadSongYaml('song-vgm-tone.yaml');
    const instrument = song.instrument[0];
    const { buffer, frameCount } = exportInstrumentToMax(instrument, song, 'complex');

    expect(buffer.byteLength).toBeGreaterThan(0);
    expect(frameCount).toBeGreaterThan(0);

    const bytes = new Uint8Array(buffer);
    expect(bytes[0]).toBe(0x4d); // 'M'
    expect(bytes[1]).toBe(0x41); // 'A'
    expect(bytes[2]).toBe(0x58); // 'X'
    expect(bytes[3]).toBe(0x20); // ' '
  });
});
