// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { exportToAssembly, exportSongRegisterDump } from '../../src/exports/asm.ts';
import { exportToBinary } from '../../src/exports/bin.ts';
import { exportSongToMidi } from '../../src/exports/midi.ts';
import { exportSongToVgm } from '../../src/exports/vgm.ts';
import { exportSongToMax } from '../../src/exports/max.ts';
import { ENVELOPE_LENGTH } from '../../src/constants/music.ts';
import type { Instrument, Song } from '../../src/synth/SoundDriver.ts';

const inst = (overrides: Partial<Instrument> = {}): Instrument => ({
  id: '00',
  name: 'i',
  volume: new Array(ENVELOPE_LENGTH).fill(15),
  shift: new Array(ENVELOPE_LENGTH).fill(0),
  pitch: new Array(ENVELOPE_LENGTH).fill(0),
  noise: new Array(ENVELOPE_LENGTH).fill(0),
  mode: new Array(ENVELOPE_LENGTH).fill(0),
  base: 'C-4',
  ...overrides,
});

const silentSteps = () => Array.from({ length: 4 }, () => ({ note: null, volume: null }));

const playingSteps = () => [
  { note: { note: 'C', octave: 4, instrument: '00' }, volume: null },
  ...Array.from({ length: 3 }, () => ({ note: null, volume: null })),
];

// Chip 1 (A-C) stays silent; chip 2 channel D plays a note, so the second
// register stream is the only one carrying volume activity.
const dualSong = (overrides: Partial<Song> = {}): Song => ({
  title: 'T',
  author: 'A',
  year: 2025,
  speed: 4,
  length: 4,
  chipCount: 2,
  pattern: [
    { id: '00', name: 'Silent', step: silentSteps() },
    { id: '10', name: 'Chip2', step: playingSteps() },
  ],
  line: [{ A: '00', B: '--', C: '--', D: '10' }],
  instrument: [inst()],
  ...overrides,
});

const singleSong = (overrides: Partial<Song> = {}): Song => ({
  title: 'T',
  author: 'A',
  year: 2025,
  speed: 4,
  length: 4,
  pattern: [{ id: '00', name: 'P0', step: playingSteps() }],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [inst()],
  ...overrides,
});

// dc.b lines carry (register, value) byte pairs; count writes that raise a
// channel volume (registers 0x08-0x0A) above zero.
const nonzeroVolumeWrites = (asm: string): number => {
  let count = 0;
  for (const line of asm.split('\n')) {
    if (!line.includes('dc.b')) continue;
    const bytes = Array.from(line.matchAll(/\$([0-9A-Fa-f]{1,2})/g)).map((m) => parseInt(m[1], 16));
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      if (bytes[i] >= 0x08 && bytes[i] <= 0x0a && bytes[i + 1] !== 0) count++;
    }
  }
  return count;
};

describe('ASM/BIN chip-stream selection', () => {
  it('chip 1 export contains no volume activity for the silent first chip', () => {
    const asm = exportToAssembly(dualSong(), 'simple', 1);
    expect(nonzeroVolumeWrites(asm)).toBe(0);
  });

  it('chip 2 export carries the second chip register stream', () => {
    const asm = exportToAssembly(dualSong(), 'simple', 2);
    expect(nonzeroVolumeWrites(asm)).toBeGreaterThan(0);
  });

  it('chip 1 and chip 2 exports differ on a two-chip song', () => {
    expect(exportToAssembly(dualSong(), 'simple', 1)).not.toBe(
      exportToAssembly(dualSong(), 'simple', 2),
    );
  });

  it('chip 2 selection on a single-chip song falls back to the only stream', () => {
    const song = singleSong();
    expect(exportToAssembly(song, 'simple', 2)).toBe(exportToAssembly(song, 'simple', 1));
  });

  it('BIN export follows the selected chip stream', () => {
    const song = dualSong();
    const bin1 = exportToBinary(song, 'simple', 1);
    const bin2 = exportToBinary(song, 'simple', 2);
    expect(bin2.length).toBeGreaterThan(0);
    expect(Array.from(bin1)).not.toEqual(Array.from(bin2));
  });
});

describe('register dump covers both chips', () => {
  it('emits a labelled music2 section for two-chip songs', () => {
    const { content } = exportSongRegisterDump(dualSong());
    expect(content).toContain('music:');
    expect(content).toContain('music2:');
  });

  it('keeps the single-section dump for single-chip songs', () => {
    const { content } = exportSongRegisterDump(singleSong());
    expect(content).toContain('music:');
    expect(content).not.toContain('music2:');
  });
});

describe('note-level and log formats on two-chip songs', () => {
  it('MIDI export writes one track per active channel plus conductor', () => {
    const view = new DataView(exportSongToMidi(dualSong()).buffer);
    // MThd: magic(4) length(4) format(2) ntracks(2) division(2)
    expect(view.getUint16(10, false)).toBe(7);
    const single = new DataView(exportSongToMidi(singleSong()).buffer);
    expect(single.getUint16(10, false)).toBe(4);
  });

  it('VGM and MAX accept a chip stream without dropping the song', () => {
    const vgm1 = exportSongToVgm(dualSong(), 'simple', 1);
    const vgm2 = exportSongToVgm(dualSong(), 'simple', 2);
    expect(vgm1.buffer.byteLength).toBeGreaterThan(0);
    expect(vgm2.buffer.byteLength).toBeGreaterThan(0);
    const max1 = exportSongToMax(dualSong(), 'simple', 1);
    const max2 = exportSongToMax(dualSong(), 'simple', 2);
    expect(max1.buffer.byteLength).toBeGreaterThan(0);
    expect(max2.buffer.byteLength).toBeGreaterThan(0);
    expect(max1.frameCount).toBe(max2.frameCount);
  });
});
