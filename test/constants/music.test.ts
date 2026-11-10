// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { pow2Octave, pow2Semitone } from '../../src/constants/music.ts';

describe('pow2Octave', () => {
  it('matches Math.pow at every integer exponent in domain', () => {
    try {
      for (let exponent = -8; exponent <= 8; exponent++) {
        expect(pow2Octave(exponent)).toBe(Math.pow(2, exponent));
      }
    } catch (error) {
      console.log('pow2Octave domain mismatch');
      throw error;
    }
  });

  it('falls back to Math.pow outside the table and for fractional exponents', () => {
    try {
      expect(pow2Octave(-9)).toBe(Math.pow(2, -9));
      expect(pow2Octave(9)).toBe(Math.pow(2, 9));
      expect(pow2Octave(2.5)).toBe(Math.pow(2, 2.5));
      expect(pow2Octave(-4.25)).toBe(Math.pow(2, -4.25));
    } catch (error) {
      console.log('pow2Octave fallback mismatch');
      throw error;
    }
  });
});

describe('pow2Semitone', () => {
  it('matches Math.pow at every integer semitone in domain', () => {
    try {
      for (let semitones = -48; semitones <= 48; semitones++) {
        expect(pow2Semitone(semitones)).toBe(Math.pow(2, semitones / 12));
      }
    } catch (error) {
      console.log('pow2Semitone domain mismatch');
      throw error;
    }
  });

  it('falls back to Math.pow outside the table and for fractional semitones', () => {
    try {
      expect(pow2Semitone(-49)).toBe(Math.pow(2, -49 / 12));
      expect(pow2Semitone(49)).toBe(Math.pow(2, 49 / 12));
      expect(pow2Semitone(3.5)).toBe(Math.pow(2, 3.5 / 12));
      expect(pow2Semitone(0.001)).toBe(Math.pow(2, 0.001 / 12));
    } catch (error) {
      console.log('pow2Semitone fallback mismatch');
      throw error;
    }
  });
});
