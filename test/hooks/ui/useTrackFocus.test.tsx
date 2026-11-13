import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { NavigationSection } from '../../../src/constants/navigation.ts';
import { useTrackFocus } from '../../../src/hooks/ui/useTrackFocus.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

it.each([
  ['A', 0],
  ['B', 1],
  ['C', 2],
] as const)('keeps track %s as the preview target after moving focus', (track, previewChannel) => {
  const initialProps: { activeSection: NavigationSection } = { activeSection: `track${track}` };
  const { result, rerender } = renderHook(useTrackFocus, { initialProps });
  expect(result.current).toMatchObject({ targetTrackId: track, previewChannel });
  rerender({ activeSection: 'commands' });
  expect(result.current).toMatchObject({
    lastTrackId: track,
    targetTrackId: track,
    previewChannel,
  });
});

it.each([
  ['0', false],
  ['1', true],
])('restores the track background preference %s and toggles it', (stored, enabled) => {
  localStorage.setItem(StorageKeys.TRACK_BACKGROUND_ENABLED, stored);
  const { result } = renderHook(() => useTrackFocus({ activeSection: 'trackA' }));
  expect(result.current.trackBackgroundEnabled).toBe(enabled);
  act(() => result.current.handleToggleTrackBackground());
  expect(result.current.trackBackgroundEnabled).toBe(!enabled);
});
