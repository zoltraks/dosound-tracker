// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  generatePianoKeys,
  octaveSpanForContentWidth,
  PIANO_MAX_OCTAVE_SPAN,
  PIANO_MIN_OCTAVE_SPAN,
  PIANO_OCTAVE_WIDTH_PX,
  PIANO_KEYS_PADDING_PX,
} from '../../../src/utils/panel/pianoUtils.ts';
import { MIN_OCTAVE, MAX_OCTAVE, PIANO_SHOW_EXTRA_TOP_C } from '../../../src/constants/music.ts';

const displayedOctaves = (keys: ReturnType<typeof generatePianoKeys>) =>
  new Set(keys.filter((k) => !k.stableKey.startsWith('extra')).map((k) => k.octave));

describe('generatePianoKeys', () => {
  it('renders exactly the requested octave span', () => {
    try {
      expect(displayedOctaves(generatePianoKeys(2, 3)).size).toBe(2);
      expect(displayedOctaves(generatePianoKeys(5, 3)).size).toBe(5);
    } catch (error) {
      console.log('span mismatch');
      throw error;
    }
  });

  it('clamps the span to the minimum', () => {
    try {
      expect(displayedOctaves(generatePianoKeys(0, 3)).size).toBe(PIANO_MIN_OCTAVE_SPAN);
      expect(displayedOctaves(generatePianoKeys(-4, 3)).size).toBe(PIANO_MIN_OCTAVE_SPAN);
      expect(displayedOctaves(generatePianoKeys(Number.NaN, 3)).size).toBe(PIANO_MIN_OCTAVE_SPAN);
    } catch (error) {
      console.log('min span clamp mismatch');
      throw error;
    }
  });

  it('clamps the span to the full playable range', () => {
    try {
      const keys = generatePianoKeys(PIANO_MAX_OCTAVE_SPAN + 5, 4);
      const octaves = [...displayedOctaves(keys)];
      expect(octaves).toHaveLength(PIANO_MAX_OCTAVE_SPAN);
      expect(Math.min(...octaves)).toBe(MIN_OCTAVE);
      expect(Math.max(...octaves)).toBe(MAX_OCTAVE);
    } catch (error) {
      console.log('max span clamp mismatch');
      throw error;
    }
  });

  it('centers the layout on the current octave', () => {
    try {
      const keys = generatePianoKeys(5, 4);
      const octaves = keys.map((k) => k.octave);
      expect(Math.min(...octaves)).toBe(3);
    } catch (error) {
      console.log('center mismatch');
      throw error;
    }
  });

  it('clamps the start octave at the minimum', () => {
    try {
      const keys = generatePianoKeys(5, MIN_OCTAVE);
      expect(Math.min(...keys.map((k) => k.octave))).toBe(MIN_OCTAVE);
    } catch (error) {
      console.log('min clamp mismatch');
      throw error;
    }
  });

  it('clamps so the last displayed octave never exceeds the maximum', () => {
    try {
      const keys = generatePianoKeys(5, MAX_OCTAVE);
      expect(Math.max(...keys.map((k) => k.octave))).toBeLessThanOrEqual(MAX_OCTAVE);
    } catch (error) {
      console.log('max clamp mismatch');
      throw error;
    }
  });

  it('produces seven white keys and five black keys per octave with stable ids', () => {
    try {
      const keys = generatePianoKeys(2, 4);
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

  it('appends the extra top C key when enabled and never duplicates a key id', () => {
    try {
      for (const span of [PIANO_MIN_OCTAVE_SPAN, 5, PIANO_MAX_OCTAVE_SPAN]) {
        const keys = generatePianoKeys(span, MAX_OCTAVE);
        const extra = keys.find((k) => k.stableKey.startsWith('extra-top-c'));
        if (PIANO_SHOW_EXTRA_TOP_C) {
          expect(extra?.note).toBe('C');
          expect(extra?.isBlackKey).toBe(false);
        } else {
          expect(extra).toBeUndefined();
        }
        const positions = keys.map((k) => k.position);
        expect(new Set(positions).size).toBe(positions.length);
        const keyIds = keys.map((k) => k.keyId);
        expect(new Set(keyIds).size).toBe(keyIds.length);
      }
    } catch (error) {
      console.log('extra key mismatch');
      throw error;
    }
  });
});

describe('octaveSpanForContentWidth', () => {
  it('returns the minimum span below two octaves of width', () => {
    try {
      expect(octaveSpanForContentWidth(0)).toBe(PIANO_MIN_OCTAVE_SPAN);
      expect(octaveSpanForContentWidth(PIANO_OCTAVE_WIDTH_PX + PIANO_KEYS_PADDING_PX)).toBe(
        PIANO_MIN_OCTAVE_SPAN,
      );
      expect(octaveSpanForContentWidth(2 * PIANO_OCTAVE_WIDTH_PX + PIANO_KEYS_PADDING_PX - 1)).toBe(
        PIANO_MIN_OCTAVE_SPAN,
      );
    } catch (error) {
      console.log('floor mismatch');
      throw error;
    }
  });

  it('grows by one octave per octave of content width', () => {
    try {
      for (let span = PIANO_MIN_OCTAVE_SPAN; span <= PIANO_MAX_OCTAVE_SPAN; span += 1) {
        const width = span * PIANO_OCTAVE_WIDTH_PX + PIANO_KEYS_PADDING_PX;
        expect(octaveSpanForContentWidth(width)).toBe(span);
      }
    } catch (error) {
      console.log('growth mismatch');
      throw error;
    }
  });

  it('caps the span at the full playable range', () => {
    try {
      expect(octaveSpanForContentWidth(10000)).toBe(PIANO_MAX_OCTAVE_SPAN);
    } catch (error) {
      console.log('cap mismatch');
      throw error;
    }
  });
});
