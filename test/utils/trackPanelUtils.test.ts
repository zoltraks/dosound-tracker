import { describe, expect, it } from 'vitest';
import {
  clampOctave,
  getKeyboardMappedNote,
  getNextTrackSection,
  getPreviousTrackSection,
  parseVolumeNibble,
  stepLineIndex,
  wrapIndex,
} from '../../src/utils/trackPanelUtils';

describe('trackPanelUtils', () => {
  it('wrapIndex wraps negative and positive indices', () => {
    expect(wrapIndex(0, 4)).toBe(0);
    expect(wrapIndex(3, 4)).toBe(3);
    expect(wrapIndex(4, 4)).toBe(0);
    expect(wrapIndex(5, 4)).toBe(1);
    expect(wrapIndex(-1, 4)).toBe(3);
    expect(wrapIndex(-5, 4)).toBe(3);
  });

  it('stepLineIndex uses wrapIndex semantics', () => {
    expect(stepLineIndex(0, 8, 1)).toBe(1);
    expect(stepLineIndex(0, 8, -1)).toBe(7);
    expect(stepLineIndex(7, 8, 1)).toBe(0);
    expect(stepLineIndex(2, 8, 16)).toBe(2);
  });

  it('clampOctave clamps into 0..7', () => {
    expect(clampOctave(-10)).toBe(0);
    expect(clampOctave(0)).toBe(0);
    expect(clampOctave(7)).toBe(7);
    expect(clampOctave(10)).toBe(7);
  });

  it('track section helpers map previous/next track', () => {
    expect(getPreviousTrackSection('A')).toBe('trackC');
    expect(getPreviousTrackSection('B')).toBe('trackA');
    expect(getPreviousTrackSection('C')).toBe('trackB');

    expect(getNextTrackSection('A')).toBe('trackB');
    expect(getNextTrackSection('B')).toBe('trackC');
    expect(getNextTrackSection('C')).toBe('trackA');
  });

  it('parseVolumeNibble parses valid hex nibbles and clamps', () => {
    expect(parseVolumeNibble('0')).toBe(0);
    expect(parseVolumeNibble('A')).toBe(10);
    expect(parseVolumeNibble('F')).toBe(15);
    expect(parseVolumeNibble('G')).toBeNull();
    expect(parseVolumeNibble('')).toBeNull();
  });

  it('getKeyboardMappedNote maps key to note+octave with clamping', () => {
    const mapping = {
      Z: { note: 'C', octaveOffset: 0 },
      Q: { note: 'C', octaveOffset: 1 },
    };

    expect(getKeyboardMappedNote('Z', 4, mapping)).toEqual({
      note: 'C',
      octave: 4,
      keyId: 'C4',
    });

    expect(getKeyboardMappedNote('Q', 7, mapping)).toEqual({
      note: 'C',
      octave: 7,
      keyId: 'C7',
    });

    expect(getKeyboardMappedNote('X', 4, mapping)).toBeNull();
  });

  it('parseVolumeNibble clamps out-of-range inputs', () => {
    expect(parseVolumeNibble('F')).toBe(15);
    expect(parseVolumeNibble('G')).toBeNull();
  });
});
