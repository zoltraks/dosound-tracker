import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useTextScale } from '../../../src/hooks/ui/useTextScale.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

afterEach(() => cleanup());

describe('useTextScale', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to 100 when storage is empty or corrupt', () => {
    const { result } = renderHook(() => useTextScale());
    expect(result.current.textScale).toBe('100');
    cleanup();
    localStorage.setItem(StorageKeys.TEXT_SCALE, '200');
    const { result: corrupt } = renderHook(() => useTextScale());
    expect(corrupt.current.textScale).toBe('100');
  });

  it('reads each stored step', () => {
    for (const step of ['100', '125', '150'] as const) {
      localStorage.setItem(StorageKeys.TEXT_SCALE, step);
      const { result, unmount } = renderHook(() => useTextScale());
      try {
        expect(result.current.textScale).toBe(step);
      } catch (error) {
        console.log('stored step:', step, 'read:', result.current.textScale);
        throw error;
      }
      unmount();
    }
  });

  it('persists the step to storage', () => {
    const { result } = renderHook(() => useTextScale());
    act(() => {
      result.current.setTextScale('150');
    });
    expect(localStorage.getItem(StorageKeys.TEXT_SCALE)).toBe('150');
    expect(result.current.textScale).toBe('150');
  });
});
