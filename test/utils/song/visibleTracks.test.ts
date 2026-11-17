// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  CHIP1_TRACK_IDS,
  CHIP2_TRACK_IDS,
  isDualChipView,
  visibleTrackIds,
} from '../../../src/utils/song/visibleTracks.ts';
import type { Song } from '../../../src/synth/SoundDriver.ts';

const song = (overrides: Partial<Song> = {}): Song => ({
  title: 'T',
  author: 'A',
  year: 2025,
  speed: 6,
  length: 4,
  pattern: [],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [],
  ...overrides,
});

const dual = song({ chipCount: 2 });
const single = song();

describe('isDualChipView', () => {
  it('requires both the setting and a two-chip song', () => {
    expect(isDualChipView(true, dual)).toBe(true);
    expect(isDualChipView(false, dual)).toBe(false);
    expect(isDualChipView(true, single)).toBe(false);
    expect(isDualChipView(false, single)).toBe(false);
  });
});

describe('visibleTrackIds', () => {
  it('always shows A-C when the dual-chip view is off', () => {
    expect(visibleTrackIds(false, dual, 6, 0)).toEqual(['A', 'B', 'C']);
    expect(visibleTrackIds(false, single, 3, 1)).toEqual(['A', 'B', 'C']);
    expect(visibleTrackIds(true, single, 6, 1)).toEqual(['A', 'B', 'C']);
  });

  it('shows all six channels in six-track mode', () => {
    expect(visibleTrackIds(true, dual, 6, 0)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(visibleTrackIds(true, dual, 6, 1)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('switches between chip groups in three-track mode', () => {
    expect(visibleTrackIds(true, dual, 3, 0)).toEqual(CHIP1_TRACK_IDS);
    expect(visibleTrackIds(true, dual, 3, 1)).toEqual(CHIP2_TRACK_IDS);
    expect(visibleTrackIds(true, dual, 3, 1)).toEqual(['D', 'E', 'F']);
  });
});
