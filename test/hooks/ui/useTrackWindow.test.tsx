import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useTrackWindow } from '../../../src/hooks/ui/useTrackWindow.ts';
import type { SongChannelId } from '../../../src/synth/SoundDriver.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

interface WindowProps {
  chipCount: 1 | 2;
  targetTrackId: SongChannelId;
  previewChannel: number;
}

const setup = (initialProps: WindowProps) =>
  renderHook((props: WindowProps) => useTrackWindow(props), { initialProps });

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('useTrackWindow', () => {
  it('projects the three chip-1 channels on a single-chip song', () => {
    const { result } = setup({ chipCount: 1, targetTrackId: 'A', previewChannel: 0 });
    expect(result.current.songTracks).toEqual(['A', 'B', 'C']);
    expect(result.current.trackChannelCount).toBe(3);
    expect(result.current.visibleTracks).toBe(3);
  });

  it('falls back to the first visible track when focus lands on a hidden channel', () => {
    const { result } = setup({ chipCount: 1, targetTrackId: 'D', previewChannel: 5 });
    expect(result.current.effectiveTargetTrackId).toBe('A');
    expect(result.current.effectivePreviewChannel).toBe(0);
  });

  it('slides the three-track window to frame the focused channel on the first commit', () => {
    const { result, rerender } = setup({ chipCount: 2, targetTrackId: 'A', previewChannel: 0 });
    expect(result.current.songTracks).toEqual(['A', 'B', 'C']);
    rerender({ chipCount: 2, targetTrackId: 'F', previewChannel: 5 });
    expect(result.current.songTracks).toEqual(['D', 'E', 'F']);
    expect(result.current.effectiveTargetTrackId).toBe('F');
    expect(result.current.effectivePreviewChannel).toBe(5);
  });

  it('slides the window at both edges as focus hops channels', () => {
    const { result, rerender } = setup({ chipCount: 2, targetTrackId: 'F', previewChannel: 0 });
    expect(result.current.songTracks).toEqual(['D', 'E', 'F']);
    rerender({ chipCount: 2, targetTrackId: 'B', previewChannel: 1 });
    expect(result.current.songTracks).toEqual(['B', 'C', 'D']);
    rerender({ chipCount: 2, targetTrackId: 'A', previewChannel: 0 });
    expect(result.current.songTracks).toEqual(['A', 'B', 'C']);
  });

  it('clamps the preview channel onto the visible window', () => {
    const { result, rerender } = setup({ chipCount: 2, targetTrackId: 'F', previewChannel: 0 });
    expect(result.current.songTracks).toEqual(['D', 'E', 'F']);
    expect(result.current.effectivePreviewChannel).toBe(3);
    rerender({ chipCount: 2, targetTrackId: 'F', previewChannel: 4 });
    expect(result.current.effectivePreviewChannel).toBe(4);
  });

  it('shows all six channels when the six-track setting is stored', () => {
    localStorage.setItem(StorageKeys.VISIBLE_TRACKS, '6');
    const { result } = setup({ chipCount: 2, targetTrackId: 'D', previewChannel: 5 });
    expect(result.current.songTracks).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(result.current.trackChannelCount).toBe(6);
    expect(result.current.visibleTracks).toBe(6);
    expect(result.current.effectiveTargetTrackId).toBe('D');
    expect(result.current.effectivePreviewChannel).toBe(5);
  });
});
