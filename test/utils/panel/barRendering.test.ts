// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  getEnvelopeBarHeight,
  getEnvelopeCenteredBarPosition,
} from '../../../src/utils/panel/barRendering.ts';
import { NOISE_MAX, PITCH_MAX, SHIFT_MAX, VOLUME_MAX } from '../../../src/constants/music.ts';

describe('getEnvelopeBarHeight', () => {
  it('scales volume and noise against their maxima', () => {
    try {
      expect(getEnvelopeBarHeight('volume', VOLUME_MAX)).toBe(100);
      expect(getEnvelopeBarHeight('volume', 0)).toBe(0);
      expect(getEnvelopeBarHeight('noise', NOISE_MAX)).toBe(100);
      expect(getEnvelopeBarHeight('noise', 0)).toBe(0);
    } catch (error) {
      console.log('volume/noise height mismatch');
      throw error;
    }
  });

  it('normalizes signed shift and pitch by their absolute bounds', () => {
    try {
      expect(getEnvelopeBarHeight('shift', SHIFT_MAX)).toBe(100);
      expect(getEnvelopeBarHeight('shift', -SHIFT_MAX)).toBeCloseTo(100, 5);
      expect(getEnvelopeBarHeight('pitch', PITCH_MAX)).toBe(100);
      expect(getEnvelopeBarHeight('pitch', -PITCH_MAX)).toBeCloseTo(100, 5);
      expect(getEnvelopeBarHeight('shift', 0)).toBe(0);
    } catch (error) {
      console.log('shift/pitch height mismatch');
      throw error;
    }
  });

  it('maps mode values directly to percent', () => {
    try {
      expect(getEnvelopeBarHeight('mode', 0)).toBe(0);
      expect(getEnvelopeBarHeight('mode', 0.5)).toBe(50);
      expect(getEnvelopeBarHeight('mode', 1)).toBe(100);
    } catch (error) {
      console.log('mode height mismatch');
      throw error;
    }
  });

  it('returns zero for an unknown type', () => {
    try {
      expect(getEnvelopeBarHeight('unknown' as never, 5)).toBe(0);
    } catch (error) {
      console.log('default height branch mismatch');
      throw error;
    }
  });
});

describe('getEnvelopeCenteredBarPosition', () => {
  it('centers shift and pitch values around the midpoint', () => {
    try {
      expect(getEnvelopeCenteredBarPosition('shift', 0)).toBe(50);
      expect(getEnvelopeCenteredBarPosition('shift', SHIFT_MAX)).toBe(0);
      expect(getEnvelopeCenteredBarPosition('shift', -SHIFT_MAX)).toBe(100);
      expect(getEnvelopeCenteredBarPosition('pitch', 0)).toBe(50);
      expect(getEnvelopeCenteredBarPosition('pitch', PITCH_MAX)).toBe(0);
    } catch (error) {
      console.log('centered position mismatch');
      throw error;
    }
  });

  it('returns the midpoint for non-centered types', () => {
    try {
      expect(getEnvelopeCenteredBarPosition('volume', 3)).toBe(50);
      expect(getEnvelopeCenteredBarPosition('noise', 7)).toBe(50);
      expect(getEnvelopeCenteredBarPosition('mode', 1)).toBe(50);
      expect(getEnvelopeCenteredBarPosition('unknown' as never, 1)).toBe(50);
    } catch (error) {
      console.log('non-centered position mismatch');
      throw error;
    }
  });
});
