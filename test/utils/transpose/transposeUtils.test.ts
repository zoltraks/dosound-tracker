import { describe, it, expect, vi } from 'vitest';
import {
  performTranspose,
  type TransposeOptions,
} from '../../../src/utils/transpose/transposeUtils.ts';
import type { Song, Pattern, Step } from '../../../src/synth/SoundDriver.ts';

const step = (note: string | null, octave = 4, instrument = '00'): Step =>
  note === null ? { note: null } : { note: { note, octave, instrument } };

const pattern = (id: string, steps: Step[]): Pattern => ({ id, name: `P${id}`, step: steps });

const song = (lines: { A: string; B: string; C: string }[], patterns: Pattern[]): Song => ({
  title: 'T',
  author: 'A',
  year: 2026,
  speed: 6,
  length: 4,
  pattern: patterns,
  line: lines,
  instrument: [],
});

const options = (overrides: Partial<TransposeOptions> = {}): TransposeOptions => ({
  semitones: 1,
  scope: 'song',
  trackScope: 'all',
  instrumentScope: 'all',
  currentPatternIndex: 0,
  targetTrackId: 'A',
  selectedInstrumentId: '00',
  normalizeInstrumentId: (value) => String(value ?? '00').toUpperCase(),
  ...overrides,
});

describe('performTranspose', () => {
  it('returns null and never touches the song when the playlist is empty', () => {
    const updateSong = vi.fn();
    const result = performTranspose(song([], []), options(), updateSong);
    try {
      expect(result).toBeNull();
      expect(updateSong).not.toHaveBeenCalled();
    } catch (error) {
      console.log('empty-playlist mismatch');
      throw error;
    }
  });

  it('returns zero counts without calling updateSong when no pattern id is referenced', () => {
    const updateSong = vi.fn();
    const result = performTranspose(
      song([{ A: '--', B: '--', C: '--' }], [pattern('00', [step('C')])]),
      options(),
      updateSong,
    );
    try {
      expect(result).toEqual({ patternCount: 0, notesChanged: 0, clippedLow: 0, clippedHigh: 0 });
      expect(updateSong).not.toHaveBeenCalled();
    } catch (error) {
      console.log('no-pattern mismatch');
      throw error;
    }
  });

  it('transposes every referenced pattern in song scope across all tracks', () => {
    const s = song(
      [{ A: '00', B: '01', C: '--' }],
      [pattern('00', [step('C')]), pattern('01', [step('B', 4)])],
    );
    const updateSong = vi.fn();
    const result = performTranspose(s, options({ semitones: 1 }), updateSong);
    try {
      expect(result?.patternCount).toBe(2);
      expect(result?.notesChanged).toBe(2);
      const updated = updateSong.mock.calls[0][0].pattern as Pattern[];
      expect(updated[0].step[0].note).toMatchObject({ note: 'C#', octave: 4 });
      expect(updated[1].step[0].note).toMatchObject({ note: 'C', octave: 5 });
    } catch (error) {
      console.log('song-scope mismatch', result);
      throw error;
    }
  });

  it('limits work to the current line and target track in line/current scope', () => {
    const s = song(
      [
        { A: '00', B: '01', C: '--' },
        { A: '02', B: '--', C: '--' },
      ],
      [pattern('00', [step('C')]), pattern('01', [step('C')]), pattern('02', [step('C')])],
    );
    const updateSong = vi.fn();
    const result = performTranspose(
      s,
      options({ scope: 'line', trackScope: 'current', targetTrackId: 'A', currentPatternIndex: 1 }),
      updateSong,
    );
    try {
      expect(result?.patternCount).toBe(1);
      expect(result?.notesChanged).toBe(1);
      const updated = updateSong.mock.calls[0][0].pattern as Pattern[];
      expect(updated[0].step[0].note?.note).toBe('C');
      expect(updated[1].step[0].note?.note).toBe('C');
      expect(updated[2].step[0].note?.note).toBe('C#');
    } catch (error) {
      console.log('line-scope mismatch', result);
      throw error;
    }
  });

  it('filters notes by the selected instrument in selected scope', () => {
    const s = song(
      [{ A: '00', B: '--', C: '--' }],
      [pattern('00', [step('C', 4, '01'), step('D', 4, '02')])],
    );
    const updateSong = vi.fn();
    const result = performTranspose(
      s,
      options({ instrumentScope: 'selected', selectedInstrumentId: '02' }),
      updateSong,
    );
    try {
      expect(result?.notesChanged).toBe(1);
      const updated = updateSong.mock.calls[0][0].pattern as Pattern[];
      expect(updated[0].step[0].note?.note).toBe('C');
      expect(updated[0].step[1].note?.note).toBe('D#');
    } catch (error) {
      console.log('instrument-scope mismatch', result);
      throw error;
    }
  });

  it('skips key-release and unknown notes', () => {
    const s = song(
      [{ A: '00', B: '--', C: '--' }],
      [pattern('00', [step('==='), step('X'), step(null)])],
    );
    const updateSong = vi.fn();
    const result = performTranspose(s, options(), updateSong);
    try {
      expect(result?.notesChanged).toBe(0);
      const updated = updateSong.mock.calls[0][0].pattern as Pattern[];
      expect(updated[0].step[0].note?.note).toBe('===');
      expect(updated[0].step[1].note?.note).toBe('X');
      expect(updated[0].step[2].note).toBeNull();
    } catch (error) {
      console.log('skip-notes mismatch', result);
      throw error;
    }
  });

  it('counts a clip below the floor even when the note lands back on itself', () => {
    const s = song([{ A: '00', B: '--', C: '--' }], [pattern('00', [step('C', 0)])]);
    const updateSong = vi.fn();
    const result = performTranspose(s, options({ semitones: -2 }), updateSong);
    try {
      expect(result?.clippedLow).toBe(1);
      expect(result?.notesChanged).toBe(0);
      const updated = updateSong.mock.calls[0][0].pattern as Pattern[];
      expect(updated[0].step[0].note?.note).toBe('C');
      expect(updated[0].step[0].note?.octave).toBe(0);
    } catch (error) {
      console.log('clip-low mismatch', result);
      throw error;
    }
  });

  it('clips notes above the ceiling to the maximum octave', () => {
    const s = song([{ A: '00', B: '--', C: '--' }], [pattern('00', [step('B', 7)])]);
    const updateSong = vi.fn();
    const result = performTranspose(s, options({ semitones: 5 }), updateSong);
    try {
      expect(result?.clippedHigh).toBe(1);
      expect(result?.notesChanged).toBe(0);
      const updated = updateSong.mock.calls[0][0].pattern as Pattern[];
      expect(updated[0].step[0].note?.note).toBe('B');
      expect(updated[0].step[0].note?.octave).toBe(7);
    } catch (error) {
      console.log('clip-high mismatch', result);
      throw error;
    }
  });
});
