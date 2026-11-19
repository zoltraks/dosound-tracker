import { describe, it, expect } from 'vitest';
import { normalizeSongStereo, resolveChannelPans } from '../../../src/utils/song/songStereo.ts';

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

  it('reads one and two mode keys case-insensitively', () => {
    expect(normalizeSongStereo({ one: 'abc', two: ' Cab ' })).toEqual({
      one: 'ABC',
      two: 'CAB',
    });
    expect(normalizeSongStereo({ one: 'l' })).toEqual({ one: 'L' });
  });

  it('drops invalid mode values and legacy layout/pan members', () => {
    expect(normalizeSongStereo({ one: 'surround', two: 'R' })).toEqual({ two: 'R' });
    expect(normalizeSongStereo({ layout: 'abc', A: 0, C: 1 })).toBeUndefined();
    expect(normalizeSongStereo({ one: 5, two: null })).toBeUndefined();
  });
});

describe('resolveChannelPans', () => {
  it('defaults a single-chip song to centre pans without a stereo node', () => {
    expect(resolveChannelPans(undefined)).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
    expect(resolveChannelPans(undefined, 1)).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
  });

  it('defaults a two-chip song to the chip split without a stereo node', () => {
    expect(resolveChannelPans(undefined, 2)).toEqual([0, 0, 0, 1, 1, 1]);
  });

  it('resolves L, R, and C modes per chip', () => {
    expect(resolveChannelPans({ one: 'L', two: 'R' })).toEqual([0, 0, 0, 1, 1, 1]);
    expect(resolveChannelPans({ one: 'R', two: 'L' })).toEqual([1, 1, 1, 0, 0, 0]);
    expect(resolveChannelPans({ one: 'C', two: 'C' })).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
  });

  it('resolves every ABC permutation to its slot assignment', () => {
    expect(resolveChannelPans({ one: 'ABC' })).toEqual([0, 0.5, 1, 0.5, 0.5, 0.5]);
    expect(resolveChannelPans({ one: 'ACB' })).toEqual([0, 1, 0.5, 0.5, 0.5, 0.5]);
    expect(resolveChannelPans({ one: 'BAC' })).toEqual([0.5, 0, 1, 0.5, 0.5, 0.5]);
    expect(resolveChannelPans({ one: 'BCA' })).toEqual([1, 0, 0.5, 0.5, 0.5, 0.5]);
    expect(resolveChannelPans({ one: 'CAB' })).toEqual([0.5, 1, 0, 0.5, 0.5, 0.5]);
    expect(resolveChannelPans({ one: 'CBA' })).toEqual([1, 0.5, 0, 0.5, 0.5, 0.5]);
  });

  it('applies the two mode to the D, E, and F slots', () => {
    expect(resolveChannelPans({ two: 'ABC' }, 2)).toEqual([0, 0, 0, 0, 0.5, 1]);
    expect(resolveChannelPans({ two: 'CAB' }, 2)).toEqual([0, 0, 0, 0.5, 1, 0]);
  });

  it('fills a missing key from the chip-count default', () => {
    expect(resolveChannelPans({ one: 'C' }, 2)).toEqual([0.5, 0.5, 0.5, 1, 1, 1]);
    expect(resolveChannelPans({ two: 'L' }, 2)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(resolveChannelPans({ one: 'ABC' }, 1)).toEqual([0, 0.5, 1, 0.5, 0.5, 0.5]);
  });
});
