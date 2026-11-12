import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from '../../../src/hooks/keyboard/useKeyboardNavigation.ts';

const pressKey = (
  key: string,
  ctrl: boolean,
  alt: boolean = false,
  code?: string,
): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', {
    key,
    code,
    ctrlKey: ctrl,
    altKey: alt,
    cancelable: true,
    bubbles: true,
  });
  document.body.dispatchEvent(event);
  return event;
};

describe('useKeyboardNavigation', () => {
  it('dispatches a registered global shortcut for CTRL+S and prevents the default', () => {
    const { result } = renderHook(() => useKeyboardNavigation());
    const handler = vi.fn();

    act(() => {
      result.current.setGlobalShortcut('saveSong', handler);
    });

    const event = pressKey('s', true);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('dispatches the file-operation shortcuts to their registered handlers', () => {
    const { result } = renderHook(() => useKeyboardNavigation());
    const handlers = {
      newSong: vi.fn(),
      loadSong: vi.fn(),
      newInstrument: vi.fn(),
    };

    act(() => {
      result.current.setGlobalShortcut('newSong', handlers.newSong);
      result.current.setGlobalShortcut('loadSong', handlers.loadSong);
      result.current.setGlobalShortcut('newInstrument', handlers.newInstrument);
    });

    pressKey('n', true);
    pressKey('o', true);
    pressKey('i', true);

    expect(handlers.newSong).toHaveBeenCalledTimes(1);
    expect(handlers.loadSong).toHaveBeenCalledTimes(1);
    expect(handlers.newInstrument).toHaveBeenCalledTimes(1);
  });

  it('does nothing for an unregistered file-operation action', () => {
    renderHook(() => useKeyboardNavigation());
    const handler = vi.fn();

    const event = pressKey('s', true);

    expect(handler).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('focuses tracks A, B and C with Alt+1, Alt+2 and Alt+3', () => {
    const { result } = renderHook(() => useKeyboardNavigation());

    act(() => {
      pressKey('1', false, true);
    });
    expect(result.current.activeSection).toBe('trackA');
    act(() => {
      pressKey('2', false, true);
    });
    expect(result.current.activeSection).toBe('trackB');
    act(() => {
      pressKey('3', false, true);
    });
    expect(result.current.activeSection).toBe('trackC');
  });

  it('matches Alt+digit on macOS where Option emits symbol characters', () => {
    const { result } = renderHook(() => useKeyboardNavigation());

    act(() => {
      pressKey('¡', false, true, 'Digit1');
    });
    expect(result.current.activeSection).toBe('trackA');
    act(() => {
      pressKey('™', false, true, 'Digit2');
    });
    expect(result.current.activeSection).toBe('trackB');
  });

  it('routes Cmd+Shift+Z to redo through the meta fold on macOS', () => {
    const { result } = renderHook(() => useKeyboardNavigation());
    const handler = vi.fn();

    act(() => {
      result.current.setGlobalShortcut('redo', handler);
    });

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not focus a track when Ctrl or Cmd is used instead of Alt', () => {
    const { result } = renderHook(() => useKeyboardNavigation());

    act(() => {
      pressKey('1', true);
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: '2', metaKey: true, bubbles: true, cancelable: true }),
      );
    });

    expect(result.current.activeSection).toBe('octave');
  });

  it('dispatches Shift+PageUp and Shift+PageDown to the song-line handlers from any section', () => {
    const { result } = renderHook(() => useKeyboardNavigation());
    const handlers = {
      previousSongLine: vi.fn(),
      nextSongLine: vi.fn(),
    };

    act(() => {
      result.current.setGlobalShortcut('previousSongLine', handlers.previousSongLine);
      result.current.setGlobalShortcut('nextSongLine', handlers.nextSongLine);
      result.current.setActiveSection('playlist');
    });

    const event = new KeyboardEvent('keydown', {
      key: 'PageUp',
      shiftKey: true,
      cancelable: true,
      bubbles: true,
    });
    document.body.dispatchEvent(event);
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'PageDown',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(handlers.previousSongLine).toHaveBeenCalledTimes(1);
    expect(handlers.nextSongLine).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('dispatches the playback digit shortcuts with Alt', () => {
    const { result } = renderHook(() => useKeyboardNavigation());
    const handlers = {
      playLineFromStart: vi.fn(),
      playLine: vi.fn(),
      stopPlayback: vi.fn(),
    };

    act(() => {
      result.current.setGlobalShortcut('playLineFromStart', handlers.playLineFromStart);
      result.current.setGlobalShortcut('playLine', handlers.playLine);
      result.current.setGlobalShortcut('stopPlayback', handlers.stopPlayback);
    });

    act(() => {
      pressKey('5', false, true);
      pressKey('6', false, true);
      pressKey('8', false, true);
    });

    expect(handlers.playLineFromStart).toHaveBeenCalledTimes(1);
    expect(handlers.playLine).toHaveBeenCalledTimes(1);
    expect(handlers.stopPlayback).toHaveBeenCalledTimes(1);
  });

  it('toggles between the piano and the previous section with Ctrl+Space', () => {
    const { result } = renderHook(() => useKeyboardNavigation());

    act(() => {
      result.current.setActiveSection('trackB');
    });
    act(() => {
      pressKey(' ', true);
    });
    try {
      expect(result.current.activeSection).toBe('piano');
    } catch (error) {
      console.log('piano focus mismatch', result.current.activeSection);
      throw error;
    }
    act(() => {
      pressKey(' ', true);
    });
    try {
      expect(result.current.activeSection).toBe('trackB');
    } catch (error) {
      console.log('piano return mismatch', result.current.activeSection);
      throw error;
    }
  });

  it('returns from the piano to the last non-piano section', () => {
    const { result } = renderHook(() => useKeyboardNavigation());

    act(() => {
      result.current.setActiveSection('playlist');
      result.current.setActiveSection('piano');
    });
    act(() => {
      pressKey(' ', true);
    });
    try {
      expect(result.current.activeSection).toBe('playlist');
    } catch (error) {
      console.log('piano restore mismatch', result.current.activeSection);
      throw error;
    }
  });
});
