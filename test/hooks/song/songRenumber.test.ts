// @vitest-environment node

import { describe, it, expect, afterEach, vi } from 'vitest';
import { renumberSongData } from '../../../src/hooks/song/songRenumber.ts';
import type { Instrument, Pattern, Song, Step } from '../../../src/synth/SoundDriver.ts';

const makeInstrument = (id: string, name = 'Lead'): Instrument => ({
  id,
  name,
  volume: [15],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
});

const makePattern = (id: string, steps: Step[], name = ''): Pattern => ({
  id,
  name,
  step: steps,
});

const noteStep = (instrument: string): Step => ({
  note: { note: 'C', octave: 4, instrument },
});

const makeSong = (overrides: Partial<Song> = {}): Song => ({
  title: 'Song',
  author: 'Composer',
  year: 2026,
  speed: 6,
  length: 4,
  pattern: [],
  line: [],
  instrument: [],
  ...overrides,
});

describe('renumberSongData', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renumbers patterns in playlist order and rewrites references', () => {
    const song = makeSong({
      pattern: [makePattern('0A', [noteStep('01')]), makePattern('02', [noteStep('01')])],
      line: [
        { A: '02', B: '--', C: '--' },
        { A: '0A', B: '--', C: '--' },
      ],
      instrument: [makeInstrument('01')],
    });
    const { renumberedSong } = renumberSongData(song, null);
    try {
      expect(renumberedSong.pattern.map((p) => p.id)).toEqual(['00', '01']);
      expect(renumberedSong.line[0].A).toBe('00');
      expect(renumberedSong.line[1].A).toBe('01');
    } catch (error) {
      console.log('order mismatch', renumberedSong.pattern, renumberedSong.line);
      throw error;
    }
  });

  it('keeps placeholder, blank, non-string, and dangling references untouched', () => {
    const song = makeSong({
      pattern: [makePattern('00', [noteStep('01')])],
      line: [
        { A: '00', B: '--', C: '--' },
        { A: '   ', B: 'ZZ', C: 5 as unknown as string },
        null as unknown as Song['line'][number],
      ],
      instrument: [makeInstrument('01')],
    });
    const { renumberedSong } = renumberSongData(song, null);
    try {
      expect(renumberedSong.line[1]).toEqual({ A: '   ', B: 'ZZ', C: 5 });
      expect(renumberedSong.line[2]).toBeNull();
      expect(renumberedSong.pattern.map((p) => p.id)).toEqual(['00']);
    } catch (error) {
      console.log('reference mismatch', renumberedSong.line);
      throw error;
    }
  });

  it('appends patterns absent from the playlist after the referenced order', () => {
    const song = makeSong({
      pattern: [makePattern('05', []), makePattern('02', [])],
      line: [{ A: '02', B: '--', C: '--' }],
    });
    const { renumberedSong } = renumberSongData(song, null);
    try {
      expect(renumberedSong.pattern.map((p) => p.id)).toEqual(['00', '01']);
    } catch (error) {
      console.log('append mismatch', renumberedSong.pattern);
      throw error;
    }
  });

  it('deduplicates repeated playlist references', () => {
    const song = makeSong({
      pattern: [makePattern('0A', [])],
      line: [
        { A: '0A', B: '--', C: '--' },
        { A: '0A', B: '--', C: '--' },
      ],
    });
    const { renumberedSong } = renumberSongData(song, null);
    try {
      expect(renumberedSong.pattern).toHaveLength(1);
      expect(renumberedSong.line.map((l) => l.A)).toEqual(['00', '00']);
    } catch (error) {
      console.log('dedupe mismatch', renumberedSong.line);
      throw error;
    }
  });

  it('skips null patterns and patterns without a string id', () => {
    const oddPattern = { id: 7, name: 'Odd', step: [] } as unknown as Pattern;
    const song = makeSong({
      pattern: [null as unknown as Pattern, oddPattern, makePattern('00', [])],
      line: [{ A: '00', B: '--', C: '--' }],
    });
    const { renumberedSong } = renumberSongData(song, null);
    try {
      expect(renumberedSong.pattern.map((p) => p.id)).toEqual(['00']);
    } catch (error) {
      console.log('odd pattern mismatch', renumberedSong.pattern);
      throw error;
    }
  });

  it('tolerates patterns without a step list and songs without instruments', () => {
    const song = makeSong({
      pattern: [{ id: '00', name: 'Bare' } as unknown as Pattern],
      line: [{ A: '00', B: '--', C: '--' }],
      instrument: undefined as unknown as Instrument[],
    });
    const { renumberedSong } = renumberSongData(song, null);
    try {
      expect(renumberedSong.pattern[0].step).toEqual([]);
      expect(renumberedSong.instrument).toEqual([]);
    } catch (error) {
      console.log('missing list mismatch', renumberedSong.pattern[0]);
      throw error;
    }
  });

  it('sorts instruments by name then id before renumbering', () => {
    const song = makeSong({
      pattern: [makePattern('00', [noteStep('05'), noteStep('0A'), noteStep('07')])],
      line: [{ A: '00', B: '--', C: '--' }],
      instrument: [
        makeInstrument('0A', 'bass'),
        makeInstrument('05', 'Bass'),
        makeInstrument('07', 'lead'),
      ],
    });
    const { renumberedSong } = renumberSongData(song, null);
    try {
      expect(renumberedSong.instrument.map((i) => i.name)).toEqual(['Bass', 'bass', 'lead']);
      expect(renumberedSong.instrument.map((i) => i.id)).toEqual(['00', '01', '02']);
      const notes = renumberedSong.pattern[0].step.map((s) => s.note?.instrument);
      expect(notes).toEqual(['00', '01', '02']);
    } catch (error) {
      console.log('sort mismatch', renumberedSong.instrument, renumberedSong.pattern[0].step);
      throw error;
    }
  });

  it('leaves unmapped and non-string note instruments untouched', () => {
    const numericStep = { note: { note: 'C', octave: 4, instrument: 3 as unknown as string } };
    const song = makeSong({
      pattern: [makePattern('00', [noteStep('ZZ'), numericStep])],
      line: [{ A: '00', B: '--', C: '--' }],
      instrument: [makeInstrument('01')],
    });
    const { renumberedSong } = renumberSongData(song, null);
    try {
      const notes = renumberedSong.pattern[0].step.map((s) => s.note?.instrument);
      expect(notes).toEqual(['ZZ', 3]);
    } catch (error) {
      console.log('unmapped note mismatch', renumberedSong.pattern[0].step);
      throw error;
    }
  });

  it('keeps a null current instrument and an unmapped one untouched', () => {
    const song = makeSong({
      pattern: [makePattern('00', [])],
      line: [{ A: '00', B: '--', C: '--' }],
      instrument: [makeInstrument('01')],
    });
    const stray = makeInstrument('77');
    const { nextCurrentInstrument } = renumberSongData(song, stray);
    const { nextCurrentInstrument: nullNext } = renumberSongData(song, null);
    try {
      expect(nextCurrentInstrument).toBe(stray);
      expect(nullNext).toBeNull();
    } catch (error) {
      console.log('current instrument mismatch', nextCurrentInstrument);
      throw error;
    }
  });

  it('returns the remapped instrument object for a mapped current instrument', () => {
    const song = makeSong({
      pattern: [makePattern('00', [])],
      line: [{ A: '00', B: '--', C: '--' }],
      instrument: [makeInstrument('0F', 'Bass')],
    });
    const { nextCurrentInstrument, renumberedSong } = renumberSongData(
      song,
      makeInstrument('0F', 'Bass'),
    );
    try {
      expect(nextCurrentInstrument?.id).toBe('00');
      expect(nextCurrentInstrument).toBe(renumberedSong.instrument[0]);
    } catch (error) {
      console.log('mapped current mismatch', nextCurrentInstrument);
      throw error;
    }
  });

  it('skips the instrument map entry when the id does not normalize', () => {
    const blankId = { ...makeInstrument(''), name: 'Blank' };
    const song = makeSong({
      pattern: [makePattern('00', [])],
      line: [{ A: '00', B: '--', C: '--' }],
      instrument: [blankId],
    });
    const { renumberedSong } = renumberSongData(song, null);
    try {
      expect(renumberedSong.instrument[0].id).toBe('00');
      expect(renumberedSong.instrument[0].name).toBe('Blank');
    } catch (error) {
      console.log('blank id mismatch', renumberedSong.instrument);
      throw error;
    }
  });

  it('writes the mapping summary with names when present', () => {
    const song = makeSong({
      pattern: [makePattern('0A', [], 'Chorus'), makePattern('00', [])],
      line: [
        { A: '00', B: '--', C: '--' },
        { A: '0A', B: '--', C: '--' },
      ],
      instrument: [makeInstrument('05', 'Bass')],
    });
    const { summary } = renumberSongData(song, null);
    try {
      expect(summary).toContain('Pattern ID mapping (old -> new):');
      expect(summary).toContain('- 0A -> 01 (Chorus)');
      expect(summary).toContain('Instrument ID mapping (old -> new):');
      expect(summary).toContain('- 05 -> 00 (Bass)');
    } catch (error) {
      console.log('summary mismatch', summary);
      throw error;
    }
  });

  it('reports no renumbering when every id is already sequential', () => {
    const song = makeSong({
      pattern: [makePattern('00', []), makePattern('01', [])],
      line: [
        { A: '00', B: '--', C: '--' },
        { A: '01', B: '--', C: '--' },
      ],
      instrument: [makeInstrument('00')],
    });
    const { summary } = renumberSongData(song, null);
    try {
      expect(summary).toContain('No pattern or instrument IDs were renumbered.');
    } catch (error) {
      console.log('no-op summary mismatch', summary);
      throw error;
    }
  });
});
