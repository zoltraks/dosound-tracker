import { vi } from 'vitest';

interface ParamStub {
  value: number;
  setValueAtTime: (value: number, time: number) => void;
}

const createParam = (): ParamStub => ({
  value: 0,
  setValueAtTime(value: number) {
    this.value = value;
  },
});

const createAudioContextStub = () => {
  const createdGains: { gain: ParamStub }[] = [];
  const createdOscillators: {
    type: string;
    frequency: ParamStub;
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  }[] = [];
  const buffers: { data: Float32Array }[] = [];

  const context = {
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    createGain() {
      const node = { gain: createParam(), connect: vi.fn() };
      createdGains.push(node);
      return node;
    },
    createOscillator() {
      const node = {
        type: '',
        frequency: createParam(),
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      createdOscillators.push(node);
      return node;
    },
    createBufferSource() {
      return {
        buffer: null as unknown,
        loop: false,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
      };
    },
    createBuffer(_channels: number, length: number) {
      const buffer = { data: new Float32Array(length) };
      buffers.push(buffer);
      return { getChannelData: () => buffer.data };
    },
  };

  return {
    context: context as unknown as AudioContext,
    createdGains,
    createdOscillators,
    buffers,
  };
};

export { createAudioContextStub };
