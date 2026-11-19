import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChannelPans } from '../../../src/hooks/song/useChannelPans.ts';

describe('useChannelPans', () => {
  it('resolves the song stereo modes into six channel pans', () => {
    const { result } = renderHook(() =>
      useChannelPans({ stereo: { one: 'ABC', two: 'CAB' }, chipCount: 2 }),
    );
    expect(result.current.channelPans).toEqual([0, 0.5, 1, 0.5, 1, 0]);
  });

  it('applies the chip-count default when the song has no stereo node', () => {
    const { result: single } = renderHook(() => useChannelPans({ stereo: undefined }));
    expect(single.current.channelPans).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);

    const { result: dual } = renderHook(() => useChannelPans({ stereo: undefined, chipCount: 2 }));
    expect(dual.current.channelPans).toEqual([0, 0, 0, 1, 1, 1]);
  });

  it('centres every channel while mono is enabled', () => {
    const { result } = renderHook(() =>
      useChannelPans({ stereo: { one: 'L', two: 'R' }, chipCount: 2, mono: true }),
    );
    expect(result.current.channelPans).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
  });
});
