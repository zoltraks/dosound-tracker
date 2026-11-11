// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { AyumiCore } from '../../src/synth/ayumiCore.ts';

// Mirrors the worklet output stage - see AYUMI_OUTPUT_GAIN, AYUMI_SOFT_KNEE,
// and softLimit in src/workers/ayumiWorklet.ts.
const STAGE_GAIN = 1.2;
const SOFT_KNEE = 0.9;

const softLimit = (value: number): number => {
  const magnitude = Math.abs(value);
  if (magnitude <= SOFT_KNEE) {
    return value;
  }
  const head = 1 - SOFT_KNEE;
  return Math.sign(value) * (SOFT_KNEE + head * Math.tanh((magnitude - SOFT_KNEE) / head));
};

const renderFoldedPeak = (count: number): number => {
  const core = new AyumiCore();
  core.configure(true, 2_000_000, 44100);
  let peak = 0;
  for (let channel = 0; channel < 3; channel++) {
    core.setPan(channel, 0.5, false);
    core.setMixer(channel, 0, 0, 0);
    core.setVolume(channel, 15);
    core.setTone(channel, 284);
  }
  for (let i = 0; i < count; i++) {
    core.process();
    core.removeDc();
    peak = Math.max(peak, Math.abs((core.left + core.right) * 0.5));
  }
  return peak;
};

describe('Ayumi output stage gain', () => {
  it('exceeds the clip ceiling under the raw parity gain at maximum output', () => {
    const peak = renderFoldedPeak(44100);
    try {
      expect(peak * STAGE_GAIN).toBeGreaterThan(1.0);
    } catch (error) {
      console.log('folded peak:', peak, 'amplified:', peak * STAGE_GAIN);
      throw error;
    }
  });

  it('keeps the limited output strictly under 1.0 at maximum output', () => {
    const peak = renderFoldedPeak(44100);
    const limited = softLimit(peak * STAGE_GAIN);
    try {
      expect(limited).toBeLessThan(1.0);
      expect(limited).toBeGreaterThan(SOFT_KNEE);
    } catch (error) {
      console.log('folded peak:', peak, 'limited:', limited);
      throw error;
    }
  });

  it('leaves the below-knee region exactly linear', () => {
    const below = SOFT_KNEE / STAGE_GAIN;
    try {
      expect(softLimit(below * STAGE_GAIN)).toBeCloseTo(below * STAGE_GAIN, 10);
      expect(softLimit(0)).toBe(0);
      expect(softLimit(-below * STAGE_GAIN)).toBeCloseTo(-below * STAGE_GAIN, 10);
    } catch (error) {
      console.log('below-knee input:', below * STAGE_GAIN);
      throw error;
    }
  });
});
