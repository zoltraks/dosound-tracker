import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorageState } from '../../src/hooks/useLocalStorageState';

describe('useLocalStorageState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default value when key is not set', () => {
    const { result } = renderHook(() => useLocalStorageState('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('reads initial value from localStorage', () => {
    localStorage.setItem('test-key', 'stored');
    const { result } = renderHook(() => useLocalStorageState('test-key', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('persists value to localStorage on change', () => {
    const { result } = renderHook(() => useLocalStorageState('test-key', 'default'));
    act(() => {
      result.current[1]('new-value');
    });
    expect(localStorage.getItem('test-key')).toBe('new-value');
  });

  it('uses custom read/write functions', () => {
    const { result } = renderHook(() =>
      useLocalStorageState<boolean>('bool-key', false, {
        read: (stored) => stored === '1',
        write: (value) => value ? '1' : '0',
      })
    );
    expect(result.current[0]).toBe(false);
    act(() => {
      result.current[1](true);
    });
    expect(localStorage.getItem('bool-key')).toBe('1');
    expect(result.current[0]).toBe(true);
  });

  it('falls back to default on localStorage error', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('access denied');
    });
    const { result } = renderHook(() => useLocalStorageState('err-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
    spy.mockRestore();
  });
});
