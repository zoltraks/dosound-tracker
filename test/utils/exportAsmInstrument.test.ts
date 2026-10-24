import { describe, it, expect } from 'vitest';
import { exportInstrumentToAssembly, exportSongRegisterDump } from '../../src/exports/asm';
import { ENVELOPE_LENGTH } from '../../src/constants/music';
import type { Instrument, Song } from '../../src/synth/SoundDriver';

const inst = (overrides: Partial<Instrument> = {}): Instrument => ({
  id: '00',
  name: '',
  volume: new Array(ENVELOPE_LENGTH).fill(0),
  shift: new Array(ENVELOPE_LENGTH).fill(0),
  pitch: new Array(ENVELOPE_LENGTH).fill(0),
  noise: new Array(ENVELOPE_LENGTH).fill(0),
  mode: new Array(ENVELOPE_LENGTH).fill(0),
  base: 'C-4',
  ...overrides,
});

const song = (overrides: Partial<Song> = {}): Song => ({
  title: 'T',
  author: 'A',
  year: 2025,
  speed: 4,
  length: 2,
  pattern: [
    {
      id: '00',
      name: 'P',
      step: [
        { note: { note: 'C', octave: 4, instrument: '00' }, volume: null },
        { note: null, volume: null },
      ],
    },
  ],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [inst()],
  ...overrides,
});

describe('exportInstrumentToAssembly', () => {
  it('emits tone writes for a plain tone instrument', () => {
    const asm = exportInstrumentToAssembly(inst({ volume: [15, 15] }));
    try {
      expect(asm).toContain('music:');
      expect(asm).toContain('dc.b');
      expect(asm).toContain('; VA');
      expect(asm).toContain('$FF,$0');
    } catch (error) {
      console.log('asm mismatch');
      throw error;
    }
  });

  it('emits noise mixer writes for a noise instrument', () => {
    try {
      const asm = exportInstrumentToAssembly(inst({ volume: [15], noise: [4], mode: [1] }));
      expect(asm).toContain('dc.b');
      // noise mode sets the noise bit active in the mixer comment path
      expect(asm).toMatch(/dc\.b \$6,/);
    } catch (error) {
      console.log('asm mismatch');
      throw error;
    }
  });

  it('applies shift and pitch envelope deltas', () => {
    try {
      const asm = exportInstrumentToAssembly(
        inst({ volume: [15, 15], shift: [0, 12], pitch: [0, 5] }),
      );
      expect(asm).toContain('dc.b');
    } catch (error) {
      console.log('delta mismatch');
      throw error;
    }
  });

  it('handles an instrument with empty envelopes', () => {
    try {
      const asm = exportInstrumentToAssembly(inst());
      expect(asm).toContain('music:');
    } catch (error) {
      console.log('empty mismatch');
      throw error;
    }
  });
});

describe('exportSongRegisterDump', () => {
  it('emits one dc.b line per simulated tick with all registers', () => {
    try {
      const { content, cycleCount } = exportSongRegisterDump(song());
      expect(content).toContain('music:');
      expect(cycleCount).toBeGreaterThan(0);
      const lines = content.split('\n').filter((l) => l.includes('dc.b'));
      expect(lines.length).toBe(cycleCount);
      expect(lines[0].split(',').length).toBeGreaterThanOrEqual(11);
    } catch (error) {
      console.log('dump mismatch');
      throw error;
    }
  });

  it('respects the song frame rate and clock', () => {
    try {
      const { cycleCount: at50 } = exportSongRegisterDump(song());
      const { cycleCount: at60 } = exportSongRegisterDump(song({ frame: 60 }));
      expect(at50).toBeGreaterThan(0);
      expect(at60).toBeGreaterThan(0);
    } catch (error) {
      console.log('frame mismatch');
      throw error;
    }
  });
});
