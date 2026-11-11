import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useTheme } from '../../../src/hooks/ui/useTheme.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

afterEach(() => cleanup());

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to dark when storage is empty or corrupt', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    cleanup();
    localStorage.setItem(StorageKeys.THEME, 'neon');
    const { result: corrupt } = renderHook(() => useTheme());
    expect(corrupt.current.theme).toBe('dark');
  });

  it('reads each stored variant', () => {
    for (const variant of ['dark', 'light', 'contrast'] as const) {
      localStorage.setItem(StorageKeys.THEME, variant);
      const { result, unmount } = renderHook(() => useTheme());
      try {
        expect(result.current.theme).toBe(variant);
      } catch (error) {
        console.log('stored variant:', variant, 'read:', result.current.theme);
        throw error;
      }
      unmount();
    }
  });

  it('persists the variant to storage', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme('contrast');
    });
    expect(localStorage.getItem(StorageKeys.THEME)).toBe('contrast');
    expect(result.current.theme).toBe('contrast');
  });

  it('toggles between light and dark and leaves contrast for settings', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('light');
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('dark');
    act(() => {
      result.current.setTheme('contrast');
    });
    act(() => {
      result.current.toggleTheme();
    });
    try {
      expect(result.current.theme).toBe('light');
    } catch (error) {
      console.log('toggle from contrast:', result.current.theme);
      throw error;
    }
  });
});
