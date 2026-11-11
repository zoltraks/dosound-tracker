// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSongFromYaml } from '../../src/utils/song/songParser.ts';
import { exportSongToMod, exportInstrumentToMod } from '../../src/exports/mod.ts';
import type { Song } from '../../src/synth/SoundDriver.ts';

function loadToneSong(): Song {
  const yamlContent = readFileSync('test/fixtures/song-vgm-tone.yaml', 'utf-8');
  return parseSongFromYaml(yamlContent);
}

interface ModCell {
  sample: number;
  period: number;
  effect: number;
  param: number;
}

function readCell(bytes: Uint8Array, patternIndex: number, row: number, channel: number): ModCell {
  const offset = 1084 + (patternIndex * 64 + row) * 16 + channel * 4;
  const b0 = bytes[offset];
  const b1 = bytes[offset + 1];
  const b2 = bytes[offset + 2];
  const b3 = bytes[offset + 3];
  return {
    sample: (b0 & 0xf0) | (b2 >>> 4),
    period: ((b0 & 0x0f) << 8) | b1,
    effect: b2 & 0x0f,
    param: b3,
  };
}

describe('exportSongToMod', () => {
  it('exports a valid ProTracker module for the default song', () => {
    const song = loadToneSong();
    const { buffer } = exportSongToMod(song);
    const bytes = new Uint8Array(buffer);

    try {
      // Title field
      expect(String.fromCharCode(...bytes.subarray(0, 13))).toBe('VGM Test Song');
      // 'M.K.' tag at offset 1080
      expect(String.fromCharCode(...bytes.subarray(1080, 1084))).toBe('M.K.');
      // Song length byte: 3 positions of 4 rows = 12 rows = 1 pattern
      expect(bytes[950]).toBe(1);
      // Order table starts at 0
      expect(bytes[952]).toBe(0);
      // File size: 1084 + 1024 + 32 + 512
      expect(bytes.length).toBe(1084 + 1024 + 32 + 512);
    } catch (error) {
      console.log('header:', Array.from(bytes.subarray(950, 960)), 'magic:', bytes.length);
      throw error;
    }
  });

  it('declares two generated samples with looped lengths', () => {
    const song = loadToneSong();
    const bytes = new Uint8Array(exportSongToMod(song).buffer);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    try {
      // Slot 1: 'DSND SQUARE', 16 words, volume 64, loop 0/16
      expect(String.fromCharCode(...bytes.subarray(20, 31))).toBe('DSND SQUARE');
      expect(view.getUint16(42)).toBe(16);
      expect(bytes[45]).toBe(64);
      expect(view.getUint16(46)).toBe(0);
      expect(view.getUint16(48)).toBe(16);

      // Slot 2: 'DSND NOISE', 256 words, volume 64, loop 0/256
      expect(String.fromCharCode(...bytes.subarray(50, 60))).toBe('DSND NOISE');
      expect(view.getUint16(72)).toBe(256);
      expect(bytes[75]).toBe(64);
      expect(view.getUint16(76)).toBe(0);
      expect(view.getUint16(78)).toBe(256);

      // Slots 3-31 empty
      for (let slot = 3; slot <= 31; slot++) {
        const base = 20 + (slot - 1) * 30;
        expect(view.getUint16(base + 22)).toBe(0);
      }
    } catch (error) {
      console.log('sample headers:', Array.from(bytes.subarray(20, 80)));
      throw error;
    }
  });

  it('emits note cells with sample, period, and Cxx volume', () => {
    const song = loadToneSong();
    const bytes = new Uint8Array(exportSongToMod(song).buffer);

    const firstNote = readCell(bytes, 0, 0, 0);
    try {
      expect(firstNote.sample).toBe(1);
      expect(firstNote.period).toBeGreaterThanOrEqual(113);
      expect(firstNote.period).toBeLessThanOrEqual(856);
      expect(firstNote.effect).toBe(0x0c);
    } catch (error) {
      console.log('first cell:', firstNote);
      throw error;
    }
  });

  it('carries speed and BPM F-effects on the empty fourth channel', () => {
    const song = loadToneSong();
    const bytes = new Uint8Array(exportSongToMod(song).buffer);

    const speedCell = readCell(bytes, 0, 0, 3);
    const bpmCell = readCell(bytes, 0, 1, 3);

    try {
      expect(speedCell.effect).toBe(0x0f);
      expect(speedCell.param).toBe(song.speed);
      expect(bpmCell.effect).toBe(0x0f);
      expect(bpmCell.param).toBe(Math.round((song.frame ?? 50) * 2.5));
    } catch (error) {
      console.log('row0 cells:', speedCell, bpmCell);
      throw error;
    }
  });

  it('encodes the loop restart as the containing pattern index', () => {
    const song = loadToneSong();
    expect(song.loop).toBe(1);

    const bytes = new Uint8Array(exportSongToMod(song).buffer);
    // loop=1, length=4 -> loop row = 4 -> pattern 0
    try {
      expect(bytes[951]).toBe(0);
    } catch (error) {
      console.log('restart byte:', bytes[951]);
      throw error;
    }
  });

  it('produces byte-identical output across runs', () => {
    const song = loadToneSong();
    const first = new Uint8Array(exportSongToMod(song).buffer);
    const second = new Uint8Array(exportSongToMod(song).buffer);
    expect(Array.from(first)).toEqual(Array.from(second));
  });

  it('reports mapping losses in the warnings list', () => {
    const song = loadToneSong();
    const { warnings } = exportSongToMod(song);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.includes('samples'))).toBe(true);
  });

  it('spreads long songs across multiple patterns', () => {
    const song = loadToneSong();
    const longSong: Song = { ...song, length: 64, line: [song.line[0], song.line[0]] };
    const bytes = new Uint8Array(exportSongToMod(longSong).buffer);

    // 2 positions x 64 rows = 128 rows = 2 patterns
    try {
      expect(bytes[950]).toBe(2);
      expect(bytes[952]).toBe(0);
      expect(bytes[953]).toBe(1);
      expect(bytes.length).toBe(1084 + 2 * 1024 + 32 + 512);
    } catch (error) {
      console.log('length byte:', bytes[950], 'size:', bytes.length);
      throw error;
    }
  });
});

describe('exportInstrumentToMod', () => {
  it('exports a valid module for an instrument preview', () => {
    const song = loadToneSong();
    const instrument = song.instrument[0];
    const { buffer } = exportInstrumentToMod(instrument, song);
    const bytes = new Uint8Array(buffer);
    expect(String.fromCharCode(...bytes.subarray(1080, 1084))).toBe('M.K.');
  });
});
