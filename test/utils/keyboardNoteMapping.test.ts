import { describe, expect, it } from 'vitest';
import { clampOctave, getKeyboardMappedNote } from '../../src/utils/keyboardNoteMapping';

describe('keyboardNoteMapping', () => {
  it('clampOctave clamps into 0..7', () => {
    expect(clampOctave(-1)).toBe(0);
    expect(clampOctave(0)).toBe(0);
    expect(clampOctave(7)).toBe(7);
    expect(clampOctave(8)).toBe(7);
  });

  it('getKeyboardMappedNote returns null for unmapped keys', () => {
    const mapping = { Z: { note: 'C', octaveOffset: 0 } };
    expect(getKeyboardMappedNote('X', 4, mapping)).toBeNull();
  });

  it('getKeyboardMappedNote maps key and clamps octave', () => {
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
  });
});
