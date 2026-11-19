// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { AyumiCore } from '../../src/synth/ayumiCore.ts';

const render = (core: AyumiCore, count: number): number[] => {
  const samples: number[] = [];
  for (let i = 0; i < count; i++) {
    core.process();
    core.removeDc();
    samples.push(core.left);
  }
  return samples;
};

const makeCore = (): AyumiCore => {
  const core = new AyumiCore();
  core.configure(true, 2_000_000, 44100);
  for (let channel = 0; channel < 3; channel++) {
    core.setPan(channel, 0.5, false);
  }
  return core;
};

describe('AyumiCore pan laws', () => {
  it('matches the StereoPannerNode equal-power curve at reachable pans', () => {
    const core = new AyumiCore();
    // Reachable song pans are only 0, 0.5, and 1 - where the equal-power
    // law coincides with the internal engine's cos/sin taper.
    const cases: Array<[number, number, number]> = [
      [0, 1, 0],
      [0.5, Math.SQRT1_2, Math.SQRT1_2],
      [1, 0, 1],
    ];
    for (const [pan, left, right] of cases) {
      core.setPan(0, pan, true);
      const channel = (core as unknown as { channels: { panLeft: number; panRight: number }[] })
        .channels[0];
      expect(channel.panLeft).toBeCloseTo(left, 10);
      expect(channel.panRight).toBeCloseTo(right, 10);
    }
  });

  it('restores unity gains on both sides through the bypass', () => {
    const core = new AyumiCore();
    core.setPan(0, 0, true);
    core.setPanBypass(0);
    const channel = (core as unknown as { channels: { panLeft: number; panRight: number }[] })
      .channels[0];
    expect(channel.panLeft).toBe(1);
    expect(channel.panRight).toBe(1);
  });
});

describe('AyumiCore rendering', () => {
  it('produces silence when no channel is enabled', () => {
    const core = makeCore();
    core.setMixer(0, 1, 1, 0);
    core.setMixer(1, 1, 1, 0);
    core.setMixer(2, 1, 1, 0);
    const samples = render(core, 2048);
    try {
      expect(samples.every((v) => v === 0)).toBe(true);
    } catch (error) {
      console.log('silent output mismatch:', samples.slice(0, 8));
      throw error;
    }
  });

  it('produces nonzero periodic output for an enabled tone channel', () => {
    const core = makeCore();
    core.setMixer(0, 0, 1, 0);
    core.setVolume(0, 15);
    core.setTone(0, 284);
    const samples = render(core, 4410);
    try {
      expect(samples.some((v) => v !== 0)).toBe(true);
      expect(Math.max(...samples)).toBeGreaterThan(0);
      expect(Math.min(...samples)).toBeLessThanOrEqual(0.1);
    } catch (error) {
      console.log('tone output mismatch:', Math.max(...samples), Math.min(...samples));
      throw error;
    }
  });

  it('lowers the measured fundamental when the tone period doubles', () => {
    const measureZeroCrossings = (period: number): number => {
      const core = makeCore();
      core.setMixer(0, 0, 1, 0);
      core.setVolume(0, 15);
      core.setTone(0, period);
      const samples = render(core, 8820);
      let crossings = 0;
      for (let i = 1; i < samples.length; i++) {
        if (samples[i - 1] <= 0 && samples[i] > 0) crossings++;
      }
      return crossings;
    };
    const shortPeriod = measureZeroCrossings(142);
    const longPeriod = measureZeroCrossings(284);
    try {
      expect(shortPeriod).toBeGreaterThan(longPeriod);
    } catch (error) {
      console.log('crossing counts:', shortPeriod, longPeriod);
      throw error;
    }
  });

  it('produces non-periodic output for a noise-only channel', () => {
    const core = makeCore();
    core.setMixer(0, 1, 0, 0);
    core.setVolume(0, 15);
    core.setNoise(10);
    const samples = render(core, 4410);
    const signs = samples.map((v) => (v > 0 ? 1 : v < 0 ? -1 : 0));
    let longestRun = 0;
    let run = 1;
    for (let i = 1; i < signs.length; i++) {
      if (signs[i] === signs[i - 1]) {
        run++;
        longestRun = Math.max(longestRun, run);
      } else {
        run = 1;
      }
    }
    try {
      expect(samples.some((v) => v !== 0)).toBe(true);
      expect(longestRun).toBeLessThan(2000);
    } catch (error) {
      console.log('noise longest run:', longestRun);
      throw error;
    }
  });

  it('moves through envelope segments for a sawtooth shape', () => {
    const core = makeCore();
    core.setMixer(0, 1, 1, 1);
    core.setEnvelope(200);
    core.setEnvelopeShape(0x08);
    const initialEnvelope = core.envelope;
    const seen = new Set<number>();
    for (let i = 0; i < 20000 && seen.size < 32; i++) {
      core.process();
      seen.add(core.envelope);
    }
    try {
      expect(initialEnvelope).toBe(31);
      expect(seen.size).toBe(32);
    } catch (error) {
      console.log('envelope walk:', [...seen].sort((a, b) => a - b).join(','));
      throw error;
    }
  });
});
