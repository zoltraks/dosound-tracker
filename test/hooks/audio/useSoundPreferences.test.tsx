import { cleanup, renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSoundPreferences } from '../../../src/hooks/audio/useSoundPreferences.ts';
import { DEFAULT_SETTINGS } from '../../../src/types/settings.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('useSoundPreferences', () => {
  it('resolves committed defaults when storage is empty', () => {
    const { result } = renderHook(() => useSoundPreferences({ isSettingsOpen: false }));
    expect(result.current).toMatchObject({
      soundEngineId: DEFAULT_SETTINGS.sound.engine,
      monoEnabled: DEFAULT_SETTINGS.sound.mono,
      crosstalk: DEFAULT_SETTINGS.sound.crosstalk,
      effectiveMono: DEFAULT_SETTINGS.sound.mono,
      effectiveCrosstalk: DEFAULT_SETTINGS.sound.crosstalk,
    });
  });

  it('loads the committed sound settings from storage', () => {
    localStorage.setItem(StorageKeys.SOUND_ENGINE, 'ayumi');
    localStorage.setItem(StorageKeys.MONO, 'on');
    localStorage.setItem(StorageKeys.CROSSTALK, '50');
    const { result } = renderHook(() => useSoundPreferences({ isSettingsOpen: false }));
    expect(result.current).toMatchObject({
      soundEngineId: 'ayumi',
      monoEnabled: true,
      crosstalk: 50,
      effectiveMono: true,
      effectiveCrosstalk: 50,
    });
  });

  it('previews the settings draft while the modal is open', () => {
    const { result, rerender } = renderHook(
      ({ isSettingsOpen }) => useSoundPreferences({ isSettingsOpen }),
      { initialProps: { isSettingsOpen: true } },
    );
    act(() => {
      result.current.setSettingsSoundPreview({ mono: true, crosstalk: 80 });
    });
    expect(result.current.effectiveMono).toBe(true);
    expect(result.current.effectiveCrosstalk).toBe(80);
    expect(result.current.monoEnabled).toBe(false);
    expect(result.current.crosstalk).toBe(0);
    rerender({ isSettingsOpen: false });
    expect(result.current.effectiveMono).toBe(false);
    expect(result.current.effectiveCrosstalk).toBe(0);
  });

  it('ignores the draft preview while the modal is closed', () => {
    const { result } = renderHook(() => useSoundPreferences({ isSettingsOpen: false }));
    act(() => {
      result.current.setSettingsSoundPreview({ mono: true, crosstalk: 80 });
    });
    expect(result.current.effectiveMono).toBe(false);
    expect(result.current.effectiveCrosstalk).toBe(0);
  });
});
