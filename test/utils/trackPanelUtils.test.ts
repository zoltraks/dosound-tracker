import { describe, expect, it } from 'vitest';
import {
  clampOctave,
  createNoteOff,
  getKeyboardMappedNote,
  getNextTrackSection,
  getPreviousTrackSection,
  parseVolumeNibble,
  stepLineIndex,
  updatePatternStep,
  wrapIndex,
} from '../../src/utils/trackPanelUtils';
import type { Pattern } from '../../src/synth/SoundDriver';

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

  it('updatePatternStep updates immutably and ensures missing steps', () => {
    const pattern: Pattern = {
      id: '00',
      name: 'Test',
      step: [{ note: null }, { note: null }],
    };

    const updated = updatePatternStep(pattern, 0, (step) => ({
      ...step,
      note: { note: 'C', octave: 4, instrument: '00' },
    }));

    expect(updated).not.toBe(pattern);
    expect(updated.step).not.toBe(pattern.step);
    expect(pattern.step[0]?.note).toBeNull();
    expect(updated.step[0]?.note).toEqual({ note: 'C', octave: 4, instrument: '00' });

    const updatedMissing = updatePatternStep(pattern, 5, (step) => ({ ...step, volume: 3 }));
    expect(updatedMissing.step[5]).toEqual({ note: null, volume: 3 });
  });

  it('createNoteOff creates a canonical note-off event', () => {
    expect(createNoteOff()).toEqual({ note: '===', octave: 0, instrument: '00' });
  });
});
