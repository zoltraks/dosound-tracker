// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  songChipCount,
  songUsesTwoChips,
  songChannelCount,
} from '../../../src/utils/song/songChips.ts';
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

describe('songChipCount', () => {
  it('defaults to one chip', () => {
    expect(songChipCount(song())).toBe(1);
  });

  it('derives two chips from a D/E/F playlist reference', () => {
    expect(songChipCount(song({ line: [{ A: '--', B: '--', C: '--', D: '01' }] }))).toBe(2);
    expect(songChipCount(song({ line: [{ A: '00', B: '01', C: '02', F: '03' }] }))).toBe(2);
  });

  it('treats absent and "--" second-chip keys as single-chip', () => {
    expect(songChipCount(song({ line: [{ A: '00', B: '--', C: '--', D: '--' }] }))).toBe(1);
  });

  it('lets an explicit chipCount override the derivation', () => {
    expect(songChipCount(song({ chipCount: 2 }))).toBe(2);
    expect(
      songChipCount(song({ chipCount: 1, line: [{ A: '00', B: '--', C: '--', D: '01' }] })),
    ).toBe(1);
  });
});

describe('songUsesTwoChips / songChannelCount', () => {
  it('reports the effective chip and channel counts', () => {
    expect(songUsesTwoChips(song())).toBe(false);
    expect(songChannelCount(song())).toBe(3);

    const dual = song({ chipCount: 2 });
    expect(songUsesTwoChips(dual)).toBe(true);
    expect(songChannelCount(dual)).toBe(6);
  });
});
