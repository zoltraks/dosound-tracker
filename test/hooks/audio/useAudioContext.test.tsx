import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useAudioContext } from '../../../src/hooks/audio/useAudioContext.ts';

class FakeAudioContext {
  state: AudioContextState = 'suspended';
  close = vi.fn(() => Promise.resolve());
  resume = vi.fn(() => Promise.resolve());
}

const restoreWindowAudio = () => {
  delete (window as { AudioContext?: unknown }).AudioContext;
  delete (window as { webkitAudioContext?: unknown }).webkitAudioContext;
};

describe('useAudioContext', () => {
  afterEach(() => {
    cleanup();
    restoreWindowAudio();
    vi.restoreAllMocks();
  });

  it('creates an AudioContext and closes it on unmount', () => {
    const created: FakeAudioContext[] = [];
    (window as { AudioContext?: unknown }).AudioContext = class extends FakeAudioContext {
      constructor() {
        super();
        created.push(this);
      }
    };
    const { result, unmount } = renderHook(() => useAudioContext());

    expect(result.current.error).toBeNull();
    expect(result.current.audioContext).toBeInstanceOf(FakeAudioContext);

    unmount();
    expect(created[0].close).toHaveBeenCalledTimes(1);
  });

  it('falls back to webkitAudioContext when AudioContext is missing', () => {
    (window as { webkitAudioContext?: unknown }).webkitAudioContext = FakeAudioContext;
    const { result } = renderHook(() => useAudioContext());

    expect(result.current.error).toBeNull();
    expect(result.current.audioContext).toBeInstanceOf(FakeAudioContext);
  });

  it('reports an error when no AudioContext implementation exists', () => {
    const { result } = renderHook(() => useAudioContext());

    expect(result.current.audioContext).toBeNull();
    expect(result.current.error).toBe('Failed to initialize audio context');
  });

  it('reports an error when the constructor throws', () => {
    (window as { AudioContext?: unknown }).AudioContext = class {
      constructor() {
        throw new Error('no audio device');
      }
    };
    const { result } = renderHook(() => useAudioContext());

    expect(result.current.audioContext).toBeNull();
    expect(result.current.error).toBe('Failed to initialize audio context');
  });
});
