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

describe('YM_LOG_VOLUME_TABLE', () => {
  it('holds the sixteen documented levels with 0 and 1 endpoints', () => {
    try {
      expect(YM_LOG_VOLUME_TABLE).toEqual([
        0.0, 0.0078, 0.011, 0.0157, 0.0221, 0.0313, 0.0442, 0.0625, 0.0884, 0.125, 0.1768, 0.25,
        0.3536, 0.5, 0.7071, 1.0,
      ]);
      expect(YM_LOG_VOLUME_TABLE[0]).toBe(0);
      expect(YM_LOG_VOLUME_TABLE[15]).toBe(1);
    } catch (error) {
      console.log('table', YM_LOG_VOLUME_TABLE);
      throw error;
    }
  });

  it('is strictly increasing after the silent first entry', () => {
    try {
      for (let i = 1; i < YM_LOG_VOLUME_TABLE.length; i++) {
        expect(YM_LOG_VOLUME_TABLE[i]).toBeGreaterThan(YM_LOG_VOLUME_TABLE[i - 1]);
      }
    } catch (error) {
      console.log('monotonicity mismatch');
      throw error;
    }
  });
});

describe('channel B and C register decode', () => {
  it('decodes channel B from R2/R3, R9, and mixer bits 1 and 4', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x02, 0x56);
    ym.writeRegister(0x03, 0x0a);
    ym.writeRegister(0x07, 0x12); // tone B disabled (bit1), noise B disabled (bit4)
    ym.writeRegister(0x09, 0x1d);
    const state = ym.getState();
    try {
      expect(state.channels[1].tonePeriod).toBe(0xa56);
      expect(state.channels[1].toneEnabled).toBe(false);
      expect(state.channels[1].noiseEnabled).toBe(false);
      expect(state.channels[1].volume).toBe(0x0d);
      expect(state.channels[1].envelopeEnabled).toBe(true);
    } catch (error) {
      console.log('channel B', JSON.stringify(state.channels[1]));
      throw error;
    }
  });

  it('decodes channel C from R4/R5, R10, and mixer bits 2 and 5', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x04, 0x78);
    ym.writeRegister(0x05, 0x03);
    ym.writeRegister(0x07, 0x24); // tone C disabled (bit2), noise C disabled (bit5)
    ym.writeRegister(0x0a, 0x07);
    const state = ym.getState();
    try {
      expect(state.channels[2].tonePeriod).toBe(0x378);
      expect(state.channels[2].toneEnabled).toBe(false);
      expect(state.channels[2].noiseEnabled).toBe(false);
      expect(state.channels[2].volume).toBe(0x07);
      expect(state.channels[2].envelopeEnabled).toBe(false);
    } catch (error) {
      console.log('channel C', JSON.stringify(state.channels[2]));
      throw error;
    }
  });

  it('drives channel B and C oscillators and gains from their own registers', () => {
    const { context, createdOscillators, createdGains } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x02, 0x00);
    ym.writeRegister(0x03, 0x01);
    ym.writeRegister(0x04, 0x00);
    ym.writeRegister(0x05, 0x02);
    ym.writeRegister(0x07, 0x39); // tone A disabled, tone B/C enabled, all noise disabled
    ym.writeRegister(0x09, 0x0f);
    ym.writeRegister(0x0a, 0x08);
    try {
      expect(createdOscillators[1].frequency.value).toBeCloseTo(YM_CLOCK / (16 * 0x100), 3);
      expect(createdOscillators[2].frequency.value).toBeCloseTo(YM_CLOCK / (16 * 0x200), 3);
      expect(createdGains[3].gain.value).toBeCloseTo(YM_LOG_VOLUME_TABLE[15] * 0.3, 5);
      expect(createdGains[4].gain.value).toBeCloseTo(YM_LOG_VOLUME_TABLE[8] * 0.3, 5);
      expect(createdGains[2].gain.value).toBe(0);
    } catch (error) {
      console.log(
        'bc nodes',
        createdOscillators.map((o) => o.frequency.value),
        createdGains.map((g) => g.gain.value),
      );
      throw error;
    }
  });
});

describe('mixer register R7', () => {
  it('treats all six bits as active-low enables', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x07, 0x3f);
    let state = ym.getState();
    try {
      for (const channel of state.channels) {
        expect(channel.toneEnabled).toBe(false);
        expect(channel.noiseEnabled).toBe(false);
      }
    } catch (error) {
      console.log('all-off mixer', JSON.stringify(state));
      throw error;
    }
    ym.writeRegister(0x07, 0x00);
    state = ym.getState();
    for (const channel of state.channels) {
      expect(channel.toneEnabled).toBe(true);
      expect(channel.noiseEnabled).toBe(true);
    }
  });

  it('maps each tone and noise bit to its own channel', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x07, 0x15); // bits 0, 2, 4 set
    const state = ym.getState();
    try {
      expect(state.channels[0].toneEnabled).toBe(false);
      expect(state.channels[1].toneEnabled).toBe(true);
      expect(state.channels[2].toneEnabled).toBe(false);
      expect(state.channels[0].noiseEnabled).toBe(true);
      expect(state.channels[1].noiseEnabled).toBe(false);
      expect(state.channels[2].noiseEnabled).toBe(true);
    } catch (error) {
      console.log('mixer bits', JSON.stringify(state.channels));
      throw error;
    }
  });
});

describe('frequency clamps and silence rules', () => {
  it('clamps low frequencies to 20 Hz, reachable at a 1 MHz clock', () => {
    const { context, createdOscillators } = createAudioContextStub();
    const ym = new YM2149(context, 1_000_000);
    ym.writeRegister(0x00, 0xff);
    ym.writeRegister(0x01, 0x0f); // period 4095 -> 1e6/(16*4095) ~ 15.26 Hz
    ym.writeRegister(0x07, 0x3e);
    ym.writeRegister(0x08, 0x0f);
    try {
      expect(createdOscillators[0].frequency.value).toBe(20);
    } catch (error) {
      console.log('20hz clamp', createdOscillators[0].frequency.value);
      throw error;
    }
  });

  it('does not clamp the same period at the default 2 MHz clock', () => {
    const { context, createdOscillators } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x00, 0xff);
    ym.writeRegister(0x01, 0x0f);
    ym.writeRegister(0x07, 0x3e);
    ym.writeRegister(0x08, 0x0f);
    try {
      expect(createdOscillators[0].frequency.value).toBeCloseTo(YM_CLOCK / (16 * 4095), 3);
    } catch (error) {
      console.log('2mhz period', createdOscillators[0].frequency.value);
      throw error;
    }
  });

  it('stays silent with a zero period even when tone is enabled', () => {
    const { context, createdGains } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x07, 0x00); // everything enabled
    ym.writeRegister(0x08, 0x0f);
    try {
      expect(createdGains[2].gain.value).toBe(0);
    } catch (error) {
      console.log('zero period gain', createdGains[2].gain.value);
      throw error;
    }
  });

  it('stays silent when the mixer disables the channel tone', () => {
    const { context, createdGains } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x00, 0x1c);
    ym.writeRegister(0x01, 0x01);
    ym.writeRegister(0x07, 0x3f); // channel A tone disabled
    ym.writeRegister(0x08, 0x0f);
    try {
      expect(createdGains[2].gain.value).toBe(0);
    } catch (error) {
      console.log('mixer-off gain', createdGains[2].gain.value);
      throw error;
    }
  });
});

describe('register storage semantics', () => {
  it('masks the coarse period registers to the low nibble', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x00, 0x00);
    ym.writeRegister(0x01, 0xfa);
    try {
      expect(ym.getState().channels[0].tonePeriod).toBe(0xa00);
    } catch (error) {
      console.log('coarse mask', ym.getState().channels[0].tonePeriod);
      throw error;
    }
  });

  it('masks the noise period register R6 to five bits', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x06, 0xe5);
    try {
      expect(ym.getState().noisePeriod).toBe(0x05);
    } catch (error) {
      console.log('noise mask', ym.getState().noisePeriod);
      throw error;
    }
  });

  it('stores R11/R12 without consuming them in state or gains', () => {
    const { context, createdGains } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x07, 0x3f); // settle the decoded state before snapshotting
    const stateBefore = JSON.stringify(ym.getState());
    const gainsBefore = createdGains.map((g) => g.gain.value);
    ym.writeRegister(0x0b, 0x34);
    ym.writeRegister(0x0c, 0x05);
    try {
      expect(ym.getRegisters()[11]).toBe(0x34);
      expect(ym.getRegisters()[12]).toBe(0x05);
      // Hardware envelope period registers are stored but never decoded into
      // state, and the envelopeGainNode stays at its initial value.
      expect(JSON.stringify(ym.getState())).toBe(stateBefore);
      expect(createdGains.map((g) => g.gain.value)).toEqual(gainsBefore);
      expect(createdGains[1].gain.value).toBe(0);
    } catch (error) {
      console.log('r11r12', ym.getRegisters(), JSON.stringify(ym.getState()));
      throw error;
    }
  });

  it('returns a copy from getRegisters so callers cannot mutate internals', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x08, 0x0f);
    const snapshot = ym.getRegisters();
    snapshot[8] = 0x99;
    try {
      expect(ym.getRegisters()[8]).toBe(0x0f);
      expect(snapshot[8]).toBe(0x99);
    } catch (error) {
      console.log('register copy', ym.getRegisters());
      throw error;
    }
  });

  it('silenceAll zeroes only the volume registers', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x00, 0x1c);
    ym.writeRegister(0x01, 0x01);
    ym.writeRegister(0x06, 0x12);
    ym.writeRegister(0x07, 0x2a);
    ym.writeRegister(0x0d, 0x09);
    ym.writeRegister(0x08, 0x0f);
    ym.writeRegister(0x09, 0x0e);
    ym.writeRegister(0x0a, 0x0d);
    ym.silenceAll();
    const registers = ym.getRegisters();
    try {
      expect(registers[0]).toBe(0x1c);
      expect(registers[1]).toBe(0x01);
      expect(registers[6]).toBe(0x12);
      expect(registers[7]).toBe(0x2a);
      expect(registers[13]).toBe(0x09);
      expect(registers[8]).toBe(0);
      expect(registers[9]).toBe(0);
      expect(registers[10]).toBe(0);
    } catch (error) {
      console.log('silenceAll registers', registers);
      throw error;
    }
  });
});
