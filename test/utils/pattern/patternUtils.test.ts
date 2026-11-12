// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  insertPatternStep,
  deletePatternStep,
  normalizePatternId,
} from '../../../src/utils/pattern/patternUtils.ts';
import type { Step } from '../../../src/synth/SoundDriver.ts';
import { PATTERN_LENGTH } from '../../../src/constants/music.ts';

const noteStep = (note: string, volume?: number): Step => ({
  note: { note, octave: 4, instrument: '01' },
  volume,
});

const emptyStep = (): Step => ({ note: null });

describe('insertPatternStep', () => {
  it('clears the insert index and shifts later notes right', () => {
    const lines = [noteStep('C'), noteStep('D'), emptyStep()];
    const result = insertPatternStep(lines, 0, 4);
    try {
      expect(result).toHaveLength(4);
      expect(result[0].note).toBeNull();
      expect(result[1].note?.note).toBe('C');
      expect(result[2].note?.note).toBe('D');
      expect(result[3].note).toBeNull();
    } catch (error) {
      console.log('insert-shift mismatch', result);
      throw error;
    }
  });

  it('moves only the note; other step fields stay on the physical line', () => {
    const lines = [noteStep('C', 9), noteStep('D', 3)];
    const result = insertPatternStep(lines, 0, 2);
    try {
      expect(result[0].note).toBeNull();
      expect(result[1].note?.note).toBe('C');
      expect(result[1].volume).toBe(3);
    } catch (error) {
      console.log('insert-field mismatch', result);
      throw error;
    }
  });

  it('clamps an out-of-range index to the last line', () => {
    const lines = [noteStep('C'), noteStep('D')];
    const result = insertPatternStep(lines, 10, 2);
    try {
      expect(result[0].note?.note).toBe('C');
      expect(result[1].note).toBeNull();
    } catch (error) {
      console.log('insert-clamp mismatch', result);
      throw error;
    }
  });

  it('pads a short line array up to the pattern length', () => {
    const result = insertPatternStep([noteStep('C')], 1, 4);
    try {
      expect(result).toHaveLength(4);
      expect(result[0].note?.note).toBe('C');
      expect(result[1].note).toBeNull();
    } catch (error) {
      console.log('insert-pad mismatch', result);
      throw error;
    }
  });

  it('falls back to the default pattern length when length is falsy', () => {
    const result = insertPatternStep([noteStep('C')], 0, 0);
    try {
      expect(result).toHaveLength(PATTERN_LENGTH);
    } catch (error) {
      console.log('insert-default-length mismatch', result);
      throw error;
    }
  });
});

describe('deletePatternStep', () => {
  it('shifts later notes left and clears the last line', () => {
    const lines = [noteStep('C'), noteStep('D'), noteStep('E'), emptyStep()];
    const result = deletePatternStep(lines, 0, 4);
    try {
      expect(result[0].note?.note).toBe('D');
      expect(result[1].note?.note).toBe('E');
      expect(result[2].note).toBeNull();
      expect(result[3].note).toBeNull();
    } catch (error) {
      console.log('delete-shift mismatch', result);
      throw error;
    }
  });

  it('moves only the note; other step fields stay on the physical line', () => {
    const lines = [noteStep('C', 9), noteStep('D', 3)];
    const result = deletePatternStep(lines, 0, 2);
    try {
      expect(result[0].note?.note).toBe('D');
      expect(result[0].volume).toBe(9);
      expect(result[1].note).toBeNull();
    } catch (error) {
      console.log('delete-field mismatch', result);
      throw error;
    }
  });

  it('clamps a negative index to the first line', () => {
    const lines = [noteStep('C'), noteStep('D')];
    const result = deletePatternStep(lines, -3, 2);
    try {
      expect(result[0].note?.note).toBe('D');
      expect(result[1].note).toBeNull();
    } catch (error) {
      console.log('delete-clamp mismatch', result);
      throw error;
    }
  });

  it('pads a short track to the pattern length before shifting', () => {
    const lines = [noteStep('C'), noteStep('D')];
    const result = deletePatternStep(lines, 0, 4);
    try {
      expect(result).toHaveLength(4);
      expect(result[0].note?.note).toBe('D');
      expect(result[1].note).toBeNull();
      expect(result[3].note).toBeNull();
    } catch (error) {
      console.log('delete-pad mismatch', result);
      throw error;
    }
  });

  it('falls back to the default pattern length', () => {
    const result = deletePatternStep([noteStep('C'), noteStep('D')], 0, 0);
    try {
      expect(result).toHaveLength(PATTERN_LENGTH);
      expect(result[0].note?.note).toBe('D');
    } catch (error) {
      console.log('delete-default-length mismatch', result);
      throw error;
    }
  });
});

describe('normalizePatternId', () => {
  it.each([
    ['ab', 'AB'],
    ['  cd ', 'CD'],
    ['a', 'A'],
    ['--', '--'],
    ['bass', 'BASS'],
    ['$0f', '$0F'],
    ['', ''],
    ['   ', ''],
  ])('normalizes %j to %j', (input, expected) => {
    try {
      expect(normalizePatternId(input)).toBe(expected);
    } catch (error) {
      console.log('pattern-id mismatch', { input, expected });
      throw error;
    }
  });

  it('formats finite numbers as two-digit uppercase hex', () => {
    try {
      expect(normalizePatternId(5)).toBe('05');
      expect(normalizePatternId(255)).toBe('FF');
    } catch (error) {
      console.log('pattern-id number mismatch');
      throw error;
    }
  });

  it('returns an empty id for nullish and non-finite input', () => {
    try {
      expect(normalizePatternId(undefined)).toBe('');
      expect(normalizePatternId(null)).toBe('');
      expect(normalizePatternId(Number.NaN)).toBe('');
    } catch (error) {
      console.log('pattern-id nullish mismatch');
      throw error;
    }
  });
});
