import { describe, it, expect } from 'vitest';
import {
  createClearedInstrument,
  countInstrumentUsage,
  cloneInstrumentToNextFreeSlot,
  moveInstrumentAndRemapPatterns,
  clearInstrumentAndNotes,
  clearInstrumentOnly,
} from '../../../src/utils/instrument/instrumentOperations.ts';
import { normalizeInstrumentId } from '../../../src/utils/playback/playbackUtils.ts';
import { MAX_INSTRUMENTS, ENVELOPE_LENGTH } from '../../../src/constants/music.ts';
import type { Instrument, Pattern } from '../../../src/synth/SoundDriver.ts';
import { asInstrumentId } from '../../../src/types/branded.ts';

const inst = (id: string, name = ''): Instrument => ({
  id,
  name,
  volume: new Array(ENVELOPE_LENGTH).fill(0),
  shift: new Array(ENVELOPE_LENGTH).fill(0),
  pitch: new Array(ENVELOPE_LENGTH).fill(0),
  noise: new Array(ENVELOPE_LENGTH).fill(0),
  mode: new Array(ENVELOPE_LENGTH).fill(0),
});

const usedInst = (id: string): Instrument => ({ ...inst(id), volume: [15] });

const patternWithNotes = (instrument: string): Pattern => ({
  id: '00',
  name: 'P',
  step: [
    { note: { note: 'C', octave: 4, instrument }, volume: null },
    { note: null, volume: null },
    { note: { note: 'D', octave: 4, instrument }, volume: 5 },
  ],
});

describe('createClearedInstrument', () => {
  it('builds an empty instrument for the slot', () => {
    try {
      const cleared = createClearedInstrument(asInstrumentId('07'));
      expect(cleared.id).toBe('07');
      expect(cleared.volume).toHaveLength(ENVELOPE_LENGTH);
    } catch (error) {
      console.log('cleared mismatch');
      throw error;
    }
  });
});

describe('countInstrumentUsage', () => {
  it('counts note references and touched patterns', () => {
    try {
      const patterns = [
        patternWithNotes('01'),
        patternWithNotes('02'),
        { ...patternWithNotes('01'), id: '02' },
      ];
      const result = countInstrumentUsage(patterns, asInstrumentId('01'), normalizeInstrumentId);
      expect(result.usageCount).toBe(4);
      expect(result.patternCount).toBe(2);
    } catch (error) {
      console.log('usage mismatch');
      throw error;
    }
  });

  it('skips null patterns, null lines, and note-free steps', () => {
    try {
      const patterns = [
        null as unknown as Pattern,
        { id: 'x', name: 'x', step: [null, { note: null, volume: null }] } as unknown as Pattern,
      ];
      const result = countInstrumentUsage(patterns, asInstrumentId('01'), normalizeInstrumentId);
      expect(result).toEqual({ usageCount: 0, patternCount: 0 });
    } catch (error) {
      console.log('null-safety mismatch');
      throw error;
    }
  });
});

describe('cloneInstrumentToNextFreeSlot', () => {
  it('fails when every slot is taken', () => {
    try {
      const full = Array.from({ length: MAX_INSTRUMENTS }, (_, i) => usedInst(i.toString(16)));
      const result = cloneInstrumentToNextFreeSlot(full, usedInst('00'));
      expect(result.ok).toBe(false);
    } catch (error) {
      console.log('full-slot mismatch');
      throw error;
    }
  });

  it('clones into the next free slot after the current index', () => {
    try {
      const instruments = [usedInst('00'), inst('01'), usedInst('02')];
      // inst('01') counts as empty because every envelope is zero
      const result = cloneInstrumentToNextFreeSlot(instruments, instruments[0]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.clonedInstrument.id).toBe('01');
        expect(result.clonedInstrument.volume[0]).toBe(15);
      }
    } catch (error) {
      console.log('clone-next mismatch');
      throw error;
    }
  });

  it('appends at the end when no free slot exists inside the list', () => {
    try {
      const instruments = [usedInst('00'), usedInst('01')];
      const result = cloneInstrumentToNextFreeSlot(instruments, instruments[1]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.clonedInstrument.id).toBe('02');
        expect(result.instruments).toHaveLength(3);
      }
    } catch (error) {
      console.log('append mismatch');
      throw error;
    }
  });
});

describe('moveInstrumentAndRemapPatterns', () => {
  it('returns null for empty lists and out-of-range moves', () => {
    try {
      expect(moveInstrumentAndRemapPatterns([], [], 0, 'up')).toBeNull();
      expect(moveInstrumentAndRemapPatterns([inst('00')], [], 0, 'up')).toBeNull();
      expect(moveInstrumentAndRemapPatterns([inst('00'), inst('01')], [], 1, 'down')).toBeNull();
    } catch (error) {
      console.log('null-case mismatch');
      throw error;
    }
  });

  it('swaps ids and remaps note instrument references', () => {
    try {
      const instruments = [usedInst('00'), usedInst('01'), usedInst('02')];
      const patterns = [patternWithNotes('00'), patternWithNotes('01')];
      const result = moveInstrumentAndRemapPatterns(instruments, patterns, 0, 'down');
      expect(result).not.toBeNull();
      expect(result!.instruments[1].id).toBe('01');
      expect(result!.instrumentIdMap['00']).toBe('01');
      expect(result!.instrumentIdMap['01']).toBe('00');
      const remapped = result!.remappedPatterns[0].step[0].note;
      expect(remapped?.instrument).toBe('01');
      const remappedSecond = result!.remappedPatterns[1].step[0].note;
      expect(remappedSecond?.instrument).toBe('00');
    } catch (error) {
      console.log('move mismatch');
      throw error;
    }
  });
});

describe('clearInstrumentAndNotes', () => {
  it('clears the slot and strips its notes', () => {
    try {
      const instruments = [usedInst('00'), usedInst('01')];
      instruments[1].name = 'Lead';
      const patterns = [patternWithNotes('01'), patternWithNotes('00')];
      const result = clearInstrumentAndNotes(
        instruments,
        patterns,
        asInstrumentId('01'),
        normalizeInstrumentId,
      );
      expect(result).not.toBeNull();
      expect(result!.notesCleared).toBe(2);
      expect(result!.patternsTouched).toBe(1);
      expect(result!.slotName).toBe('Lead');
      expect(result!.instruments[1].id).toBe('01');
      expect(result!.patterns[0].step[0].note).toBeNull();
      expect(result!.patterns[1].step[0].note?.instrument).toBe('00');
    } catch (error) {
      console.log('clear mismatch');
      throw error;
    }
  });

  it('returns null when the id is not found', () => {
    try {
      expect(
        clearInstrumentAndNotes([usedInst('00')], [], asInstrumentId('09'), normalizeInstrumentId),
      ).toBeNull();
    } catch (error) {
      console.log('not-found mismatch');
      throw error;
    }
  });
});

describe('clearInstrumentOnly', () => {
  it('replaces the slot without touching patterns', () => {
    try {
      const instruments = [usedInst('00'), usedInst('01')];
      const result = clearInstrumentOnly(instruments, asInstrumentId('00'), normalizeInstrumentId);
      expect(result).not.toBeNull();
      expect(result!.clearedInstrument.id).toBe('00');
      expect(result!.instruments[1].volume[0]).toBe(15);
    } catch (error) {
      console.log('clear-only mismatch');
      throw error;
    }
  });

  it('returns null when the id is missing', () => {
    try {
      expect(
        clearInstrumentOnly([usedInst('00')], asInstrumentId('03'), normalizeInstrumentId),
      ).toBeNull();
    } catch (error) {
      console.log('clear-only null mismatch');
      throw error;
    }
  });
});

describe('normalizeInstrumentId', () => {
  it.each([
    [15, '0F'],
    ['1a', '1A'],
    ['$0c', '0C'],
    ['  7  ', '07'],
    ['bass', 'BASS'],
    [undefined, ''],
    [null, ''],
    ['', ''],
  ])('normalizes %s to %s', (input, expected) => {
    try {
      expect(normalizeInstrumentId(input as number | string | null | undefined)).toBe(expected);
    } catch (error) {
      console.log('normalize mismatch', input);
      throw error;
    }
  });
});
