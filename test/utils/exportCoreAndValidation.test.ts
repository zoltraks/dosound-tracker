import { describe, it, expect } from 'vitest';
import { parseBaseKeyForExport, formatNoteLabel } from '../../src/exports/core';
import { parseAssemblyToBinary, exportToBinary } from '../../src/exports/bin';
import { validateSongData, ValidationError } from '../../src/utils/validation';
import { expandLoopingEnvelope, trimEnvelope } from '../../src/utils/envelopeUtils';
import { parseSongFromYaml } from '../../src/utils/songParser';
import type { Song } from '../../src/synth/SoundDriver';

describe('parseBaseKeyForExport', () => {
  it.each([
    ['C-4', { note: 'C', octave: 4 }],
    ['C#4', { note: 'C#', octave: 4 }],
    ['A-3', { note: 'A', octave: 3 }],
    ['  D-5 ', { note: 'D', octave: 5 }],
    [undefined, { note: 'C', octave: 4 }],
    ['bogus', { note: 'C', octave: 4 }],
    ['', { note: 'C', octave: 4 }],
  ])('parses %s', (input, expected) => {
    try {
      expect(parseBaseKeyForExport(input)).toEqual(expected);
    } catch (error) {
      console.log('base-key mismatch', input);
      throw error;
    }
  });
});

describe('formatNoteLabel', () => {
  it('formats same-octave and cross-octave offsets', () => {
    try {
      expect(formatNoteLabel('C', 4, 0)).toBe('C-4');
      expect(formatNoteLabel('C', 4, 2)).toBe('D-4');
      expect(formatNoteLabel('B', 4, 1)).toBe('C-5');
      expect(formatNoteLabel('C', 4, -1)).toBe('B-3');
      expect(formatNoteLabel('C', 4, -12)).toBe('C-3');
      expect(formatNoteLabel('C#', 4, 1)).toBe('D-4');
    } catch (error) {
      console.log('label mismatch');
      throw error;
    }
  });

  it('falls back for unknown note names', () => {
    try {
      expect(formatNoteLabel('H', 4, 0)).toBe('H-4');
      expect(formatNoteLabel('Z#', 4, 0)).toBe('Z#4');
    } catch (error) {
      console.log('fallback mismatch');
      throw error;
    }
  });
});

describe('parseAssemblyToBinary / exportToBinary', () => {
  it('extracts hex tokens from dc.b lines and ignores the rest', () => {
    const asm = [
      'music:',
      '    dc.b $08,$0c       ; VA',
      '    ; comment with $ff that is not dc.b',
      '    dc.b $ff,$02       ; DL',
      'nonsense line',
    ].join('\n');
    try {
      expect(Array.from(parseAssemblyToBinary(asm))).toEqual([0x08, 0x0c, 0xff, 0x02]);
    } catch (error) {
      console.log('bin parse mismatch');
      throw error;
    }
  });

  it('produces bytes from a song via the assembly path', () => {
    const yaml = `
song:
  title: Bin Test
  speed: 4
  length: 1
  line:
    - A: "00"
  pattern:
    - number: "00"
      steps:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      volume: [15]
`;
    try {
      const bytes = exportToBinary(parseSongFromYaml(yaml));
      expect(bytes.length).toBeGreaterThan(0);
      expect(bytes[bytes.length - 2]).toBe(0xff);
    } catch (error) {
      console.log('export-bin mismatch');
      throw error;
    }
  });
});

describe('validateSongData', () => {
  const song = (overrides: Partial<Song> = {}): Song => ({
    title: 'T',
    author: 'A',
    year: 2025,
    speed: 6,
    length: 4,
    pattern: [{ id: '00', name: 'P', step: [] }],
    line: [{ A: '00', B: '--', C: '--' }],
    instrument: [],
    ...overrides,
  });

  it('rejects non-objects and malformed structures', () => {
    try {
      expect(() => validateSongData(null)).toThrow(ValidationError);
      expect(() => validateSongData(42)).toThrow('Song data must be an object');
      expect(() => validateSongData({})).toThrow('Invalid song data structure');
    } catch (error) {
      console.log('reject mismatch');
      throw error;
    }
  });

  it('requires a title and a non-empty pattern list', () => {
    try {
      expect(() => validateSongData(song({ title: '' }))).toThrow('title');
      expect(() => validateSongData(song({ pattern: [] }))).toThrow('at least one pattern');
      expect(() => validateSongData(song({ pattern: [{ id: '', name: '', step: [] }] }))).toThrow(
        'id and name',
      );
    } catch (error) {
      console.log('fields mismatch');
      throw error;
    }
  });

  it('returns the song when valid', () => {
    try {
      expect(validateSongData(song()).title).toBe('T');
    } catch (error) {
      console.log('valid mismatch');
      throw error;
    }
  });
});

describe('envelopeUtils', () => {
  it('expandLoopingEnvelope fills from defaults and loops input', () => {
    try {
      expect(expandLoopingEnvelope(undefined, 3, 7)).toEqual([7, 7, 7]);
      expect(expandLoopingEnvelope([1, 2], 5, 0)).toEqual([1, 2, 1, 2, 1]);
      expect(expandLoopingEnvelope(['a', 4, 'b'], 3, 0)).toEqual([4, 4, 4]);
    } catch (error) {
      console.log('expand mismatch');
      throw error;
    }
  });

  it('trimEnvelope removes trailing repeats of the last value', () => {
    try {
      expect(trimEnvelope([1, 2, 2, 2])).toEqual([1, 2]);
      expect(trimEnvelope([5])).toEqual([5]);
      expect(trimEnvelope([])).toEqual([]);
      expect(trimEnvelope([3, 3, 3])).toEqual([3]);
    } catch (error) {
      console.log('trim mismatch');
      throw error;
    }
  });
});
