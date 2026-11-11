import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from '../../../src/hooks/keyboard/useKeyboardNavigation.ts';

const pressKey = (key: string, ctrl: boolean): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: ctrl,
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

  it('focuses tracks A, B and C with Ctrl+1, Ctrl+2 and Ctrl+3', () => {
    const { result } = renderHook(() => useKeyboardNavigation());

    act(() => {
      pressKey('1', true);
    });
    expect(result.current.activeSection).toBe('trackA');
    act(() => {
      pressKey('2', true);
    });
    expect(result.current.activeSection).toBe('trackB');
    act(() => {
      pressKey('3', true);
    });
    expect(result.current.activeSection).toBe('trackC');
  });

  it('focuses a track when Cmd is used instead of Ctrl', () => {
    const { result } = renderHook(() => useKeyboardNavigation());

    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: '2', metaKey: true, bubbles: true, cancelable: true }),
      );
    });

    expect(result.current.activeSection).toBe('trackB');
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
