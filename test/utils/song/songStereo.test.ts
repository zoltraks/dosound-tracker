import { describe, it, expect } from 'vitest';
import {
  clampChannelPan,
  normalizeSongStereo,
  resolveChannelPans,
} from '../../../src/utils/song/songStereo.ts';

describe('normalizeSongStereo', () => {
  it('returns undefined for missing or malformed input', () => {
    expect(normalizeSongStereo(undefined)).toBeUndefined();
    expect(normalizeSongStereo(null)).toBeUndefined();
    expect(normalizeSongStereo(42)).toBeUndefined();
    expect(normalizeSongStereo([0, 1])).toBeUndefined();
    expect(normalizeSongStereo({})).toBeUndefined();
    expect(normalizeSongStereo('')).toBeUndefined();
    expect(normalizeSongStereo('   ')).toBeUndefined();
  });

  it('accepts a bare string as layout shorthand', () => {
    expect(normalizeSongStereo('abc')).toEqual({ layout: 'abc' });
    expect(normalizeSongStereo('  ACB ')).toEqual({ layout: 'acb' });
  });

  it('reads layout and channel members from a mapping', () => {
    expect(normalizeSongStereo({ layout: 'ABC', A: 0, B: 0.5, C: 1 })).toEqual({
      layout: 'abc',
      A: 0,
      B: 0.5,
      C: 1,
    });
  });

  it('reads second-chip channel members D, E, and F', () => {
    expect(normalizeSongStereo({ layout: 'dual', D: 0, E: 0.5, F: 1 })).toEqual({
      layout: 'dual',
      D: 0,
      E: 0.5,
      F: 1,
    });
  });

  it('clamps channel values into [0, 1] and drops invalid ones', () => {
    expect(normalizeSongStereo({ A: -0.5, B: 1.7, C: 'loud' })).toEqual({ A: 0, B: 1 });
    expect(normalizeSongStereo({ C: '0.75' })).toEqual({ C: 0.75 });
    expect(normalizeSongStereo({ A: Number.NaN })).toBeUndefined();
  });
});

describe('resolveChannelPans', () => {
  it('defaults to centre pans without a stereo node', () => {
    expect(resolveChannelPans(undefined)).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
  });

  it('resolves the named layouts across all six channels', () => {
    expect(resolveChannelPans({ layout: 'mono' })).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
    expect(resolveChannelPans({ layout: 'abc' })).toEqual([0, 0.5, 1, 0.5, 0.5, 0.5]);
    expect(resolveChannelPans({ layout: 'acb' })).toEqual([0, 1, 0.5, 0.5, 0.5, 0.5]);
    expect(resolveChannelPans({ layout: 'dual' })).toEqual([0, 0.25, 0.5, 0.5, 0.75, 1]);
  });

  it('treats an unknown layout as mono', () => {
    expect(resolveChannelPans({ layout: 'surround' })).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
  });

  it('applies per-channel overrides on top of the layout', () => {
    expect(resolveChannelPans({ layout: 'abc', B: 0.25 })).toEqual([0, 0.25, 1, 0.5, 0.5, 0.5]);
    expect(resolveChannelPans({ A: 0.1, C: 0.9 })).toEqual([0.1, 0.5, 0.9, 0.5, 0.5, 0.5]);
  });

  it('applies second-chip overrides to the D, E, and F slots', () => {
    expect(resolveChannelPans({ layout: 'dual', D: 0.1, F: 0.9 })).toEqual([
      0, 0.25, 0.5, 0.1, 0.75, 0.9,
    ]);
  });

  it('clamps out-of-range overrides', () => {
    expect(resolveChannelPans({ A: -1, C: 2 })).toEqual([0, 0.5, 1, 0.5, 0.5, 0.5]);
  });
});

describe('clampChannelPan', () => {
  it('clamps into [0, 1]', () => {
    expect(clampChannelPan(0.5)).toBe(0.5);
    expect(clampChannelPan(-0.2)).toBe(0);
    expect(clampChannelPan(1.2)).toBe(1);
  });
});
