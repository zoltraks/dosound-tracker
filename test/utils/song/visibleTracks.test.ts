// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  CHIP1_TRACK_IDS,
  CHIP2_TRACK_IDS,
  visibleTrackIds,
} from '../../../src/utils/song/visibleTracks.ts';

describe('visibleTrackIds', () => {
  it('always shows A-C while the dual-chip setting is off', () => {
    expect(visibleTrackIds(false, 3, 0)).toEqual(['A', 'B', 'C']);
    expect(visibleTrackIds(false, 6, 1)).toEqual(['A', 'B', 'C']);
    expect(visibleTrackIds(false, 3, 1)).toEqual(['A', 'B', 'C']);
  });

  it('shows all six channels in six-track mode', () => {
    expect(visibleTrackIds(true, 6, 0)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(visibleTrackIds(true, 6, 1)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('switches between chip groups in three-track mode', () => {
    expect(visibleTrackIds(true, 3, 0)).toEqual(CHIP1_TRACK_IDS);
    expect(visibleTrackIds(true, 3, 1)).toEqual(CHIP2_TRACK_IDS);
    expect(visibleTrackIds(true, 3, 1)).toEqual(['D', 'E', 'F']);
  });
});
