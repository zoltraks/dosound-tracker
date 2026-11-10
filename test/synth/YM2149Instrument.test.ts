import { describe, it, expect, vi } from 'vitest';
import { YM2149 } from '../../src/synth/YM2149.ts';
import type { Instrument } from '../../src/synth/SoundDriver.ts';

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

const readPeriod = (ym: YM2149, channel: number): number => {
  const registers = ym.getRegisters();
  const fine = registers[channel * 2];
  const coarse = registers[channel * 2 + 1];
  return ((coarse & 0x0f) << 8) | fine;
};

describe('updateChannelWithInstrument shift envelope', () => {
  it('scales the frequency by 2^(shift/12) semitones', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    const note = { note: 'A', octave: 4 };
    ym.updateChannelWithInstrument(0, makeInstrument({ shift: [12] }), note);
    const upOctave = readPeriod(ym, 0);
    ym.updateChannelWithInstrument(0, makeInstrument({ shift: [-12] }), note);
    const downOctave = readPeriod(ym, 0);
    try {
      // 440 Hz -> 284, 880 Hz -> 142, 220 Hz -> 568 at 2 MHz.
      expect(upOctave).toBe(142);
      expect(downOctave).toBe(568);
    } catch (error) {
      console.log('shift periods', upOctave, downOctave);
      throw error;
    }
  });

  it('clamps the envelope tick into the defined shift range', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    const note = { note: 'A', octave: 4 };
    ym.updateChannelWithInstrument(0, makeInstrument({ shift: [0, 12] }), note, 5);
    const clampedHigh = readPeriod(ym, 0);
    ym.updateChannelWithInstrument(0, makeInstrument({ shift: [0, 12] }), note, -3);
    const clampedLow = readPeriod(ym, 0);
    try {
      expect(clampedHigh).toBe(142); // tick beyond the end uses the last step
      expect(clampedLow).toBe(284); // negative tick uses step 0
    } catch (error) {
      console.log('tick clamps', clampedHigh, clampedLow);
      throw error;
    }
  });
});

describe('updateChannelWithInstrument period clamps', () => {
  it('clamps an out-of-range computed period to 4095', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    // C-0 at 2 MHz: 16.35 Hz -> divider 7644, above the 12-bit maximum.
    ym.updateChannelWithInstrument(0, makeInstrument(), { note: 'C', octave: 0 });
    try {
      expect(readPeriod(ym, 0)).toBe(4095);
    } catch (error) {
      console.log('low clamp', readPeriod(ym, 0));
      throw error;
    }
  });

  it('clamps a period pushed out of range by the pitch envelope', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    const note = { note: 'A', octave: 4 };
    ym.updateChannelWithInstrument(0, makeInstrument({ pitch: [-5000] }), note);
    const tooLarge = readPeriod(ym, 0);
    ym.updateChannelWithInstrument(0, makeInstrument({ pitch: [5000] }), note);
    const tooSmall = readPeriod(ym, 0);
    try {
      expect(tooLarge).toBe(4095); // 284 + 5000 >= 4096
      expect(tooSmall).toBe(4095); // 284 - 5000 <= 0
    } catch (error) {
      console.log('pitch clamps', tooLarge, tooSmall);
      throw error;
    }
  });
});

describe('updateChannelWithInstrument volume handling', () => {
  it('silences the channel when note data is missing', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.writeRegister(0x08, 0x0f);
    ym.updateChannelWithInstrument(0, makeInstrument());
    try {
      expect(ym.getRegisters()[8]).toBe(0);
    } catch (error) {
      console.log('missing noteData', ym.getRegisters()[8]);
      throw error;
    }
  });

  it('applies the volume modifier with 0 silencing and 15 identity', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    const note = { note: 'A', octave: 4 };
    ym.updateChannelWithInstrument(0, makeInstrument({ volume: [9] }), note, 0, 15);
    const identity = ym.getRegisters()[8];
    ym.updateChannelWithInstrument(0, makeInstrument({ volume: [9] }), note, 0, 7);
    const attenuated = ym.getRegisters()[8];
    ym.updateChannelWithInstrument(0, makeInstrument({ volume: [9] }), note, 0, 0);
    const silenced = ym.getRegisters()[8];
    try {
      expect(identity).toBe(9);
      expect(attenuated).toBe(4); // floor(9 * 7 / 15)
      expect(silenced).toBe(0);
    } catch (error) {
      console.log('modifiers', identity, attenuated, silenced);
      throw error;
    }
  });

  it('clamps the envelope tick when reading the volume envelope', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    const note = { note: 'A', octave: 4 };
    ym.updateChannelWithInstrument(0, makeInstrument({ volume: [12, 5] }), note, 40);
    const high = ym.getRegisters()[8];
    ym.updateChannelWithInstrument(0, makeInstrument({ volume: [12, 5] }), note, -2);
    const low = ym.getRegisters()[8];
    try {
      expect(high).toBe(5); // last step for a tick beyond the envelope
      expect(low).toBe(12); // step 0 for a negative tick
    } catch (error) {
      console.log('volume tick clamps', high, low);
      throw error;
    }
  });

  it('writes volume but no period for an unknown note name', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.updateChannelWithInstrument(0, makeInstrument({ volume: [11] }), {
      note: 'X',
      octave: 4,
    });
    try {
      expect(readPeriod(ym, 0)).toBe(0);
      expect(ym.getRegisters()[8]).toBe(11);
    } catch (error) {
      console.log('unknown note', readPeriod(ym, 0), ym.getRegisters()[8]);
      throw error;
    }
  });
});

describe('updateChannelWithInstrument noise envelope', () => {
  it('writes R6 only while the mode marks noise active', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    const note = { note: 'A', octave: 4 };
    ym.updateChannelWithInstrument(0, makeInstrument({ mode: [0], noise: [20] }), note);
    const afterToneOnly = ym.getRegisters()[6];
    ym.updateChannelWithInstrument(0, makeInstrument({ mode: [1], noise: [20] }), note);
    const afterNoiseOnly = ym.getRegisters()[6];
    try {
      expect(afterToneOnly).toBe(0);
      expect(afterNoiseOnly).toBe(20);
    } catch (error) {
      console.log('noise envelope gating', afterToneOnly, afterNoiseOnly);
      throw error;
    }
  });

  it('applies both tone and noise when the mode combines them', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    const note = { note: 'A', octave: 4 };
    ym.updateChannelWithInstrument(0, makeInstrument({ mode: [2], noise: [7] }), note);
    const registers = ym.getRegisters();
    try {
      expect(readPeriod(ym, 0)).toBe(284); // tone still programmed
      expect(registers[6]).toBe(7); // noise envelope applied
      expect(registers[7] & 0x09).toBe(0); // tone A and noise A both enabled
    } catch (error) {
      console.log('combined mode', registers);
      throw error;
    }
  });

  it('leaves the period registers untouched in noise-only mode', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.updateChannelWithInstrument(0, makeInstrument({ mode: [1], noise: [9] }), {
      note: 'A',
      octave: 4,
    });
    try {
      expect(readPeriod(ym, 0)).toBe(0);
      expect(ym.getRegisters()[8]).toBe(0x0f);
      expect(ym.getRegisters()[6]).toBe(9);
    } catch (error) {
      console.log('noise only', readPeriod(ym, 0), ym.getRegisters());
      throw error;
    }
  });
});

describe('updateChannelWithInstrument clock dependence', () => {
  it('halves the A-4 period to 142 at a 1 MHz clock', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context, 1_000_000);
    ym.updateChannelWithInstrument(0, makeInstrument(), { note: 'A', octave: 4 });
    try {
      expect(readPeriod(ym, 0)).toBe(142);
    } catch (error) {
      console.log('1mhz period', readPeriod(ym, 0));
      throw error;
    }
  });

  it('routes channel C writes to R4/R5/R10', () => {
    const { context } = createAudioContextStub();
    const ym = new YM2149(context);
    ym.updateChannelWithInstrument(2, makeInstrument({ volume: [10] }), {
      note: 'A',
      octave: 4,
    });
    try {
      expect(readPeriod(ym, 2)).toBe(284);
      expect(ym.getRegisters()[10]).toBe(10);
      expect(ym.getRegisters()[8]).toBe(0);
    } catch (error) {
      console.log('channel C routing', ym.getRegisters());
      throw error;
    }
  });
});
