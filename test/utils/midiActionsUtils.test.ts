import { describe, expect, it } from 'vitest';
import {
  transposeMidiNoteToInstrumentBase,
  velocityToVolumeNibble,
} from '../../src/utils/midiActionsUtils';

describe('midiActionsUtils', () => {
  it('velocityToVolumeNibble clamps and scales 0..127 to 1..15', () => {
    expect(velocityToVolumeNibble(-100)).toBe(1);
    expect(velocityToVolumeNibble(0)).toBe(1);
    expect(velocityToVolumeNibble(1)).toBe(1);
    expect(velocityToVolumeNibble(127)).toBe(15);
    expect(velocityToVolumeNibble(200)).toBe(15);
  });

  it('transposeMidiNoteToInstrumentBase returns null for unknown notes', () => {
    expect(transposeMidiNoteToInstrumentBase('H', 4, { note: 'C', octave: 4 })).toBeNull();
  });

  it('transposeMidiNoteToInstrumentBase leaves notes unchanged when base key is C-4', () => {
    expect(transposeMidiNoteToInstrumentBase('C', 4, { note: 'C', octave: 4 })).toEqual({
      note: 'C',
      octave: 4,
    });

    expect(transposeMidiNoteToInstrumentBase('D#', 5, { note: 'C', octave: 4 })).toEqual({
      note: 'D#',
      octave: 5,
    });
  });

  it('transposeMidiNoteToInstrumentBase shifts input by base key semitone offset vs C-4 reference', () => {
    // Base key is C-3, so controller C-4 should preview as C-3
    expect(transposeMidiNoteToInstrumentBase('C', 4, { note: 'C', octave: 3 })).toEqual({
      note: 'C',
      octave: 3,
    });

    // Base key is D-4 (2 semitones above C-4), so controller C-4 becomes D-4
    expect(transposeMidiNoteToInstrumentBase('C', 4, { note: 'D', octave: 4 })).toEqual({
      note: 'D',
      octave: 4,
    });
  });
});
