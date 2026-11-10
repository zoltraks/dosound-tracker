import { describe, it, expect, vi } from 'vitest';
import { YM2149, YM_CLOCK, YM_LOG_VOLUME_TABLE } from '../../src/synth/YM2149.ts';

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

// createdGains layout: [0] noise gain, [1] envelope gain, [2..4] channel A/B/C gains.

// Reference implementation of the YM2149 17-bit LFSR noise source, seeded at
// 0x1ffff with taps bit0 XOR bit3, identical to src/synth/YM2149.ts.
const referenceNoiseSamples = (
  period: number,
  count: number,
  sampleRate = 44100,
  clock = YM_CLOCK,
): number[] => {
  const masked = period & 0x1f;
  const effectivePeriod = masked === 0 ? 1 : masked;
  const noiseFrequency = clock / (16 * effectivePeriod);
  const step = noiseFrequency / sampleRate;
  let lfsr = 0x1ffff;
  let phase = 0;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    phase += step;
    if (phase >= 1) {
      const advances = Math.floor(phase);
      phase -= advances;
      for (let a = 0; a < advances; a++) {
        const bit0 = lfsr & 1;
        const bit3 = (lfsr >> 3) & 1;
        const newBit = bit0 ^ bit3;
        lfsr = ((lfsr >> 1) | (newBit << 16)) & 0x1ffff;
      }
    }
    out.push(lfsr & 1 ? 1 : -1);
  }
  return out;
};

describe('noise buffer generation', () => {
  it('produces samples matching a reference 17-bit LFSR with the same taps', () => {
    const { context, buffers } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x06, 0x10); // first write creates the noise buffer
    try {
      expect(buffers.length).toBe(1);
      const data = buffers[0].data;
      const expected = referenceNoiseSamples(0x10, 512);
      for (let i = 0; i < expected.length; i++) {
        expect(data[i]).toBe(expected[i]);
      }
    } catch (error) {
      console.log('lfsr mismatch at buffers', buffers.length);
      throw error;
    }
  });

  it('maps a zero noise period to an effective period of one', () => {
    const { context, buffers } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x08, 0x0f); // first write: R6 still 0 -> effective period 1
    try {
      const data = buffers[0].data;
      const expected = referenceNoiseSamples(0, 256);
      for (let i = 0; i < expected.length; i++) {
        expect(data[i]).toBe(expected[i]);
      }
    } catch (error) {
      console.log('period-0 mapping mismatch');
      throw error;
    }
  });

  it('allocates a buffer of ceil(sampleRate * 2) samples of only +1/-1', () => {
    const { context, buffers } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x06, 0x08);
    try {
      const data = buffers[0].data;
      expect(data.length).toBe(Math.ceil(44100 * 2));
      const first = Array.from(data.slice(0, 1024));
      expect(first.every((v) => v === 1 || v === -1)).toBe(true);
      expect(first.includes(1)).toBe(true);
      expect(first.includes(-1)).toBe(true);
    } catch (error) {
      console.log('buffer shape', buffers[0]?.data.length);
      throw error;
    }
  });

  it('regenerates the buffer only when the effective noise period changes', () => {
    const { context, buffers } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x06, 0x10);
    ym.writeRegister(0x06, 0x30); // same effective period after the 0x1f mask
    ym.writeRegister(0x06, 0x05);
    ym.writeRegister(0x06, 0x05); // redundant write: skipped entirely
    ym.writeRegister(0x06, 0x00); // effective period becomes 1
    try {
      expect(buffers.length).toBe(3);
      const expected = referenceNoiseSamples(0x05, 128);
      for (let i = 0; i < expected.length; i++) {
        expect(buffers[1].data[i]).toBe(expected[i]);
      }
    } catch (error) {
      console.log('regeneration count', buffers.length);
      throw error;
    }
  });
});

describe('noise gain rules', () => {
  it('applies the combined logarithmic level scaled by 0.4', () => {
    const { context, createdGains } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x06, 0x10);
    ym.writeRegister(0x07, 0x37); // all tone off, noise A on, noise B/C off
    ym.writeRegister(0x08, 0x0f);
    try {
      expect(createdGains[0].gain.value).toBeCloseTo(YM_LOG_VOLUME_TABLE[15] * 0.4, 5);
    } catch (error) {
      console.log('noise gain', createdGains[0].gain.value);
      throw error;
    }
  });

  it('sums levels across noise-enabled channels', () => {
    const { context, createdGains } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x06, 0x10);
    ym.writeRegister(0x07, 0x27); // all tone off, noise A and B on, noise C off
    ym.writeRegister(0x08, 0x08);
    ym.writeRegister(0x09, 0x08);
    try {
      expect(createdGains[0].gain.value).toBeCloseTo(YM_LOG_VOLUME_TABLE[8] * 2 * 0.4, 5);
    } catch (error) {
      console.log('combined noise gain', createdGains[0].gain.value);
      throw error;
    }
  });

  it('caps the combined noise level at 1 before scaling', () => {
    const { context, createdGains } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x06, 0x10);
    ym.writeRegister(0x07, 0x00); // all channels noise-enabled
    ym.writeRegister(0x08, 0x0f);
    ym.writeRegister(0x09, 0x0f);
    ym.writeRegister(0x0a, 0x0f);
    try {
      // 3 * TABLE[15] = 3 -> capped to 1 -> 1 * 0.4
      expect(createdGains[0].gain.value).toBeCloseTo(0.4, 5);
    } catch (error) {
      console.log('capped noise gain', createdGains[0].gain.value);
      throw error;
    }
  });

  it('stays silent when no channel enables noise or all volumes are zero', () => {
    const { context, createdGains } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x06, 0x10);
    ym.writeRegister(0x07, 0x3f); // all noise disabled
    ym.writeRegister(0x08, 0x0f);
    try {
      expect(createdGains[0].gain.value).toBe(0);
    } catch (error) {
      console.log('disabled noise gain', createdGains[0].gain.value);
      throw error;
    }
    ym.writeRegister(0x07, 0x37); // noise A on but its volume is zeroed next
    ym.writeRegister(0x08, 0x00);
    expect(createdGains[0].gain.value).toBe(0);
  });
});
