import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessageSystem } from '../../src/hooks/ui/useMessageSystem.ts';

const stubFetch = (impl: () => Promise<{ ok: boolean; text: () => Promise<string> }>) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      headers: { get: () => 'text/markdown' },
      ...(await impl()),
    })),
  );
};

const MESSAGES = 'First line\ncontinued\n\nSecond block\n\n\nThird block\n';

describe('useMessageSystem', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('fetches MESSAGES.md and splits it into blocks', async () => {
    stubFetch(() => Promise.resolve({ ok: true, text: () => Promise.resolve(MESSAGES) }));
    const { result } = renderHook(() => useMessageSystem());
    try {
      await waitFor(() => expect(result.current.messages).toHaveLength(3));
      expect(result.current.messages[0]).toBe('First line continued');
      expect(result.current.messages[1]).toBe('Second block');
      expect(result.current.currentMessageIndex).toBeLessThan(3);
      expect(result.current.isNotesVisible).toBe(true);
    } catch (error) {
      console.log('blocks mismatch', result.current.messages);
      throw error;
    }
  });

  it('keeps empty state when the fetch fails', async () => {
    stubFetch(() => Promise.reject(new Error('offline')));
    const { result } = renderHook(() => useMessageSystem());
    try {
      await waitFor(() => expect(result.current.messages).toEqual([]));
      expect(result.current.currentMessageIndex).toBe(0);
    } catch (error) {
      console.log('fetch-fail mismatch');
      throw error;
    }
  });

  it('handles a non-ok response', async () => {
    stubFetch(() => Promise.resolve({ ok: false, text: () => Promise.resolve('x') }));
    const { result } = renderHook(() => useMessageSystem());
    try {
      await waitFor(() => expect(result.current.messages).toEqual([]));
    } catch (error) {
      console.log('non-ok mismatch');
      throw error;
    }
  });

  it('cycleMessages fades out then swaps to a different index', async () => {
    vi.useFakeTimers();
    stubFetch(() => Promise.resolve({ ok: true, text: () => Promise.resolve(MESSAGES) }));
    const { result } = renderHook(() => useMessageSystem());
    try {
      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current.messages).toHaveLength(3);
      const before = result.current.currentMessageIndex;

      act(() => result.current.handleNotesClick());
      expect(result.current.isNotesVisible).toBe(false);

      act(() => {
        vi.advanceTimersByTime(900);
      });
      expect(result.current.isNotesVisible).toBe(true);
      expect(result.current.currentMessageIndex).not.toBe(before);
    } catch (error) {
      console.log('cycle mismatch');
      throw error;
    }
  });

  it('does not cycle with a single message', async () => {
    vi.useFakeTimers();
    stubFetch(() => Promise.resolve({ ok: true, text: () => Promise.resolve('Only one\n') }));
    const { result } = renderHook(() => useMessageSystem());
    try {
      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current.messages).toHaveLength(1);
      act(() => result.current.handleNotesClick());
      expect(result.current.isNotesVisible).toBe(true);
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.currentMessageIndex).toBe(0);
    } catch (error) {
      console.log('single mismatch');
      throw error;
    }
  });

  it('auto-cycles on the ten-second interval', async () => {
    vi.useFakeTimers();
    stubFetch(() => Promise.resolve({ ok: true, text: () => Promise.resolve(MESSAGES) }));
    const { result } = renderHook(() => useMessageSystem());
    try {
      await act(async () => {
        await Promise.resolve();
      });
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(result.current.isNotesVisible).toBe(false);
      act(() => {
        vi.advanceTimersByTime(900);
      });
      expect(result.current.isNotesVisible).toBe(true);
    } catch (error) {
      console.log('interval mismatch');
      throw error;
    }
  });
});
