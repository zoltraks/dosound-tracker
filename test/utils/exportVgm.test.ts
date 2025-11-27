import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSongFromYaml } from '../../src/utils/songParser';
import { exportSongToVgm } from '../../src/utils/assemblyExport';
import { YM_CLOCK } from '../../src/synth/YM2149';
import { VBLANK_RATE } from '../../src/synth/SoundDriver';

describe('exportSongToVgm', () => {
  it('exports valid VGM data for the default song YAML', () => {
    const yamlContent = readFileSync('test/fixtures/song-vgm-tone.yaml', 'utf-8');

    const song = parseSongFromYaml(yamlContent);
    const { buffer, totalSamples } = exportSongToVgm(song);

    const bytes = new Uint8Array(buffer);
    expect(bytes.length).toBeGreaterThan(0x100);

    // Header magic "Vgm " (0x56 0x67 0x6D 0x20)
    expect(bytes[0]).toBe(0x56);
    expect(bytes[1]).toBe(0x67);
    expect(bytes[2]).toBe(0x6d);
    expect(bytes[3]).toBe(0x20);

    const view = new DataView(buffer);

    // EOF offset = fileSize - 4
    const eofOffset = view.getUint32(0x04, true);
    expect(eofOffset + 4).toBe(bytes.length);

    // Version 1.71
    const version = view.getUint32(0x08, true);
    expect(version).toBe(0x00000171);

    // Total samples field should match export result and be > 0
    const headerTotalSamples = view.getUint32(0x18, true);
    expect(headerTotalSamples).toBe(totalSamples);
    expect(totalSamples).toBeGreaterThan(0);

    // Loop information should be present for the default song (loop field in YAML)
    const loopOffset = view.getUint32(0x1c, true);
    const loopSamples = view.getUint32(0x20, true);
    expect(loopOffset).toBeGreaterThan(0);
    expect(loopSamples).toBeGreaterThan(0);

    // Rate field should match VBLANK_RATE (50 Hz)
    const rate = view.getUint32(0x24, true);
    expect(rate).toBe(VBLANK_RATE);

    // Data offset: for our files data starts at 0x100
    const dataOffsetRel = view.getUint32(0x34, true);
    const dataStart = 0x34 + dataOffsetRel;
    expect(dataStart).toBe(0x100);

    // AY8910 clock in header should match YM_CLOCK
    const ayClock = view.getUint32(0x74, true);
    expect(ayClock).toBe(YM_CLOCK);

    // There should be at least one AY8910 register write command (0xA0) in the data stream
    let hasAyWrite = false;
    for (let i = dataStart; i < bytes.length; i++) {
      if (bytes[i] === 0xa0) {
        hasAyWrite = true;
        break;
      }
    }
    expect(hasAyWrite).toBe(true);

    // The stream should end with 0x66 (end of sound data)
    expect(bytes[bytes.length - 1]).toBe(0x66);
  });

  it('exports valid VGM data for a noise-only song without loop', () => {
    const yamlContent = readFileSync('test/fixtures/song-vgm-noise.yaml', 'utf-8');

    const song = parseSongFromYaml(yamlContent);
    const { buffer, totalSamples } = exportSongToVgm(song);

    const bytes = new Uint8Array(buffer);
    expect(bytes.length).toBeGreaterThan(0x100);

    const view = new DataView(buffer);

    // No loop information should be present for this song
    const loopOffset = view.getUint32(0x1c, true);
    const loopSamples = view.getUint32(0x20, true);
    expect(loopOffset).toBe(0);
    expect(loopSamples).toBe(0);

    // Data offset: for our files data starts at 0x100
    const dataOffsetRel = view.getUint32(0x34, true);
    const dataStart = 0x34 + dataOffsetRel;
    expect(dataStart).toBe(0x100);

    // Ensure there is at least one AY8910 noise period write (R6) with non-zero value
    let hasNoiseWrite = false;
    for (let i = dataStart; i < bytes.length - 2; i++) {
      if (bytes[i] === 0xa0) {
        const reg = bytes[i + 1];
        const value = bytes[i + 2];
        if (reg === 0x06 && value > 0) {
          hasNoiseWrite = true;
          break;
        }
        i += 2;
      }
    }
    expect(hasNoiseWrite).toBe(true);

    // Total samples should still be consistent and > 0
    const headerTotalSamples = view.getUint32(0x18, true);
    expect(headerTotalSamples).toBe(totalSamples);
    expect(totalSamples).toBeGreaterThan(0);

    // The stream should end with 0x66 (end of sound data)
    expect(bytes[bytes.length - 1]).toBe(0x66);
  });
});
