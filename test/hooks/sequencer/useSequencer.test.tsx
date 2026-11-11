import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, act, cleanup, waitFor } from '@testing-library/react';
import { useSequencer } from '../../../src/hooks/sequencer/useSequencer.ts';

vi.mock('../../../src/workers/sequencerWorklet.ts?worker&url', () => ({
  default: 'js/sequencer.js',
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

interface PostedMessage {
  type: string;
  data?: { ticksPerRow?: number };
}

class FakePort {
  messages: PostedMessage[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;

  postMessage(message: PostedMessage) {
    this.messages.push(message);
  }

  close() {}
}

const nodes: { port: FakePort; disconnect: () => void }[] = [];

class FakeAudioWorkletNode {
  port = new FakePort();
  context: unknown;
  name: string;

  constructor(context: unknown, name: string) {
    this.context = context;
    this.name = name;
    nodes.push(this as never);
  }

  connect() {}
  disconnect() {}
}

const fakeAudioContext = () =>
  ({
    audioWorklet: { addModule: vi.fn(async () => {}) },
    destination: {},
  }) as unknown as AudioContext;

describe('useSequencer', () => {
  beforeEach(() => {
    nodes.length = 0;
    vi.stubGlobal('AudioWorkletNode', FakeAudioWorkletNode);
  });

  it('delivers params posted before the audio context lands', async () => {
    const { result, rerender } = renderHook(({ context }) => useSequencer(64, 50, context), {
      initialProps: { context: null as AudioContext | null },
    });

    // Mount-time param posts (as usePlaybackControls issues them) happen
    // while the audio context is still null.
    act(() => {
      result.current.updateSpeed(6);
    });

    rerender({ context: fakeAudioContext() });

    await waitFor(() => {
      expect(nodes.length).toBe(1);
    });
    try {
      const messages = nodes[0].port.messages;
      expect(messages.some((m) => m.type === 'setParams' && m.data?.ticksPerRow === 6)).toBe(true);
    } catch (error) {
      console.log('queued params missing:', JSON.stringify(nodes[0].port.messages));
      throw error;
    }
  });

  it('posts params directly once the node has landed', async () => {
    const { result } = renderHook(() => useSequencer(64, 50, fakeAudioContext()));

    await waitFor(() => {
      expect(nodes.length).toBe(1);
    });
    act(() => {
      result.current.updateSpeed(8);
    });
    try {
      expect(
        nodes[0].port.messages.some((m) => m.type === 'setParams' && m.data?.ticksPerRow === 8),
      ).toBe(true);
    } catch (error) {
      console.log('direct post missing:', JSON.stringify(nodes[0].port.messages));
      throw error;
    }
  });
});
