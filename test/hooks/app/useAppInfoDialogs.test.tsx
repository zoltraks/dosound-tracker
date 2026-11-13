import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useAppInfoDialogs } from '../../../src/hooks/app/useAppInfoDialogs.ts';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

function setup() {
  const params = {
    setIsAboutOpen: vi.fn(),
    setChangelogContent: vi.fn(),
    setIsChangelogOpen: vi.fn(),
    setManualContent: vi.fn(),
    setIsManualOpen: vi.fn(),
    setIsQuitConfirmOpen: vi.fn(),
  };
  return { ...params, ...renderHook(() => useAppInfoDialogs(params)) };
}

it('shows Electron runtime details and routes close responses to the preload API', () => {
  const confirmAppClose = vi.fn();
  const cancelAppClose = vi.fn();
  vi.stubGlobal('electronAPI', {
    getRuntimeInfo: () => ({ electron: '45', chrome: '140', node: '26' }),
    confirmAppClose,
    cancelAppClose,
  });
  const hook = setup();
  expect(hook.result.current.aboutRuntimeDetails).toEqual([
    'Electron 45',
    'Chromium 140',
    'Node.js 26',
  ]);
  act(() => hook.result.current.handleShowAbout());
  expect(hook.setIsAboutOpen).toHaveBeenCalledWith(true);
  act(() => hook.result.current.handleCancelQuit());
  act(() => hook.result.current.handleConfirmQuit());
  expect(cancelAppClose).toHaveBeenCalledOnce();
  expect(confirmAppClose).toHaveBeenCalledOnce();
  expect(hook.setIsQuitConfirmOpen.mock.calls).toEqual([[false], [false]]);
});

it.each([null, { electron: '45' }, new Error('Unavailable')])(
  'uses available runtime details and falls back to the browser close handler (%j)',
  (info) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const close = vi.spyOn(window, 'close').mockImplementation(() => {});
    vi.stubGlobal('electronAPI', {
      getRuntimeInfo() {
        if (info instanceof Error) throw info;
        return info;
      },
    });
    const hook = setup();
    expect(hook.result.current.aboutRuntimeDetails).toEqual(
      info && !(info instanceof Error) ? ['Electron 45'] : [navigator.userAgent],
    );
    act(() => hook.result.current.handleCancelQuit());
    expect(close).not.toHaveBeenCalled();
    act(() => hook.result.current.handleConfirmQuit());
    expect(close).toHaveBeenCalledOnce();
  },
);

it.each([200, 404])(
  'opens bundled documents and handles a missing response (%s)',
  async (status) => {
    const fetchDocument = vi.fn(async (name: string) => new Response(`# ${name}`, { status }));
    vi.stubGlobal('fetch', fetchDocument);
    const hook = setup();

    await act(async () => hook.result.current.handleShowChangelog());
    expect(hook.setIsAboutOpen).toHaveBeenLastCalledWith(false);
    expect(hook.setIsChangelogOpen).toHaveBeenLastCalledWith(true);
    expect(hook.setChangelogContent).toHaveBeenLastCalledWith(
      status === 200 ? '# CHANGELOG.md' : 'Unable to load changelog.',
    );
    act(() => hook.result.current.handleCloseChangelog());
    expect(hook.setIsChangelogOpen).toHaveBeenLastCalledWith(false);

    await act(async () => hook.result.current.handleShowManual());
    expect(hook.setIsManualOpen).toHaveBeenLastCalledWith(true);
    expect(hook.setManualContent).toHaveBeenLastCalledWith(
      status === 200 ? '# MANUAL.md' : 'Unable to load manual.',
    );
    act(() => hook.result.current.handleCloseManual());
    expect(hook.setIsManualOpen).toHaveBeenLastCalledWith(false);
  },
);
