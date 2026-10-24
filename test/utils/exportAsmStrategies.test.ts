import { describe, it, expect } from 'vitest';
import { exportToAssembly } from '../../src/exports/asm';
import { ENVELOPE_LENGTH } from '../../src/constants/music';
import type { Instrument, Song } from '../../src/synth/SoundDriver';

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

const song = (overrides: Partial<Song> = {}): Song => ({
  title: 'T',
  author: 'A',
  year: 2025,
  speed: 4,
  length: 4,
  pattern: [
    {
      id: '00',
      name: 'P0',
      step: [
        { note: { note: 'C', octave: 4, instrument: '00' }, volume: null },
        { note: { note: 'D', octave: 4, instrument: '00' }, volume: null },
        { note: { note: 'E', octave: 4, instrument: '00' }, volume: null },
        { note: { note: 'G', octave: 4, instrument: '00' }, volume: null },
      ],
    },
    {
      id: '01',
      name: 'P1',
      step: [
        { note: { note: 'A', octave: 3, instrument: '00' }, volume: 8 },
        { note: null, volume: null },
        { note: null, volume: null },
        { note: null, volume: null },
      ],
    },
  ],
  line: [
    { A: '00', B: '--', C: '--' },
    { A: '01', B: '--', C: '--' },
  ],
  instrument: [inst()],
  ...overrides,
});

describe('exportToAssembly strategies', () => {
  it('complex strategy emits a beat marker between playlist positions', () => {
    try {
      const asm = exportToAssembly(song(), 'complex');
      expect(asm).toContain('; START');
      expect(asm).toContain('; ---');
      expect(asm).toContain('; STOP');
      expect(asm).toContain('dc.b $FF,$0');
    } catch (error) {
      console.log('complex mismatch');
      throw error;
    }
  });

  it('simple strategy still produces a complete dump', () => {
    try {
      const asm = exportToAssembly(song(), 'simple');
      expect(asm).toContain('music:');
      expect(asm).toContain('dc.b');
    } catch (error) {
      console.log('simple mismatch');
      throw error;
    }
  });

  it('optimized strategy matches the complex path shape', () => {
    try {
      const asm = exportToAssembly(song(), 'optimized');
      expect(asm).toContain('; START');
      expect(asm).toContain('; STOP');
    } catch (error) {
      console.log('optimized mismatch');
      throw error;
    }
  });

  it('emits register comments for mixer, noise, tone, and volume writes', () => {
    try {
      const noisy = song({
        instrument: [
          inst({
            noise: new Array(ENVELOPE_LENGTH).fill(4),
            mode: new Array(ENVELOPE_LENGTH).fill(2),
          }),
        ],
      });
      const asm = exportToAssembly(noisy, 'complex');
      expect(asm).toMatch(/; MX/);
      expect(asm).toMatch(/; V[ABC]/);
      expect(asm).toMatch(/; T[ABC]/);
    } catch (error) {
      console.log('comments mismatch');
      throw error;
    }
  });

  it('handles an empty playlist without crashing', () => {
    try {
      const empty = song({ line: [], pattern: [] });
      const asm = exportToAssembly(empty, 'complex');
      expect(asm).toContain('music:');
    } catch (error) {
      console.log('empty mismatch');
      throw error;
    }
  });

  it('combines consecutive delay frames into larger delays', () => {
    try {
      const asm = exportToAssembly(song({ speed: 8 }), 'complex');
      expect(asm).toMatch(/DL \d+/);
    } catch (error) {
      console.log('delay mismatch');
      throw error;
    }
  });
});
