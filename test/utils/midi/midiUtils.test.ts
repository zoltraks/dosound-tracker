// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { resolveMidiNote } from '../../../src/utils/midi/midiUtils.ts';

describe('resolveMidiNote', () => {
  it('maps a note number onto name, octave, and label', () => {
    try {
      const note = resolveMidiNote(60);
      expect(note.noteName).toBe('C');
      expect(note.octave).toBe(4);
    } catch (error) {
      console.log('midi-note mismatch');
      throw error;
    }
  });

  it('falls back to C for out-of-table note numbers', () => {
    try {
      expect(resolveMidiNote(-1).noteName).toBe('C');
    } catch (error) {
      console.log('midi-fallback mismatch');
      throw error;
    }
  });
});
