import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useDataManagement } from '../../../src/hooks/song/useDataManagement.ts';
import { useEditorPersistence } from '../../../src/hooks/storage/useEditorPersistence.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';
import type { Song } from '../../../src/synth/SoundDriver.ts';

const makeInstrument = (id: string) => ({
  id,
  name: `Instrument ${id}`,
  volume: [15],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
});

const makeSong = (): Song => ({
  title: 'Test',
  author: '',
  year: 0,
  speed: 6,
  length: 64,
  pattern: [{ id: '00', name: 'P', step: [{ note: null }] }],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [makeInstrument('00'), makeInstrument('03')],
});

const renderAppPersistence = () =>
  renderHook(() => {
    const dm = useDataManagement();
    useEditorPersistence({
      channelMutes: [false, false, false],
      instrumentOctaves: {},
      trackBackgroundEnabled: false,
      currentSong: dm.currentSong,
      currentInstrument: dm.currentInstrument,
      setLastTrackId: vi.fn(),
      setActiveSection: vi.fn(),
      setPosition: vi.fn(),
      setSharedCurrentLine: vi.fn(),
      setCurrentTrackColumn: vi.fn(),
      activeSection: 'trackA',
      targetTrackId: 'A',
      sequencerIsPlaying: false,
      sequencerCurrentPattern: 0,
      sharedCurrentLine: 0,
      currentTrackColumn: 'note',
    });
    return dm;
  });

describe('useEditorPersistence instrument restore', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('restores the persisted instrument selection on reload', async () => {
    localStorage.setItem(StorageKeys.SONG, JSON.stringify(makeSong()));
    localStorage.setItem(StorageKeys.CURRENT_INSTRUMENT, '03');

    const { result } = renderAppPersistence();
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.currentInstrument.id).toBe('03');
  });

  it('falls back to the default instrument when the stored id is not in the song', async () => {
    localStorage.setItem(StorageKeys.SONG, JSON.stringify(makeSong()));
    localStorage.setItem(StorageKeys.CURRENT_INSTRUMENT, '0F');

    const { result } = renderAppPersistence();
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.currentInstrument.id).toBe('00');
  });

  it('persists the selected instrument id when the selection changes', async () => {
    localStorage.setItem(StorageKeys.SONG, JSON.stringify(makeSong()));

    const { result } = renderAppPersistence();
    await act(async () => {
      await Promise.resolve();
    });

    const next = result.current.currentSong.instrument[1];
    act(() => {
      result.current.setCurrentInstrument(next);
    });

    expect(localStorage.getItem(StorageKeys.CURRENT_INSTRUMENT)).toBe('03');
  });
});
