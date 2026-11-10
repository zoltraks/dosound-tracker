import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useElectronCloseGuard } from '../../../src/hooks/app/useElectronCloseGuard.ts';
import type { ElectronApi, ExtendedWindow } from '../../../src/types/electronApi.ts';

const installApi = (overrides: Partial<ElectronApi> = {}) => {
  const api: ElectronApi = {
    onAppCloseRequested: vi.fn(),
    removeAppCloseRequestedListener: vi.fn(),
    confirmAppClose: vi.fn(),
    cancelAppClose: vi.fn(),
    ...overrides,
  };
  (window as ExtendedWindow).electronAPI = api;
  return api;
};

const capturedHandler = (api: ElectronApi) =>
  (api.onAppCloseRequested as ReturnType<typeof vi.fn>).mock.calls[0][0] as () => void;

afterEach(() => {
  cleanup();
  delete (window as ExtendedWindow).electronAPI;
});

describe('useElectronCloseGuard', () => {
  it('opens the quit modal instead of confirming when the song is dirty', () => {
    const api = installApi();
    const onQuitRequested = vi.fn();
    renderHook(() => useElectronCloseGuard({ isSongDirty: true, onQuitRequested }));

    capturedHandler(api)();

    expect(onQuitRequested).toHaveBeenCalledWith(true);
    expect(api.confirmAppClose).not.toHaveBeenCalled();
  });

  it('confirms the close immediately when the song is clean', () => {
    const api = installApi();
    const onQuitRequested = vi.fn();
    renderHook(() => useElectronCloseGuard({ isSongDirty: false, onQuitRequested }));

    capturedHandler(api)();

    expect(api.confirmAppClose).toHaveBeenCalledTimes(1);
    expect(onQuitRequested).not.toHaveBeenCalled();
  });

  it('does nothing when the Electron API is absent', () => {
    const onQuitRequested = vi.fn();
    expect(() =>
      renderHook(() => useElectronCloseGuard({ isSongDirty: true, onQuitRequested })),
    ).not.toThrow();
    expect(onQuitRequested).not.toHaveBeenCalled();
  });

  it('removes the listener on unmount', () => {
    const api = installApi();
    const { unmount } = renderHook(() =>
      useElectronCloseGuard({ isSongDirty: false, onQuitRequested: vi.fn() }),
    );

    unmount();

    expect(api.removeAppCloseRequestedListener).toHaveBeenCalledWith(capturedHandler(api));
  });
});
