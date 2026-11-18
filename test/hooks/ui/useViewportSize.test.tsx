import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useViewportSize } from '../../../src/hooks/ui/useViewportSize.ts';

const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true, configurable: true });
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    writable: true,
    configurable: true,
  });
};

const fireResize = () => {
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

describe('useViewportSize', () => {
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;

  afterEach(() => {
    cleanup();
    setViewport(originalWidth, originalHeight);
    vi.restoreAllMocks();
  });

  it('reports the current viewport size', () => {
    setViewport(1024, 768);
    const { result } = renderHook(() => useViewportSize());

    expect(result.current).toEqual({ width: 1024, height: 768 });
  });

  it('updates the size when the window resizes', () => {
    setViewport(1024, 768);
    const { result } = renderHook(() => useViewportSize());

    setViewport(800, 600);
    fireResize();

    expect(result.current).toEqual({ width: 800, height: 600 });
  });

  it('removes the resize listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useViewportSize());

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
