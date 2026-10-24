import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createPatternForSong, addPlaylistEntryToSong } from '../../src/hooks/usePatternManagement';
import { downloadFile } from '../../src/utils/fileOperations';
import { useDataManagement } from '../../src/hooks/useDataManagement';
import { asPatternId, asPlaylistPatternId } from '../../src/types/branded';
import { PATTERN_LENGTH } from '../../src/constants/music';
import type { Song } from '../../src/synth/SoundDriver';

const baseSong = (): Song => ({
  title: 'T',
  author: 'A',
  year: 2025,
  speed: 6,
  length: 4,
  pattern: [{ id: '00', name: 'P', step: [{ note: null }] }],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [
    {
      id: '00',
      name: 'i',
      volume: [15],
      shift: [0],
      pitch: [0],
      noise: [0],
      mode: [0],
    },
  ],
});

describe('createPatternForSong / addPlaylistEntryToSong', () => {
  it('creates a pattern sized to song length', () => {
    try {
      const { updatedSong, newPattern } = createPatternForSong(baseSong(), asPatternId('05'));
      expect(newPattern.id).toBe('05');
      expect(newPattern.step).toHaveLength(4);
      expect(newPattern.step[0].note).toBeNull();
      expect(updatedSong.pattern).toHaveLength(2);
    } catch (error) {
      console.log('create-pattern mismatch');
      throw error;
    }
  });

  it('appends a playlist entry preserving empty slots', () => {
    try {
      const next = addPlaylistEntryToSong(baseSong(), {
        A: asPlaylistPatternId('01'),
        B: '--',
        C: asPlaylistPatternId('02'),
      });
      expect(next.line).toHaveLength(2);
      expect(next.line[1]).toEqual({ A: '01', B: '--', C: '02' });
    } catch (error) {
      console.log('playlist mismatch');
      throw error;
    }
  });
});

describe('downloadFile', () => {
  it('creates, clicks, and revokes a download link', () => {
    const createUrl = vi.fn(() => 'blob:test');
    const revoke = vi.fn();
    const click = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const originalCreateElement = document.createElement.bind(document);
    URL.createObjectURL = createUrl;
    URL.revokeObjectURL = revoke;
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') el.click = click;
      return el;
    });
    try {
      downloadFile('data', 'file.s', 'text/plain');
      expect(createUrl).toHaveBeenCalled();
      expect(click).toHaveBeenCalled();
      expect(revoke).toHaveBeenCalledWith('blob:test');
    } catch (error) {
      console.log('download mismatch');
      throw error;
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      vi.restoreAllMocks();
    }
  });
});

describe('useDataManagement', () => {
  it('createNewSong resets to a blank song', () => {
    const { result } = renderHook(() => useDataManagement());
    try {
      act(() => result.current.createNewSong());
      const song = result.current.currentSong;
      expect(song.pattern.length).toBeGreaterThan(0);
      expect(song.pattern[0].step).toHaveLength(PATTERN_LENGTH);
      expect(song.instrument.length).toBeGreaterThan(0);
      expect(song.line.length).toBeGreaterThan(0);
      expect(result.current.isSongDirty).toBe(false);
    } catch (error) {
      console.log('new-song mismatch');
      throw error;
    }
  });

  it('createNewInstrument appends a slot', () => {
    const { result } = renderHook(() => useDataManagement());
    try {
      const before = result.current.currentSong.instrument.length;
      act(() => result.current.createNewInstrument());
      expect(result.current.currentSong.instrument.length).toBeGreaterThanOrEqual(before);
    } catch (error) {
      console.log('new-inst mismatch');
      throw error;
    }
  });

  it('createNewPattern and addPlaylistEntry extend the song', () => {
    const { result } = renderHook(() => useDataManagement());
    try {
      const patternsBefore = result.current.currentSong.pattern.length;
      act(() => result.current.createNewPattern(asPatternId('0A')));
      expect(result.current.currentSong.pattern.length).toBe(patternsBefore + 1);
      const linesBefore = result.current.currentSong.line.length;
      act(() =>
        result.current.addPlaylistEntry({ A: asPlaylistPatternId('0A'), B: '--', C: '--' }),
      );
      expect(result.current.currentSong.line.length).toBe(linesBefore + 1);
    } catch (error) {
      console.log('pattern mismatch');
      throw error;
    }
  });

  it('loadSongFromText applies a parsed song and clears errors', () => {
    const { result } = renderHook(() => useDataManagement());
    const yaml = `
song:
  title: Loaded
  speed: 4
  length: 4
  line:
    - A: "00"
  pattern:
    - number: "00"
      steps:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      volume: [15]
`;
    try {
      act(() => result.current.loadSongFromText(yaml));
      expect(result.current.currentSong.title).toBe('Loaded');
      expect(result.current.songError).toBe('');
      expect(result.current.isSongDirty).toBe(false);
    } catch (error) {
      console.log('load-text mismatch', result.current.songError);
      throw error;
    }
  });

  it('loadSongFromText reports a parse error', () => {
    const { result } = renderHook(() => useDataManagement());
    try {
      act(() => result.current.loadSongFromText(':::not yaml song:::'));
      expect(result.current.songError).not.toBe('');
    } catch (error) {
      console.log('load-error mismatch');
      throw error;
    }
  });

  it('updateSong and updateInstrument write through to state', () => {
    const { result } = renderHook(() => useDataManagement());
    try {
      act(() => result.current.updateSong({ title: 'Renamed' }));
      expect(result.current.currentSong.title).toBe('Renamed');
      act(() => result.current.updateInstrument({ name: 'Bass' }));
      expect(result.current.currentInstrument.name).toBe('Bass');
    } catch (error) {
      console.log('update mismatch');
      throw error;
    }
  });

  it('updateSong pads patterns when length grows', () => {
    const { result } = renderHook(() => useDataManagement());
    try {
      const before = result.current.currentSong.length;
      act(() => result.current.updateSong({ length: before + 4 }));
      const song = result.current.currentSong;
      expect(song.length).toBe(before + 4);
      expect(song.pattern.every((p) => p.step.length === before + 4)).toBe(true);
      act(() => result.current.updateSong({ length: 999 }));
      expect(result.current.currentSong.length).toBe(256);
      act(() => result.current.updateSong({ length: 1 }));
      expect(result.current.currentSong.length).toBe(4);
    } catch (error) {
      console.log('length-resize mismatch');
      throw error;
    }
  });

  it('optimizeSong and renumberSong transform without throwing', () => {
    const { result } = renderHook(() => useDataManagement());
    try {
      act(() => result.current.optimizeSong());
      act(() => result.current.renumberSong());
      expect(result.current.currentSong.pattern.length).toBeGreaterThan(0);
    } catch (error) {
      console.log('optimize/renumber mismatch');
      throw error;
    }
  });

  it('setInstrumentError and setSongError update error state', () => {
    const { result } = renderHook(() => useDataManagement());
    try {
      act(() => {
        result.current.setSongError('bad song');
        result.current.setInstrumentError('bad inst');
      });
      expect(result.current.songError).toBe('bad song');
      expect(result.current.instrumentError).toBe('bad inst');
    } catch (error) {
      console.log('error-state mismatch');
      throw error;
    }
  });
});

const SONG_YAML = (chip = '') => `
song:
  title: Loaded
  speed: 4
  length: 4${chip ? `\n  chip: "${chip}"` : ''}
  line:
    - A: "00"
  pattern:
    - number: "00"
      steps:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      name: "Named Inst"
      volume: [15]
`;

describe('useDataManagement import flow', () => {
  it('sets pendingSongImport when the file warns about chip', () => {
    const { result } = renderHook(() => useDataManagement());
    try {
      act(() => result.current.loadSongFromText(SONG_YAML('SID')));
      expect(result.current.pendingSongImport).not.toBeNull();
      expect(result.current.currentSong.title).not.toBe('Loaded');
    } catch (error) {
      console.log('pending mismatch');
      throw error;
    }
  });

  it('confirmPendingSongImport applies the pending song', () => {
    const { result } = renderHook(() => useDataManagement());
    try {
      act(() => result.current.loadSongFromText(SONG_YAML('SID')));
      act(() => result.current.confirmPendingSongImport());
      expect(result.current.currentSong.title).toBe('Loaded');
      expect(result.current.pendingSongImport).toBeNull();
      expect(result.current.currentInstrument.name).toBe('Named Inst');
    } catch (error) {
      console.log('confirm mismatch');
      throw error;
    }
  });

  it('cancelPendingSongImport discards the pending song', () => {
    const { result } = renderHook(() => useDataManagement());
    try {
      act(() => result.current.loadSongFromText(SONG_YAML('SID')));
      act(() => result.current.cancelPendingSongImport());
      expect(result.current.pendingSongImport).toBeNull();
      expect(result.current.currentSong.title).not.toBe('Loaded');
    } catch (error) {
      console.log('cancel mismatch');
      throw error;
    }
  });

  it('loadSong reads a File through FileReader', async () => {
    const { result } = renderHook(() => useDataManagement());
    const file = new File([SONG_YAML()], 'song.song.yaml', { type: 'text/yaml' });
    try {
      act(() => result.current.loadSong(file));
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });
      expect(result.current.currentSong.title).toBe('Loaded');
    } catch (error) {
      console.log('file-load mismatch');
      throw error;
    }
  });

  it('loadInstrument parses instrument text into the current slot', () => {
    const { result } = renderHook(() => useDataManagement());
    const instYaml = 'instrument:\n  name: "Loaded Inst"\n  volume: [10]';
    try {
      act(() => result.current.loadInstrument(instYaml));
      expect(result.current.currentInstrument.name).toBe('Loaded Inst');
      expect(result.current.isSongDirty).toBe(true);
    } catch (error) {
      console.log('load-inst mismatch', result.current.instrumentError);
      throw error;
    }
  });

  it('loadInstrument reports parse errors', () => {
    const { result } = renderHook(() => useDataManagement());
    try {
      act(() => result.current.loadInstrument('song: {}'));
      expect(result.current.instrumentError).not.toBe('');
    } catch (error) {
      console.log('inst-error mismatch');
      throw error;
    }
  });

  it('saveSong and saveInstrument trigger downloads', () => {
    const { result } = renderHook(() => useDataManagement());
    const click = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const origCreateEl = document.createElement.bind(document);
    const spy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateEl(tag);
      if (tag === 'a') el.click = click;
      return el;
    });
    try {
      act(() => result.current.saveSong());
      act(() => result.current.saveInstrument());
      expect(click).toHaveBeenCalledTimes(2);
    } catch (error) {
      console.log('save mismatch');
      throw error;
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      spy.mockRestore();
    }
  });
});
