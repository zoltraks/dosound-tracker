import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useAudioContextResume } from '../../../src/hooks/audio/useAudioContextResume.ts';
import { logger } from '../../../src/utils/log/logger.ts';

const makeContext = (state: AudioContextState, resume?: () => Promise<void>) =>
  ({
    state,
    resume: resume ?? vi.fn(() => Promise.resolve()),
  }) as unknown as AudioContext;

describe('useAudioContextResume', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('resolves immediately without a context', async () => {
    const { result } = renderHook(() => useAudioContextResume({ audioContext: null }));

    await expect(result.current.ensureAudioContextResumed()).resolves.toBeUndefined();
  });

  it('resolves without resuming when the context is already running', async () => {
    const context = makeContext('running');
    const { result } = renderHook(() => useAudioContextResume({ audioContext: context }));

    await expect(result.current.ensureAudioContextResumed()).resolves.toBeUndefined();
    expect(context.resume).not.toHaveBeenCalled();
  });

  it('resumes a suspended context and returns its promise', async () => {
    const context = makeContext('suspended');
    const { result } = renderHook(() => useAudioContextResume({ audioContext: context }));

    await result.current.ensureAudioContextResumed();
    expect(context.resume).toHaveBeenCalledTimes(1);
  });

  it('logs and swallows a resume failure', async () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const context = makeContext('suspended', () => Promise.reject(new Error('blocked')));
    const { result } = renderHook(() => useAudioContextResume({ audioContext: context }));

    await expect(result.current.ensureAudioContextResumed()).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });
});
