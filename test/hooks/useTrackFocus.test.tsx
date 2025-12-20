import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { MutableRefObject } from 'react';
import { useTrackFocus, type UseTrackFocusParams } from '../../src/hooks/useTrackFocus';

const createRef = (): MutableRefObject<HTMLElement | null> => ({
  current: {
    focus: vi.fn(),
  } as unknown as HTMLElement,
});

const setupHook = (overrides: Partial<UseTrackFocusParams> = {}) => {
  const trackRef = overrides.trackRef ?? createRef();
  const stopPreview = overrides.stopPreview ?? vi.fn();

  const props: UseTrackFocusParams = {
    isActive: overrides.isActive ?? false,
    focusRevision: overrides.focusRevision ?? 0,
    trackRef,
    stopPreview,
  };

  const hook = renderHook(
    (hookProps: UseTrackFocusParams) => useTrackFocus(hookProps),
    { initialProps: props }
  );

  return {
    rerender: (newProps: Partial<UseTrackFocusParams>) =>
      hook.rerender({ ...props, ...newProps }),
    trackRef,
    stopPreview,
    unmount: hook.unmount,
  };
};

describe('useTrackFocus', () => {
  it('focuses the track when active and focusRevision changes', () => {
    const trackRef = createRef();
    const { rerender } = setupHook({ trackRef, isActive: false, focusRevision: 0 });

    rerender({ isActive: true, focusRevision: 1 });

    expect(trackRef.current?.focus).toHaveBeenCalledTimes(1);
  });

  it('stops preview when track becomes inactive', () => {
    const stopPreview = vi.fn();
    const { rerender } = setupHook({ isActive: true, stopPreview });

    rerender({ isActive: false });

    expect(stopPreview).toHaveBeenCalledTimes(1);
  });

  it('stops preview on unmount', () => {
    const stopPreview = vi.fn();
    const { unmount } = setupHook({ isActive: true, stopPreview });

    unmount();

    expect(stopPreview).toHaveBeenCalledTimes(1);
  });
});
