import { describe, it, expect, vi } from 'vitest';
import { YM2149, YM_CLOCK, YM_LOG_VOLUME_TABLE } from '../../src/synth/YM2149';
import type { Instrument } from '../../src/synth/SoundDriver';

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

const makeInstrument = (overrides: Partial<Instrument> = {}): Instrument => ({
  id: '00',
  name: 'inst',
  volume: [0x0f],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
  ...overrides,
});

describe('YM2149 construction', () => {
  it('creates three oscillators wired through gain nodes', () => {
    const { context, createdOscillators, createdGains } = createAudioContextStub();
    new YM2149(context);
    try {
      expect(createdOscillators).toHaveLength(3);
      expect(createdGains.length).toBeGreaterThanOrEqual(5);
      expect(createdOscillators[0].start).toHaveBeenCalled();
    } catch (error) {
      console.log('construction mismatch');
      throw error;
    }
  });

  it('defaults to the 2 MHz clock and honors setClock/getClock', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    try {
      expect(ym.getClock()).toBe(YM_CLOCK);
      ym.setClock(1_000_000);
      expect(ym.getClock()).toBe(1_000_000);
    } catch (error) {
      console.log('clock mismatch');
      throw error;
    }
  });
});

describe('register writes and state', () => {
  it('decodes tone period, mixer, volume, and envelope bits', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x00, 0x34);
    ym.writeRegister(0x01, 0x02);
    ym.writeRegister(0x07, 0x3e);
    ym.writeRegister(0x08, 0x1c);
    ym.writeRegister(0x06, 0x1f);
    ym.writeRegister(0x0d, 0x19);
    const state = ym.getState();
    try {
      expect(state.channels[0].tonePeriod).toBe(0x234);
      expect(state.channels[0].toneEnabled).toBe(true);
      expect(state.channels[0].noiseEnabled).toBe(false);
      expect(state.channels[0].volume).toBe(0x0c);
      expect(state.channels[0].envelopeEnabled).toBe(true);
      expect(state.noisePeriod).toBe(0x1f);
      expect(state.envelopeShape).toBe(0x09);
      expect(state.envelopeEnabled).toBe(true);
    } catch (error) {
      console.log('state', JSON.stringify(state));
      throw error;
    }
  });

  it('ignores out-of-range registers and masks values to a byte', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(-1, 5);
    ym.writeRegister(16, 5);
    ym.writeRegister(0x08, 0x1ff);
    try {
      expect(ym.getRegisters()[8]).toBe(0xff);
      expect(ym.getRegistersArray()).toHaveLength(16);
    } catch (error) {
      console.log('registers', ym.getRegisters());
      throw error;
    }
  });

  it('skips redundant identical writes', () => {
    const { context, createdGains } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x08, 0x0f);
    const callsBefore = createdGains.reduce((sum, g) => sum + g.gain.value, 0);
    ym.writeRegister(0x08, 0x0f);
    try {
      expect(createdGains.reduce((sum, g) => sum + g.gain.value, 0)).toBe(callsBefore);
    } catch (error) {
      console.log('redundant write mismatch');
      throw error;
    }
  });
});

describe('batching', () => {
  it('defers node updates until endBatch', () => {
    const { context, createdOscillators } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.beginBatch();
    ym.writeRegister(0x00, 0x1c);
    ym.writeRegister(0x01, 0x01);
    ym.writeRegister(0x07, 0x38);
    ym.writeRegister(0x08, 0x0f);
    const freqBefore = createdOscillators[0].frequency.value;
    ym.endBatch();
    try {
      expect(freqBefore).not.toBe(createdOscillators[0].frequency.value);
      expect(createdOscillators[0].frequency.value).toBeCloseTo(YM_CLOCK / (16 * 0x11c), 3);
    } catch (error) {
      console.log('freq', createdOscillators[0].frequency.value);
      throw error;
    }
  });

  it('nested batches apply a single update on the outermost end', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.beginBatch();
    ym.beginBatch();
    ym.writeRegister(0x08, 0x0f);
    ym.endBatch();
    ym.writeRegister(0x08, 0x0e);
    ym.endBatch();
    try {
      expect(ym.getState().channels[0].volume).toBe(0x0e);
    } catch (error) {
      console.log('nested batch mismatch');
      throw error;
    }
  });
});

describe('audio node updates', () => {
  it('drives oscillator frequency and logarithmic volume for an enabled channel', () => {
    const { context, createdOscillators, createdGains } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x00, 0x1c);
    ym.writeRegister(0x01, 0x01);
    ym.writeRegister(0x07, 0x3e);
    ym.writeRegister(0x08, 0x0f);
    try {
      expect(createdOscillators[0].frequency.value).toBeCloseTo(YM_CLOCK / (16 * 0x11c), 3);
      expect(createdGains[2].gain.value).toBeCloseTo(YM_LOG_VOLUME_TABLE[15] * 0.3, 5);
    } catch (error) {
      console.log('nodes', createdOscillators[0].frequency.value, createdGains[2].gain.value);
      throw error;
    }
  });

  it('silences a channel at volume zero', () => {
    const { context, createdGains } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x00, 0x1c);
    ym.writeRegister(0x07, 0x3e);
    ym.writeRegister(0x08, 0x00);
    try {
      expect(createdGains[2].gain.value).toBe(0);
    } catch (error) {
      console.log('gain', createdGains[2].gain.value);
      throw error;
    }
  });

  it('clamps computed frequency into the audible range', () => {
    const { context, createdOscillators } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x00, 0x01);
    ym.writeRegister(0x01, 0x00);
    ym.writeRegister(0x07, 0x3e);
    ym.writeRegister(0x08, 0x0f);
    try {
      expect(createdOscillators[0].frequency.value).toBe(20000);
    } catch (error) {
      console.log('freq', createdOscillators[0].frequency.value);
      throw error;
    }
  });

  it('silenceAll zeroes volume registers and gates every gain', () => {
    const { context, createdGains } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x08, 0x0f);
    ym.writeRegister(0x09, 0x0f);
    ym.writeRegister(0x0a, 0x0f);
    ym.silenceAll();
    try {
      expect(ym.getRegisters()[8]).toBe(0);
      expect(ym.getRegisters()[9]).toBe(0);
      expect(ym.getRegisters()[10]).toBe(0);
      expect(createdGains.every((g) => g.gain.value === 0)).toBe(true);
    } catch (error) {
      console.log(
        'gains',
        createdGains.map((g) => g.gain.value),
      );
      throw error;
    }
  });

  it('reset clears the register file', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x08, 0x0f);
    ym.reset();
    try {
      expect(ym.getRegistersArray().every((v) => v === 0)).toBe(true);
    } catch (error) {
      console.log('registers', ym.getRegistersArray());
      throw error;
    }
  });
});

describe('noise generation', () => {
  it('creates a noise buffer through the 17-bit LFSR', () => {
    const { context, buffers } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x06, 0x10);
    ym.writeRegister(0x07, 0x07);
    ym.writeRegister(0x08, 0x0f);
    ym.writeRegister(0x06, 0x05);
    try {
      expect(buffers.length).toBeGreaterThanOrEqual(2);
      const data = buffers[0].data;
      const hasOnes = Array.from(data.slice(0, 100)).some((v) => v === 1);
      const hasMinus = Array.from(data.slice(0, 100)).some((v) => v === -1);
      expect(hasOnes || hasMinus).toBe(true);
    } catch (error) {
      console.log('buffers', buffers.length);
      throw error;
    }
  });

  it('boosts the noise gain when a channel plays noise', () => {
    const { context, createdGains } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x06, 0x10);
    ym.writeRegister(0x07, 0x37);
    ym.writeRegister(0x08, 0x0f);
    try {
      expect(createdGains[0].gain.value).toBeGreaterThan(0);
    } catch (error) {
      console.log('noise gain', createdGains[0].gain.value);
      throw error;
    }
  });
});

describe('instrument helpers', () => {
  it('maps mode envelope values to tone and noise activity', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    const instrument = makeInstrument({ mode: [0, 1, 2] });
    try {
      expect(ym.getToneNoiseState(instrument, 0)).toEqual({
        modeValue: 0,
        toneActive: true,
        noiseActive: false,
      });
      expect(ym.getToneNoiseState(instrument, 1)).toEqual({
        modeValue: 1,
        toneActive: false,
        noiseActive: true,
      });
      expect(ym.getToneNoiseState(instrument, 2)).toEqual({
        modeValue: 2,
        toneActive: true,
        noiseActive: true,
      });
      expect(ym.getToneNoiseState(instrument, 99).modeValue).toBe(2);
    } catch (error) {
      console.log('mode mismatch');
      throw error;
    }
  });

  it('returns the default mode value when no mode envelope exists', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    try {
      expect(ym.getModeValueForTick(makeInstrument({ mode: [] }), 3)).toBe(0);
    } catch (error) {
      console.log('default mode mismatch');
      throw error;
    }
  });

  it('applies the noise envelope or the mid-range default', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.applyNoiseEnvelopeValue(makeInstrument({ noise: [5, 9] }), 1);
    try {
      expect(ym.getRegisters()[6]).toBe(9);
    } catch (error) {
      console.log('noise env mismatch');
      throw error;
    }
    ym.applyNoiseEnvelopeValue(makeInstrument({ noise: [] }), 0);
    expect(ym.getRegisters()[6]).toBe(15);
    ym.applyNoiseEnvelopeValue(makeInstrument({ noise: [99] }), 0);
    expect(ym.getRegisters()[6]).toBe(31);
  });

  it('updateMixerForChannel toggles tone and noise bits per channel', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x07, 0x3f);
    ym.updateMixerForChannel(0, true, false);
    try {
      expect(ym.getRegisters()[7] & 0x01).toBe(0);
      expect(ym.getRegisters()[7] & 0x08).toBe(0x08);
    } catch (error) {
      console.log('mixer', ym.getRegisters()[7].toString(2));
      throw error;
    }
    ym.updateMixerForChannel(1, false, true);
    expect(ym.getRegisters()[7] & 0x02).toBe(0x02);
    expect(ym.getRegisters()[7] & 0x10).toBe(0);
  });
});

describe('updateChannelWithInstrument', () => {
  it('silences the channel on note-off', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x08, 0x0f);
    ym.updateChannelWithInstrument(0, makeInstrument(), { note: '===', octave: 0 });
    try {
      expect(ym.getRegisters()[8]).toBe(0);
    } catch (error) {
      console.log('note-off mismatch');
      throw error;
    }
  });

  it('computes the tone period for a C-4 note at 2 MHz', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.updateChannelWithInstrument(0, makeInstrument(), { note: 'C', octave: 4 });
    const fine = ym.getRegisters()[0];
    const coarse = ym.getRegisters()[1];
    const period = ((coarse & 0x0f) << 8) | fine;
    try {
      expect(period).toBeGreaterThan(0);
      expect(period).toBeLessThanOrEqual(4095);
      expect(ym.getRegisters()[8]).toBe(0x0f);
    } catch (error) {
      console.log('period', period);
      throw error;
    }
  });

  it('applies shift and pitch envelope deltas to the period', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    const plain = makeInstrument();
    ym.updateChannelWithInstrument(0, plain, { note: 'A', octave: 4 });
    const basePeriod = ((ym.getRegisters()[1] & 0x0f) << 8) | ym.getRegisters()[0];
    ym.updateChannelWithInstrument(0, makeInstrument({ pitch: [10] }), {
      note: 'A',
      octave: 4,
    });
    const shifted = ((ym.getRegisters()[1] & 0x0f) << 8) | ym.getRegisters()[0];
    try {
      expect(basePeriod).toBe(284);
      expect(shifted).toBe(basePeriod - 10);
    } catch (error) {
      console.log('periods', basePeriod, shifted);
      throw error;
    }
  });

  it('applies the volume modifier as attenuation', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    const note = { note: 'A', octave: 4 };
    ym.updateChannelWithInstrument(0, makeInstrument({ volume: [15] }), note, 0, 0);
    try {
      expect(ym.getRegisters()[8]).toBe(0);
    } catch (error) {
      console.log('modifier mismatch');
      throw error;
    }
    ym.updateChannelWithInstrument(0, makeInstrument({ volume: [15] }), note, 0, 15);
    expect(ym.getRegisters()[8]).toBe(15);
  });
});

describe('dispose', () => {
  it('stops every oscillator and the noise source', () => {
    const { context, createdOscillators } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x06, 0x10);
    ym.writeRegister(0x07, 0x37);
    ym.writeRegister(0x08, 0x0f);
    ym.dispose();
    try {
      expect(createdOscillators.every((o) => o.stop.mock.calls.length >= 1)).toBe(true);
    } catch (error) {
      console.log('dispose mismatch');
      throw error;
    }
  });
});
