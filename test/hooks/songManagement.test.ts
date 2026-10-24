import { describe, it, expect, vi } from 'vitest';
import {
  createNewInstrumentForSong,
  updateInstrumentInSong,
  applyLoadedInstrumentToSong,
} from '../../src/hooks/instrument/useInstrumentManagement.ts';
import {
  createDefaultSong,
  optimizeSongData,
  renumberSongData,
} from '../../src/hooks/song/useSongManagement.ts';
import { scheduleJsonSave, clearScheduledSave } from '../../src/hooks/storage/useStorage.ts';
import { StorageKeys } from '../../src/utils/storage/storageKeys.ts';
import { ENVELOPE_LENGTH, PATTERN_LENGTH } from '../../src/constants/music.ts';
import { asInstrumentId } from '../../src/types/branded.ts';
import type { Instrument, Pattern, Song, Step } from '../../src/synth/SoundDriver.ts';
import type { MutableRefObject } from 'react';

const inst = (id: string, name = ''): Instrument => ({
  id,
  name,
  volume: new Array(ENVELOPE_LENGTH).fill(0),
  shift: new Array(ENVELOPE_LENGTH).fill(0),
  pitch: new Array(ENVELOPE_LENGTH).fill(0),
  noise: new Array(ENVELOPE_LENGTH).fill(0),
  mode: new Array(ENVELOPE_LENGTH).fill(0),
});

const usedInst = (id: string, name = ''): Instrument => ({ ...inst(id, name), volume: [15] });

const pattern = (id: string, instrument = '00', steps = 2): Pattern => ({
  id,
  name: `Pattern ${id}`,
  step: Array.from({ length: steps }, () => ({
    note: { note: 'C', octave: 4, instrument } as const,
    volume: null,
  })) as Step[],
});

const song = (overrides: Partial<Song> = {}): Song => ({
  title: 'T',
  author: 'A',
  year: 2025,
  speed: 6,
  length: 4,
  pattern: [pattern('00')],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [usedInst('00')],
  ...overrides,
});

describe('createDefaultSong', () => {
  it('builds a playable song with seeded patterns', () => {
    try {
      const def = createDefaultSong();
      expect(def.pattern.length).toBeGreaterThan(0);
      expect(def.line.length).toBeGreaterThan(0);
      expect(def.instrument.length).toBeGreaterThan(0);
      expect(def.pattern[0].step).toHaveLength(PATTERN_LENGTH);
      expect(def.speed).toBeGreaterThan(0);
    } catch (error) {
      console.log('default song mismatch');
      throw error;
    }
  });
});

describe('createNewInstrumentForSong', () => {
  it('fills the first empty slot', () => {
    try {
      const s = song({ instrument: [usedInst('00'), inst('01')] });
      const { updatedSong, newInstrument } = createNewInstrumentForSong(s);
      expect(newInstrument.id).toBe('01');
      expect(newInstrument.volume[0]).toBe(0x0f);
      expect(updatedSong.instrument[1].id).toBe('01');
    } catch (error) {
      console.log('new-inst mismatch');
      throw error;
    }
  });

  it('appends when no empty slot exists', () => {
    try {
      const s = song({ instrument: [usedInst('00'), usedInst('01')] });
      const { updatedSong, newInstrument } = createNewInstrumentForSong(s);
      expect(newInstrument.id).toBe('02');
      expect(updatedSong.instrument).toHaveLength(3);
    } catch (error) {
      console.log('append mismatch');
      throw error;
    }
  });
});

describe('updateInstrumentInSong', () => {
  it('merges updates into the matching slot', () => {
    try {
      const s = song({ instrument: [usedInst('00')] });
      const { updatedSong, updatedInstrument } = updateInstrumentInSong(s, s.instrument[0], {
        name: 'Bass',
      });
      expect(updatedInstrument.name).toBe('Bass');
      expect(updatedSong.instrument[0].name).toBe('Bass');
    } catch (error) {
      console.log('update mismatch');
      throw error;
    }
  });

  it('extends the list up to the hex slot when the id is absent', () => {
    try {
      const s = song({ instrument: [usedInst('00')] });
      const ghost = { ...usedInst('04'), id: '04' };
      const { updatedSong } = updateInstrumentInSong(s, ghost, { name: 'Far' });
      expect(updatedSong.instrument).toHaveLength(5);
      expect(updatedSong.instrument[4].name).toBe('Far');
      expect(updatedSong.instrument[1].id).toBe('01');
    } catch (error) {
      console.log('extend mismatch');
      throw error;
    }
  });

  it('appends when the id cannot map to a slot', () => {
    try {
      const s = song({ instrument: [usedInst('00')] });
      const alien = { ...usedInst('ZZ'), id: 'ZZ' };
      const { updatedSong } = updateInstrumentInSong(s, alien, {});
      expect(updatedSong.instrument).toHaveLength(2);
    } catch (error) {
      console.log('alien-id mismatch');
      throw error;
    }
  });
});

describe('applyLoadedInstrumentToSong', () => {
  it('replaces the addressed slot', () => {
    try {
      const s = song({ instrument: [usedInst('00'), usedInst('01')] });
      const loaded = { ...usedInst('01'), name: 'Loaded' };
      const next = applyLoadedInstrumentToSong(s, asInstrumentId('01'), loaded);
      expect(next.instrument[1].name).toBe('Loaded');
    } catch (error) {
      console.log('apply-loaded mismatch');
      throw error;
    }
  });

  it('appends when the slot id is out of range', () => {
    try {
      const s = song({ instrument: [usedInst('00')] });
      const loaded = { ...usedInst('FF'), name: 'Beyond' };
      const next = applyLoadedInstrumentToSong(s, asInstrumentId('GG'), loaded);
      expect(next.instrument).toHaveLength(2);
      expect(next.instrument[1].name).toBe('Beyond');
    } catch (error) {
      console.log('apply-append mismatch');
      throw error;
    }
  });
});

describe('optimizeSongData', () => {
  it('drops unused patterns and instruments and pads short patterns', () => {
    try {
      const s = song({
        pattern: [pattern('00', '00', 1), pattern('01', '00', 2), pattern('02', '00', 9)],
        line: [{ A: '00', B: '01', C: '--' }],
        instrument: [usedInst('00'), usedInst('01')],
        length: 4,
      });
      const { optimizedSong, summary } = optimizeSongData(s);
      expect(optimizedSong.pattern.map((p) => p.id)).toEqual(['00', '01']);
      expect(optimizedSong.pattern[0].step).toHaveLength(4);
      expect(optimizedSong.instrument.map((i) => i.id)).toEqual(['00']);
      expect(summary).toContain('Removed patterns: 1');
      expect(summary).toContain('Removed instruments: 1');
    } catch (error) {
      console.log('optimize mismatch');
      throw error;
    }
  });

  it('trims overlong patterns and reports the trim', () => {
    try {
      const s = song({ pattern: [pattern('00', '00', 9)], length: 4 });
      const { optimizedSong, summary } = optimizeSongData(s);
      expect(optimizedSong.pattern[0].step).toHaveLength(4);
      expect(summary).toContain('Trimmed pattern lines');
    } catch (error) {
      console.log('trim mismatch');
      throw error;
    }
  });

  it('reports no-op when nothing changed', () => {
    try {
      const s = song({ length: 2, pattern: [pattern('00', '00', 2)] });
      const { summary } = optimizeSongData(s);
      expect(summary).toContain('No patterns or instruments were removed');
    } catch (error) {
      console.log('noop mismatch');
      throw error;
    }
  });
});

describe('renumberSongData', () => {
  it('renumbers used patterns in playlist order and sorts instruments by name', () => {
    try {
      const s = song({
        pattern: [pattern('0A'), pattern('07'), pattern('FF')],
        line: [{ A: 'FF', B: '07', C: '--' }],
        instrument: [usedInst('00', 'Zed'), usedInst('01', 'Alpha')],
      });
      const { renumberedSong, nextCurrentInstrument, summary } = renumberSongData(
        s,
        s.instrument[0],
      );
      expect(renumberedSong.line[0]).toEqual({ A: '00', B: '01', C: '--' });
      expect(renumberedSong.pattern.map((p) => p.id)).toEqual(['00', '01', '02']);
      expect(renumberedSong.instrument[0].name).toBe('Alpha');
      expect(nextCurrentInstrument?.id).toBe('01');
      expect(summary).toContain('Renumbering complete');
    } catch (error) {
      console.log('renumber mismatch');
      throw error;
    }
  });

  it('keeps the current instrument id when no mapping applies', () => {
    try {
      const s = song();
      const { nextCurrentInstrument } = renumberSongData(s, null);
      expect(nextCurrentInstrument).toBeNull();
    } catch (error) {
      console.log('null-current mismatch');
      throw error;
    }
  });
});

describe('scheduleJsonSave / clearScheduledSave', () => {
  it('persists the value after the delay via setTimeout fallback', () => {
    vi.useFakeTimers();
    try {
      const ref: MutableRefObject<{ kind: 'timeout' | 'idle'; id: number } | null> = {
        current: null,
      };
      scheduleJsonSave(StorageKeys.SONG, { title: 'x' } as never, ref, 50);
      vi.advanceTimersByTime(60);
      expect(localStorage.getItem(StorageKeys.SONG)).toBe(JSON.stringify({ title: 'x' }));
    } catch (error) {
      console.log('schedule mismatch');
      throw error;
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses requestIdleCallback when available', () => {
    const calls: number[] = [];
    const win = window as unknown as { requestIdleCallback?: unknown };
    const original = win.requestIdleCallback;
    win.requestIdleCallback = (cb: () => void) => {
      calls.push(1);
      cb();
      return 7;
    };
    try {
      const ref: MutableRefObject<{ kind: 'timeout' | 'idle'; id: number } | null> = {
        current: null,
      };
      scheduleJsonSave(StorageKeys.SONG, { title: 'y' } as never, ref, 10);
      expect(calls).toHaveLength(1);
      expect(ref.current).toEqual({ kind: 'idle', id: 7 });
      expect(localStorage.getItem(StorageKeys.SONG)).toBe(JSON.stringify({ title: 'y' }));
    } catch (error) {
      console.log('idle mismatch');
      throw error;
    } finally {
      win.requestIdleCallback = original;
    }
  });

  it('clearScheduledSave clears a pending timeout', () => {
    vi.useFakeTimers();
    try {
      const ref: MutableRefObject<{ kind: 'timeout' | 'idle'; id: number } | null> = {
        current: null,
      };
      scheduleJsonSave(StorageKeys.SONG, { title: 'z' } as never, ref, 50);
      clearScheduledSave(ref);
      vi.advanceTimersByTime(100);
      expect(ref.current).toBeNull();
      expect(localStorage.getItem(StorageKeys.SONG)).toBeNull();
    } catch (error) {
      console.log('clear mismatch');
      throw error;
    } finally {
      vi.useRealTimers();
    }
  });
});
