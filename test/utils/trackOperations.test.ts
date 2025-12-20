import { describe, expect, it } from 'vitest';
import type { Pattern, Note } from '../../src/synth/SoundDriver';
import {
  clearPatternPosition,
  createNoteOff,
  insertNoteAtLine,
  insertNoteOffStep,
  setPatternVolume,
  updatePatternStep,
} from '../../src/utils/trackOperations';

describe('trackOperations', () => {
  const basePattern: Pattern = {
    id: '00',
    name: 'Test',
    step: [{ note: null }, { note: null }],
  };

  it('updatePatternStep updates immutably and ensures missing steps', () => {
    const updated = updatePatternStep(basePattern, 0, step => ({
      ...step,
      note: { note: 'C', octave: 4, instrument: '00' },
    }));

    expect(updated).not.toBe(basePattern);
    expect(updated.step).not.toBe(basePattern.step);
    expect(basePattern.step[0]?.note).toBeNull();
    expect(updated.step[0]?.note).toEqual({ note: 'C', octave: 4, instrument: '00' });

    const missing = updatePatternStep(basePattern, 5, step => ({ ...step, volume: 3 }));
    expect(missing.step[5]).toEqual({ note: null, volume: 3 });
  });

  it('createNoteOff returns canonical copy', () => {
    const first = createNoteOff();
    const second = createNoteOff();
    expect(first).toEqual({ note: '===', octave: 0, instrument: '00' });
    expect(second).toEqual(first);
    expect(first).not.toBe(second); // ensure copy
  });

  it('clearPatternPosition removes note or volume based on column', () => {
    const newNote: Note = { note: 'D', octave: 3, instrument: '01' };
    const withNote = insertNoteAtLine(basePattern, 0, newNote);
    const clearedNote = clearPatternPosition(withNote, 0, 'note');
    expect(clearedNote.step[0]).toEqual({ note: null, volume: undefined });

    const withVolume = setPatternVolume(basePattern, 1, 0xA);
    const clearedVolume = clearPatternPosition(withVolume, 1, 'volume');
    expect(clearedVolume.step[1]?.volume).toBeUndefined();
  });

  it('setPatternVolume sets volume immutably', () => {
    const updated = setPatternVolume(basePattern, 0, 5);
    expect(updated.step[0]?.volume).toBe(5);
    expect(basePattern.step[0]?.volume).toBeUndefined();
  });

  it('insertNoteOffStep writes note-off event', () => {
    const updated = insertNoteOffStep(basePattern, 0);
    expect(updated.step[0]?.note).toEqual({ note: '===', octave: 0, instrument: '00' });
  });

  it('insertNoteAtLine writes provided note', () => {
    const newNote: Note = { note: 'G', octave: 2, instrument: '05' };
    const updated = insertNoteAtLine(basePattern, 1, newNote);
    expect(updated.step[1]?.note).toEqual(newNote);
  });
});
