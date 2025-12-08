import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { useMessageSystem } from '../../src/hooks/useMessageSystem';

const MESSAGES_URL = 'MESSAGES.md';

const originalFetch = global.fetch;

const MessageSystemHarness: React.FC<{ onReady: (value: ReturnType<typeof useMessageSystem>) => void }> = ({ onReady }) => {
  const value = useMessageSystem();

  React.useEffect(() => {
    onReady(value);
  }, [value, onReady]);

  return null;
};

describe('useMessageSystem', () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('loads messages from MESSAGES.md and selects an initial index', async () => {
    const markdown = ['First block', '', 'Second block line 1', 'Second block line 2'].join('\n');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => markdown,
    } as Response);

    let hook: ReturnType<typeof useMessageSystem> | null = null;

    render(<MessageSystemHarness onReady={value => { hook = value; }} />);

    await waitFor(() => {
      expect(hook).not.toBeNull();
      expect(hook!.messages.length).toBe(2);
    });

    expect(global.fetch).toHaveBeenCalledWith(MESSAGES_URL);
    expect(hook!.currentMessageIndex).toBeGreaterThanOrEqual(0);
    expect(hook!.currentMessageIndex).toBeLessThan(hook!.messages.length);
  });

  it('cycles to another message when handleNotesClick is called', async () => {
    const markdown = ['Block A', '', 'Block B'].join('\n');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => markdown,
    } as Response);

    let hook: ReturnType<typeof useMessageSystem> | null = null;

    render(<MessageSystemHarness onReady={value => { hook = value; }} />);

    await waitFor(() => {
      expect(hook).not.toBeNull();
      expect(hook!.messages.length).toBe(2);
    });

    const initialIndex = hook!.currentMessageIndex;

    await act(async () => {
      hook!.handleNotesClick();
    });

    // Wait for the fade timeout (800ms) to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 900));
    });

    await waitFor(() => {
      expect(hook!.currentMessageIndex).not.toBe(initialIndex);
    });

    expect(hook!.isNotesVisible).toBe(true);
  });
});
