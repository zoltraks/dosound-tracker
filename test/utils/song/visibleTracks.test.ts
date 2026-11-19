// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { nextTrackWindowStart, visibleTrackIds } from '../../../src/utils/song/visibleTracks.ts';

describe('visibleTrackIds', () => {
  it('always shows A-C for a single-chip song', () => {
    expect(visibleTrackIds(false, 3, 0)).toEqual(['A', 'B', 'C']);
    expect(visibleTrackIds(false, 6, 3)).toEqual(['A', 'B', 'C']);
    expect(visibleTrackIds(false, 3, 3)).toEqual(['A', 'B', 'C']);
  });

  it('shows all six channels in six-track mode', () => {
    expect(visibleTrackIds(true, 6, 0)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(visibleTrackIds(true, 6, 3)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('slides the three-track window across the six channels', () => {
    expect(visibleTrackIds(true, 3, 0)).toEqual(['A', 'B', 'C']);
    expect(visibleTrackIds(true, 3, 1)).toEqual(['B', 'C', 'D']);
    expect(visibleTrackIds(true, 3, 2)).toEqual(['C', 'D', 'E']);
    expect(visibleTrackIds(true, 3, 3)).toEqual(['D', 'E', 'F']);
  });

  it('clamps an out-of-range window start', () => {
    expect(visibleTrackIds(true, 3, -2)).toEqual(['A', 'B', 'C']);
    expect(visibleTrackIds(true, 3, 9)).toEqual(['D', 'E', 'F']);
  });
});

describe('nextTrackWindowStart', () => {
  it('keeps the window when the target is already inside', () => {
    expect(nextTrackWindowStart(0, 0)).toBe(0);
    expect(nextTrackWindowStart(0, 2)).toBe(0);
    expect(nextTrackWindowStart(1, 3)).toBe(1);
  });

  it('slides right when the target enters past the right edge', () => {
    expect(nextTrackWindowStart(0, 3)).toBe(1);
    expect(nextTrackWindowStart(1, 4)).toBe(2);
    expect(nextTrackWindowStart(2, 5)).toBe(3);
  });

  it('slides left when the target enters past the left edge', () => {
    expect(nextTrackWindowStart(3, 1)).toBe(1);
    expect(nextTrackWindowStart(2, 0)).toBe(0);
  });

  it('clamps multi-step jumps to the window bounds', () => {
    expect(nextTrackWindowStart(0, 5)).toBe(3);
    expect(nextTrackWindowStart(3, 0)).toBe(0);
  });
});
