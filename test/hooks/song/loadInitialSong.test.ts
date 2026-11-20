// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { loadInitialSong, SONG_STORAGE_KEY } from '../../../src/hooks/song/useSongManagement.ts';
import { ENVELOPE_LENGTH, PATTERN_LENGTH } from '../../../src/constants/music.ts';

const storedSong = (overrides: Record<string, unknown> = {}) => ({
  title: 'Stored',
  author: 'A',
  year: 2024,
  speed: 6,
  length: 8,
  pattern: [
    {
      id: '00',
      name: 'P',
      step: [{ note: null, volume: 5 }],
    },
  ],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [{ id: '00', name: 'i', volume: [15] }],
  ...overrides,
});

describe('loadInitialSong', () => {
  it('returns the bundled song when nothing is stored', () => {
    try {
      const song = loadInitialSong();
      expect(song.pattern.length).toBeGreaterThan(0);
      expect(song.instrument.length).toBeGreaterThan(0);
      expect(song.speed % 2).toBe(0);
    } catch (error) {
      console.log('bundled mismatch');
      throw error;
    }
  });

  it('loads and normalizes a stored song, forcing an even speed', () => {
    localStorage.setItem(SONG_STORAGE_KEY, JSON.stringify(storedSong({ speed: 5 })));
    try {
      const song = loadInitialSong();
      expect(song.title).toBe('Stored');
      expect(song.speed % 2).toBe(0);
      expect(song.line[0].A).toBe('00');
    } catch (error) {
      console.log('stored mismatch');
      throw error;
    }
  });

  it('clamps invalid speed to the default', () => {
    localStorage.setItem(SONG_STORAGE_KEY, JSON.stringify(storedSong({ speed: -4 })));
    try {
      const song = loadInitialSong();
      expect(song.speed).toBe(6);
    } catch (error) {
      console.log('speed clamp mismatch');
      throw error;
    }
  });

  it('migrates legacy field names into the current schema', () => {
    const legacy = storedSong({
      patternLength: 16,
      length: undefined,
      patterns: [
        {
          id: '00',
          name: 'P',
          lines: [{ A: { note: 'C', octave: 4, instrument: '00' } }],
        },
      ],
      playlist: [{ trackA: '00', trackB: '--', trackC: '--' }],
      instruments: [
        {
          id: '00',
          name: 'i',
          volume: [15],
          noiseEnvelope: [4],
          arpeggio: [0, 12],
        },
      ],
      chip: ' ym ',
      frame: 'not a number',
      clock: 1000000.9,
    }) as Record<string, unknown>;
    delete legacy.pattern;
    delete legacy.line;
    delete legacy.instrument;
    delete legacy.length;
    localStorage.setItem(SONG_STORAGE_KEY, JSON.stringify(legacy));
    try {
      const song = loadInitialSong();
      expect(song.length).toBe(16);
      expect(song.pattern[0].step[0].note?.note).toBe('C');
      expect(song.line[0].A).toBe('00');
      const inst = song.instrument[0];
      expect(inst.noise).toHaveLength(ENVELOPE_LENGTH);
      expect(inst.noise.every((value) => value === 4)).toBe(true);
      expect(inst.shift).toHaveLength(ENVELOPE_LENGTH);
      expect(inst.shift[1]).toBe(12);
      expect(song.chip).toBe('YM');
      expect(song.frame).toBe(50);
      expect(song.clock).toBe(1000000);
    } catch (error) {
      console.log('migration mismatch');
      throw error;
    }
  });

  it('discards a stored song whose instruments use the old envelope schema', () => {
    localStorage.setItem(
      SONG_STORAGE_KEY,
      JSON.stringify(
        storedSong({
          instruments: [{ id: '00', name: 'i', volumeEnvelope: [15] }],
        }),
      ),
    );
    try {
      const song = loadInitialSong();
      expect(song.title).not.toBe('Stored');
      expect(localStorage.getItem(SONG_STORAGE_KEY)).toBeNull();
    } catch (error) {
      console.log('legacy discard mismatch');
      throw error;
    }
  });

  it('falls back to the bundled song on corrupt JSON', () => {
    localStorage.setItem(SONG_STORAGE_KEY, '{corrupt');
    try {
      const song = loadInitialSong();
      expect(song.pattern.length).toBeGreaterThan(0);
    } catch (error) {
      console.log('corrupt mismatch');
      throw error;
    }
  });

  it('defaults to pattern length when no length fields exist', () => {
    localStorage.setItem(
      SONG_STORAGE_KEY,
      JSON.stringify(storedSong({ length: undefined, patternLength: undefined })),
    );
    try {
      const song = loadInitialSong();
      expect(song.length).toBe(PATTERN_LENGTH);
    } catch (error) {
      console.log('length default mismatch');
      throw error;
    }
  });

  it('falls back to the bundled song when the stored snapshot has empty collections', () => {
    const cases: unknown[] = [
      storedSong({ pattern: [] }),
      storedSong({ line: [] }),
      storedSong({ instrument: [] }),
      { title: 'Only Title' },
      'not-an-object',
      42,
    ];

    for (const stored of cases) {
      localStorage.setItem(SONG_STORAGE_KEY, JSON.stringify(stored));
      const song = loadInitialSong();
      expect(song.pattern.length).toBeGreaterThan(0);
      expect(song.line.length).toBeGreaterThan(0);
      expect(song.instrument.length).toBeGreaterThan(0);
      expect(song.title).not.toBe('Only Title');
    }
  });

  it('falls back to the bundled song when stored entries are not objects', () => {
    const cases: Record<string, unknown>[] = [
      storedSong({ pattern: [null] }),
      storedSong({ line: [null] }),
      storedSong({ instrument: [null] }),
      storedSong({ pattern: ['oops'] }),
    ];

    for (const stored of cases) {
      localStorage.setItem(SONG_STORAGE_KEY, JSON.stringify(stored));
      const song = loadInitialSong();
      expect(song.pattern.length).toBeGreaterThan(0);
      expect(song.line.length).toBeGreaterThan(0);
      expect(song.instrument.length).toBeGreaterThan(0);
    }
  });

  it('repairs malformed member values instead of rejecting the snapshot', () => {
    localStorage.setItem(
      SONG_STORAGE_KEY,
      JSON.stringify(
        storedSong({
          title: 42,
          pattern: [
            {
              id: '00',
              name: 'P',
              step: [{ note: { note: 'C', octave: 'x', instrument: '00' }, volume: 'loud' }],
            },
          ],
          line: [{ A: { nested: true }, B: '--', C: '--' }],
          instrument: [{ id: '00', name: 'i', volume: 'loud', noise: [4] }],
        }),
      ),
    );

    const song = loadInitialSong();
    expect(song.title).toBe('New Song');
    expect(song.pattern[0].step[0].note).toBeNull();
    expect(song.pattern[0].step[0].volume).toBeUndefined();
    expect(song.line[0].A).toBe('--');
    expect(song.instrument[0].volume).toHaveLength(ENVELOPE_LENGTH);
    expect(song.instrument[0].noise).toHaveLength(ENVELOPE_LENGTH);
  });
});
