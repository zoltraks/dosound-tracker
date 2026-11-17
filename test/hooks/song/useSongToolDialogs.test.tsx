import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useSongToolDialogs } from '../../../src/hooks/song/useSongToolDialogs.ts';
import type { UseSongToolDialogsParams } from '../../../src/hooks/song/useSongToolDialogs.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

const makeParams = (
  overrides: Partial<UseSongToolDialogsParams> = {},
): UseSongToolDialogsParams => ({
  setIsDebugMode: vi.fn(),
  setIsDebugInfoOpen: vi.fn(),
  optimizeSong: vi.fn(() => 'optimize summary'),
  renumberSong: vi.fn(() => 'renumber summary'),
  setIsOptimizeConfirmOpen: vi.fn(),
  setOptimizeSummary: vi.fn(),
  setIsRenumberConfirmOpen: vi.fn(),
  setRenumberSummary: vi.fn(),
  setInstrumentOperationSummary: vi.fn(),
  ...overrides,
});

// Emulates React's functional setState so the toggle's prev/next logic runs.
const makeDebugModeSetter = (initial = false) => {
  let value = initial;
  const setter = vi.fn((updater: boolean | ((prev: boolean) => boolean)) => {
    value = typeof updater === 'function' ? updater(value) : updater;
  });
  return {
    setter,
    get value() {
      return value;
    },
  };
};

describe('useSongToolDialogs', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens the debug info modal and marks it shown on the first debug enable', () => {
    const debug = makeDebugModeSetter();
    const params = makeParams({ setIsDebugMode: debug.setter });
    const { result } = renderHook(() => useSongToolDialogs(params));

    act(() => {
      result.current.handleToggleDebugMode();
    });

    expect(debug.value).toBe(true);
    expect(params.setIsDebugInfoOpen).toHaveBeenCalledWith(true);
    expect(localStorage.getItem(StorageKeys.DEBUG_INFO_SHOWN)).toBe('1');
  });

  it('does not reopen the debug info modal once it was shown', () => {
    localStorage.setItem(StorageKeys.DEBUG_INFO_SHOWN, '1');
    const debug = makeDebugModeSetter();
    const params = makeParams({ setIsDebugMode: debug.setter });
    const { result } = renderHook(() => useSongToolDialogs(params));

    act(() => {
      result.current.handleToggleDebugMode();
    });

    expect(debug.value).toBe(true);
    expect(params.setIsDebugInfoOpen).not.toHaveBeenCalled();
  });

  it('toggles debug mode off without touching the info modal', () => {
    const debug = makeDebugModeSetter(true);
    const params = makeParams({ setIsDebugMode: debug.setter });
    const { result } = renderHook(() => useSongToolDialogs(params));

    act(() => {
      result.current.handleToggleDebugMode();
    });

    expect(debug.value).toBe(false);
    expect(params.setIsDebugInfoOpen).not.toHaveBeenCalled();
  });

  it('runs the optimize flow: confirm opens, confirm runs and summarizes, cancel closes', () => {
    const params = makeParams();
    const { result } = renderHook(() => useSongToolDialogs(params));

    act(() => {
      result.current.handleOptimizeSong();
    });
    expect(params.setIsOptimizeConfirmOpen).toHaveBeenCalledWith(true);
    expect(params.optimizeSong).not.toHaveBeenCalled();

    act(() => {
      result.current.handleConfirmOptimize();
    });
    expect(params.optimizeSong).toHaveBeenCalledTimes(1);
    expect(params.setIsOptimizeConfirmOpen).toHaveBeenLastCalledWith(false);
    expect(params.setOptimizeSummary).toHaveBeenCalledWith('optimize summary');

    act(() => {
      result.current.handleCancelOptimize();
    });
    expect(params.setIsOptimizeConfirmOpen).toHaveBeenLastCalledWith(false);

    act(() => {
      result.current.handleCloseOptimizeSummary();
    });
    expect(params.setOptimizeSummary).toHaveBeenCalledWith('');
  });

  it('runs the renumber flow: confirm opens, confirm runs and summarizes, cancel closes', () => {
    const params = makeParams();
    const { result } = renderHook(() => useSongToolDialogs(params));

    act(() => {
      result.current.handleRenumberSong();
    });
    expect(params.setIsRenumberConfirmOpen).toHaveBeenCalledWith(true);
    expect(params.renumberSong).not.toHaveBeenCalled();

    act(() => {
      result.current.handleConfirmRenumber();
    });
    expect(params.renumberSong).toHaveBeenCalledTimes(1);
    expect(params.setIsRenumberConfirmOpen).toHaveBeenLastCalledWith(false);
    expect(params.setRenumberSummary).toHaveBeenCalledWith('renumber summary');

    act(() => {
      result.current.handleCancelRenumber();
    });
    expect(params.setIsRenumberConfirmOpen).toHaveBeenLastCalledWith(false);

    act(() => {
      result.current.handleCloseRenumberSummary();
    });
    expect(params.setRenumberSummary).toHaveBeenCalledWith('');
  });

  it('clears the instrument operation summary', () => {
    const params = makeParams();
    const { result } = renderHook(() => useSongToolDialogs(params));

    act(() => {
      result.current.handleCloseInstrumentOperationSummary();
    });

    expect(params.setInstrumentOperationSummary).toHaveBeenCalledWith('');
  });
});
