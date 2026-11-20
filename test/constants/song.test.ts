// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  channelCountForChipCount,
  channelIdsForChip,
  chipIndexForChannelId,
} from '../../src/constants/song.ts';

describe('chipIndexForChannelId', () => {
  it('maps channels A through C to chip 0', () => {
    try {
      expect(chipIndexForChannelId('A')).toBe(0);
      expect(chipIndexForChannelId('B')).toBe(0);
      expect(chipIndexForChannelId('C')).toBe(0);
    } catch (error) {
      console.log('chip-0 mapping mismatch');
      throw error;
    }
  });

  it('maps channels D through F to chip 1', () => {
    try {
      expect(chipIndexForChannelId('D')).toBe(1);
      expect(chipIndexForChannelId('E')).toBe(1);
      expect(chipIndexForChannelId('F')).toBe(1);
    } catch (error) {
      console.log('chip-1 mapping mismatch');
      throw error;
    }
  });
});

describe('channelIdsForChip', () => {
  it('returns A through C for chip 0 and D through F for chip 1', () => {
    try {
      expect(channelIdsForChip(0)).toEqual(['A', 'B', 'C']);
      expect(channelIdsForChip(1)).toEqual(['D', 'E', 'F']);
    } catch (error) {
      console.log('channel id lists mismatch');
      throw error;
    }
  });
});

describe('channelCountForChipCount', () => {
  it('returns three channels for one chip and six for two', () => {
    try {
      expect(channelCountForChipCount(1)).toBe(3);
      expect(channelCountForChipCount(2)).toBe(6);
    } catch (error) {
      console.log('channel count mismatch');
      throw error;
    }
  });
});
