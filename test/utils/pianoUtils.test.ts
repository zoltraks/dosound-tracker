import { describe, it, expect } from 'vitest';
import { generatePianoKeys } from '../../src/utils/panel/pianoUtils.ts';
import { MIN_OCTAVE, MAX_OCTAVE, PIANO_SHOW_EXTRA_TOP_C } from '../../src/constants/music.ts';

describe('generatePianoKeys', () => {
  it('spans two octaves in compact layout and five otherwise', () => {
    try {
      const compact = generatePianoKeys(true, 3);
      const wide = generatePianoKeys(false, 3);
      const compactOctaves = new Set(
        compact.filter((k) => !k.stableKey.startsWith('extra')).map((k) => k.octave),
      );
      const wideOctaves = new Set(
        wide.filter((k) => !k.stableKey.startsWith('extra')).map((k) => k.octave),
      );
      expect(compactOctaves.size).toBe(2);
      expect(wideOctaves.size).toBe(5);
    } catch (error) {
      console.log('span mismatch');
      throw error;
    }
  });

  it('centers the layout on the current octave', () => {
    try {
      const keys = generatePianoKeys(false, 4);
      const octaves = keys.map((k) => k.octave);
      expect(Math.min(...octaves)).toBe(3);
    } catch (error) {
      console.log('center mismatch');
      throw error;
    }
  });

  it('clamps the start octave at the minimum', () => {
    try {
      const keys = generatePianoKeys(false, MIN_OCTAVE);
      expect(Math.min(...keys.map((k) => k.octave))).toBe(MIN_OCTAVE);
    } catch (error) {
      console.log('min clamp mismatch');
      throw error;
    }
  });

  it('clamps so the last displayed octave never exceeds the maximum', () => {
    try {
      const keys = generatePianoKeys(false, MAX_OCTAVE);
      expect(Math.max(...keys.map((k) => k.octave))).toBeLessThanOrEqual(MAX_OCTAVE);
    } catch (error) {
      console.log('max clamp mismatch');
      throw error;
    }
  });

  it('produces seven white keys and five black keys per octave with stable ids', () => {
    try {
      const keys = generatePianoKeys(true, 4);
      const octaveKeys = keys.filter(
        (k) => k.octave === keys[0].octave && !k.stableKey.startsWith('extra'),
      );
      expect(octaveKeys.filter((k) => k.isBlackKey)).toHaveLength(5);
      expect(octaveKeys.filter((k) => !k.isBlackKey)).toHaveLength(7);
      expect(keys.some((k) => k.keyId === 'C#4' || k.note === 'C#')).toBe(true);
    } catch (error) {
      console.log('key mix mismatch');
      throw error;
    }
  });

  it('appends the extra top C key when enabled', () => {
    try {
      const keys = generatePianoKeys(true, 4);
      const extra = keys.find((k) => k.stableKey.startsWith('extra-top-c'));
      if (PIANO_SHOW_EXTRA_TOP_C) {
        expect(extra?.note).toBe('C');
        expect(extra?.isBlackKey).toBe(false);
      }
      const positions = keys.map((k) => k.position);
      expect(new Set(positions).size).toBe(positions.length);
    } catch (error) {
      console.log('extra key mismatch');
      throw error;
    }
  });
});
