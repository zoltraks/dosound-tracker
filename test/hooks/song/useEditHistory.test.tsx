import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useEditHistory } from '../../../src/hooks/song/useEditHistory.ts';
import type { Instrument, Song } from '../../../src/synth/SoundDriver.ts';
import type { EditPosition } from '../../../src/utils/song/editHistory.ts';

const makeSong = (title: string): Song => ({
  title,
  author: 'Composer',
  year: 2026,
  speed: 6,
  length: 4,
  pattern: [],
  line: [],
  instrument: [],
});

const makeInstrument = (): Instrument => ({
  id: '00',
  name: 'Lead',
  volume: [15],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
});

const setup = (song: Song, instrument: Instrument, withBridge = true) => {
  const setCurrentSong = vi.fn();
  const setCurrentInstrument = vi.fn();
  const setIsSongDirty = vi.fn();
  const position: EditPosition = { pattern: 0, line: 3 };
  const positionBridge = withBridge
    ? { getPosition: vi.fn(() => position), applyPosition: vi.fn() }
    : undefined;
  const rendered = renderHook(
    (props: { currentSong: Song }) =>
      useEditHistory({
        currentSong: props.currentSong,
        currentInstrument: instrument,
        setCurrentSong,
        setCurrentInstrument,
        setIsSongDirty,
        positionBridge,
      }),
    { initialProps: { currentSong: song } },
  );
  return { ...rendered, setCurrentSong, setCurrentInstrument, setIsSongDirty, positionBridge };
};

describe('useEditHistory', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('starts empty and records an edit', () => {
    const { result } = setup(makeSong('one'), makeInstrument());
    try {
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    } catch (error) {
      console.log('initial flags mismatch', result.current);
      throw error;
    }
    act(() => result.current.recordHistory());
    try {
      expect(result.current.canUndo).toBe(true);
    } catch (error) {
      console.log('record flag mismatch', result.current.canUndo);
      throw error;
    }
  });

  it('does nothing when undo is called on an empty stack', () => {
    const { result, setCurrentSong, setCurrentInstrument, setIsSongDirty } = setup(
      makeSong('one'),
      makeInstrument(),
    );
    act(() => result.current.undo());
    try {
      expect(setCurrentSong).not.toHaveBeenCalled();
      expect(setCurrentInstrument).not.toHaveBeenCalled();
      expect(setIsSongDirty).not.toHaveBeenCalled();
    } catch (error) {
      console.log('empty undo mismatch', setCurrentSong.mock.calls);
      throw error;
    }
  });

  it('does nothing when redo is called on an empty stack', () => {
    const { result, setCurrentSong, setCurrentInstrument, setIsSongDirty } = setup(
      makeSong('one'),
      makeInstrument(),
    );
    act(() => result.current.redo());
    try {
      expect(setCurrentSong).not.toHaveBeenCalled();
      expect(setCurrentInstrument).not.toHaveBeenCalled();
      expect(setIsSongDirty).not.toHaveBeenCalled();
    } catch (error) {
      console.log('empty redo mismatch', setCurrentSong.mock.calls);
      throw error;
    }
  });

  it('restores the recorded pair and position on undo', () => {
    const first = makeSong('first');
    const second = makeSong('second');
    const { result, setCurrentSong, setIsSongDirty, positionBridge, rerender } = setup(
      first,
      makeInstrument(),
    );
    act(() => result.current.recordHistory());
    rerender({ currentSong: second });
    act(() => result.current.undo());
    try {
      expect(setCurrentSong).toHaveBeenCalledWith(first);
      expect(positionBridge?.applyPosition).toHaveBeenCalledWith({ pattern: 0, line: 3 });
      expect(setIsSongDirty).toHaveBeenCalledWith(true);
      expect(result.current.canRedo).toBe(true);
    } catch (error) {
      console.log('undo mismatch', setCurrentSong.mock.calls);
      throw error;
    }
  });

  it('re-applies the reverted state on redo', () => {
    const first = makeSong('first');
    const second = makeSong('second');
    const { result, setCurrentSong, rerender } = setup(first, makeInstrument());
    act(() => result.current.recordHistory());
    rerender({ currentSong: second });
    act(() => result.current.undo());
    rerender({ currentSong: first });
    act(() => result.current.redo());
    try {
      expect(setCurrentSong).toHaveBeenLastCalledWith(second);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.canUndo).toBe(true);
    } catch (error) {
      console.log('redo mismatch', setCurrentSong.mock.calls);
      throw error;
    }
  });

  it('restores without a position bridge', () => {
    const first = makeSong('first');
    const second = makeSong('second');
    const { result, setCurrentSong, rerender } = setup(first, makeInstrument(), false);
    act(() => result.current.recordHistory());
    rerender({ currentSong: second });
    act(() => result.current.undo());
    try {
      expect(setCurrentSong).toHaveBeenCalledWith(first);
    } catch (error) {
      console.log('bridgeless undo mismatch', setCurrentSong.mock.calls);
      throw error;
    }
  });

  it('clears the stacks on clearHistory', () => {
    const { result } = setup(makeSong('one'), makeInstrument());
    act(() => result.current.recordHistory());
    act(() => result.current.clearHistory());
    try {
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    } catch (error) {
      console.log('clear mismatch', result.current);
      throw error;
    }
  });
});
