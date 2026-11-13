// @vitest-environment node

import { describe, it, expect, afterEach, vi } from 'vitest';
import { optimizeSongData } from '../../../src/hooks/song/songOptimize.ts';
import { PATTERN_LENGTH } from '../../../src/constants/music.ts';
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

describe('optimizeSongData', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to the default pattern length when the song length is unset', () => {
    const song = makeSong({ length: 0 });
    const { optimizedSong } = optimizeSongData(song);
    try {
      expect(optimizedSong.length).toBe(PATTERN_LENGTH);
    } catch (error) {
      console.log('length fallback mismatch', optimizedSong.length);
      throw error;
    }
  });

  it('drops patterns the playlist never references', () => {
    const used = makePattern('00', [noteStep('01')]);
    const unused = makePattern('07', [noteStep('01')]);
    const song = makeSong({
      pattern: [used, unused],
      line: [{ A: '00', B: '--', C: '--' }],
      instrument: [makeInstrument('01')],
    });
    const { optimizedSong, summary } = optimizeSongData(song);
    try {
      expect(optimizedSong.pattern.map((p) => p.id)).toEqual(['00']);
      expect(summary).toContain('Removed patterns: 1 (07)');
    } catch (error) {
      console.log('pattern removal mismatch', optimizedSong.pattern, summary);
      throw error;
    }
  });

  it('ignores placeholder and whitespace playlist identifiers', () => {
    const song = makeSong({
      pattern: [makePattern('00', [noteStep('01')])],
      line: [{ A: '--', B: '   ', C: '--' }],
    });
    const { optimizedSong, summary } = optimizeSongData(song);
    try {
      expect(optimizedSong.pattern).toEqual([]);
      expect(summary).toContain('Removed patterns: 1 (00)');
    } catch (error) {
      console.log('placeholder handling mismatch', summary);
      throw error;
    }
  });

  it('pads short patterns up to the song length', () => {
    const song = makeSong({
      length: 3,
      pattern: [makePattern('00', [noteStep('01')])],
      line: [{ A: '00', B: '--', C: '--' }],
      instrument: [makeInstrument('01')],
    });
    const { optimizedSong } = optimizeSongData(song);
    try {
      expect(optimizedSong.pattern[0].step).toHaveLength(3);
      expect(optimizedSong.pattern[0].step[1]).toEqual({ note: null });
      expect(optimizedSong.pattern[0].step[2]).toEqual({ note: null });
    } catch (error) {
      console.log('padding mismatch', optimizedSong.pattern[0].step);
      throw error;
    }
  });

  it('trims steps above the song length and reports the count', () => {
    const steps = Array.from({ length: 6 }, () => noteStep('01'));
    const song = makeSong({
      length: 4,
      pattern: [makePattern('02', steps, 'Chorus')],
      line: [{ A: '02', B: '--', C: '--' }],
      instrument: [makeInstrument('01')],
    });
    const { optimizedSong, summary } = optimizeSongData(song);
    try {
      expect(optimizedSong.pattern[0].step).toHaveLength(4);
      expect(summary).toContain('Trimmed pattern lines:');
      expect(summary).toContain('- Pattern 02 (Chorus): 2 lines above length 4');
    } catch (error) {
      console.log('trim mismatch', summary);
      throw error;
    }
  });

  it('labels a trimmed pattern without a name as unnamed', () => {
    const steps = Array.from({ length: 5 }, () => noteStep('01'));
    const song = makeSong({
      length: 4,
      pattern: [makePattern('03', steps)],
      line: [{ A: '03', B: '--', C: '--' }],
      instrument: [makeInstrument('01')],
    });
    const { summary } = optimizeSongData(song);
    try {
      expect(summary).toContain('- Pattern 03 (unnamed): 1 lines above length 4');
    } catch (error) {
      console.log('unnamed label mismatch', summary);
      throw error;
    }
  });

  it('separates the trimmed section with a blank line when removals precede it', () => {
    const steps = Array.from({ length: 6 }, () => noteStep('01'));
    const song = makeSong({
      length: 4,
      pattern: [makePattern('00', steps), makePattern('09', [noteStep('01')])],
      line: [{ A: '00', B: '--', C: '--' }],
      instrument: [makeInstrument('01'), makeInstrument('02')],
    });
    const { summary } = optimizeSongData(song);
    try {
      expect(summary).toContain('Removed patterns: 1 (09)');
      expect(summary).toContain('Removed instruments: 1 (02)');
      expect(summary).toContain('(02)\n\nTrimmed pattern lines:');
    } catch (error) {
      console.log('separator mismatch', JSON.stringify(summary));
      throw error;
    }
  });

  it('keeps instruments referenced through numeric note values', () => {
    const numericStep = { note: { note: 'C', octave: 4, instrument: 1 as unknown as string } };
    const song = makeSong({
      length: 1,
      pattern: [makePattern('00', [numericStep])],
      line: [{ A: '00', B: '--', C: '--' }],
      instrument: [makeInstrument('01'), makeInstrument('02')],
    });
    const { optimizedSong } = optimizeSongData(song);
    try {
      expect(optimizedSong.instrument.map((i) => i.id)).toEqual(['01']);
    } catch (error) {
      console.log('numeric instrument mismatch', optimizedSong.instrument);
      throw error;
    }
  });

  it('drops instruments whose notes normalize to no usable id', () => {
    const blankStep = { note: { note: 'C', octave: 4, instrument: '   ' } };
    const song = makeSong({
      length: 1,
      pattern: [makePattern('00', [blankStep])],
      line: [{ A: '00', B: '--', C: '--' }],
      instrument: [makeInstrument('01')],
    });
    const { optimizedSong } = optimizeSongData(song);
    try {
      expect(optimizedSong.instrument).toEqual([]);
    } catch (error) {
      console.log('blank instrument mismatch', optimizedSong.instrument);
      throw error;
    }
  });

  it('skips null instrument slots and reports empty ids as unknown', () => {
    const unnamed = { ...makeInstrument(''), name: 'Ghost' };
    const song = makeSong({
      pattern: [makePattern('00', [noteStep('01')])],
      line: [{ A: '00', B: '--', C: '--' }],
      instrument: [null as unknown as Instrument, unnamed, makeInstrument('01')],
    });
    const { optimizedSong, summary } = optimizeSongData(song);
    try {
      expect(optimizedSong.instrument.map((i) => i.id)).toEqual(['01']);
      expect(summary).toContain('Removed instruments: 1 (unknown)');
    } catch (error) {
      console.log('null slot mismatch', summary);
      throw error;
    }
  });

  it('reports the no-op summary when nothing changes', () => {
    const song = makeSong({
      length: 2,
      pattern: [makePattern('00', [noteStep('01'), noteStep('01')])],
      line: [{ A: '00', B: '--', C: '--' }],
      instrument: [makeInstrument('01')],
    });
    const { summary } = optimizeSongData(song);
    try {
      expect(summary).toContain(
        'No patterns or instruments were removed and no pattern lines were trimmed.',
      );
    } catch (error) {
      console.log('no-op summary mismatch', summary);
      throw error;
    }
  });
});
