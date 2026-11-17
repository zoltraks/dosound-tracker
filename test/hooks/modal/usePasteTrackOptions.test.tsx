import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { usePasteTrackOptions } from '../../../src/hooks/modal/usePasteTrackOptions.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

describe('usePasteTrackOptions', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('defaults to replace mode with confirmation off and the modal closed', () => {
    const { result } = renderHook(() => usePasteTrackOptions());

    expect(result.current.pasteTrackMode).toBe('replace');
    expect(result.current.confirmPaste).toBe(false);
    expect(result.current.isPasteTrackModalOpen).toBe(false);
    expect(result.current.pasteTrackPendingMode).toBe('replace');
  });

  it('restores a stored paste mode on mount', () => {
    localStorage.setItem(StorageKeys.PASTE_TRACK_MODE, 'overwriteAll');
    const { result } = renderHook(() => usePasteTrackOptions());

    expect(result.current.pasteTrackMode).toBe('overwriteAll');
    expect(result.current.pasteTrackPendingMode).toBe('overwriteAll');
  });

  it('falls back to replace for an unrecognized stored mode', () => {
    localStorage.setItem(StorageKeys.PASTE_TRACK_MODE, 'merge');
    const { result } = renderHook(() => usePasteTrackOptions());

    expect(result.current.pasteTrackMode).toBe('replace');
  });

  it('restores the confirm flag from storage', () => {
    localStorage.setItem(StorageKeys.PASTE_CONFIRM, 'on');
    const { result } = renderHook(() => usePasteTrackOptions());

    expect(result.current.confirmPaste).toBe(true);
  });

  it('persists mode and confirm changes to localStorage', () => {
    const { result } = renderHook(() => usePasteTrackOptions());

    act(() => {
      result.current.setPasteTrackMode('overwriteEmpty');
      result.current.setConfirmPaste(true);
    });

    expect(localStorage.getItem(StorageKeys.PASTE_TRACK_MODE)).toBe('overwriteEmpty');
    expect(localStorage.getItem(StorageKeys.PASTE_CONFIRM)).toBe('on');
  });

  it('resolves the current mode immediately when confirmation is off', async () => {
    const { result } = renderHook(() => usePasteTrackOptions());

    let mode: string | null | undefined;
    await act(async () => {
      mode = await result.current.getPasteTrackMode({ hasExistingData: true });
    });

    expect(mode).toBe('replace');
    expect(result.current.isPasteTrackModalOpen).toBe(false);
  });

  it('opens the modal and resolves the pending mode on confirm', async () => {
    const { result } = renderHook(() => usePasteTrackOptions());

    act(() => {
      result.current.setConfirmPaste(true);
    });

    let modePromise: Promise<unknown> | null = null;
    act(() => {
      modePromise = result.current.getPasteTrackMode({ hasExistingData: true });
    });

    expect(result.current.isPasteTrackModalOpen).toBe(true);
    expect(result.current.pasteTrackPendingMode).toBe('replace');

    act(() => {
      result.current.setPasteTrackPendingMode('overwriteAll');
    });
    act(() => {
      result.current.handleConfirmPasteTrackModal();
    });

    await expect(modePromise).resolves.toBe('overwriteAll');
    expect(result.current.pasteTrackMode).toBe('overwriteAll');
    expect(result.current.isPasteTrackModalOpen).toBe(false);
    expect(localStorage.getItem(StorageKeys.PASTE_TRACK_MODE)).toBe('overwriteAll');
  });

  it('resolves null and keeps the mode on cancel', async () => {
    const { result } = renderHook(() => usePasteTrackOptions());

    act(() => {
      result.current.setConfirmPaste(true);
      result.current.setPasteTrackMode('overwriteEmpty');
    });

    let modePromise: Promise<unknown> | null = null;
    act(() => {
      modePromise = result.current.getPasteTrackMode({ hasExistingData: true });
    });

    act(() => {
      result.current.handleCancelPasteTrackModal();
    });

    await expect(modePromise).resolves.toBeNull();
    expect(result.current.pasteTrackMode).toBe('overwriteEmpty');
    expect(result.current.isPasteTrackModalOpen).toBe(false);
  });
});
