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
});
