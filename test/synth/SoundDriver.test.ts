import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  SoundDriver,
  DOSOUND_REGISTER_WRITE,
  DOSOUND_END_MARKER,
  VBLANK_RATE,
  MIN_DELAY_CYCLES,
  type Song,
  type Instrument,
  type Pattern,
} from '../../src/synth/SoundDriver.ts';
import type { YM2149 } from '../../src/synth/YM2149.ts';

const createYm2149 = (clock = 2_000_000) => {
  return {
    writeRegister: vi.fn(),
    getClock: vi.fn(() => clock),
  };
};

const baseInstrument: Instrument = {
  id: '00',
  name: 'Inst',
  volume: [0x0f],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
};

const makePattern = (id: string, step: Pattern['step']): Pattern => ({
  id,
  name: `Pattern ${id}`,
  step,
});

const createSong = (overrides: Partial<Song> = {}): Song => ({
  title: 'T',
  author: 'A',
  year: 2025,
  speed: 6,
  length: 2,
  pattern: [
    makePattern('00', [
      { note: null, volume: null },
      { note: null, volume: null },
    ]),
  ],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [baseInstrument],
  ...overrides,
});

describe('SoundDriver constants', () => {
  it('exposes the DOSOUND protocol values', () => {
    try {
      expect(DOSOUND_REGISTER_WRITE).toBe(0xff);
      expect(DOSOUND_END_MARKER).toBe(0x00);
      expect(VBLANK_RATE).toBe(50);
      expect(MIN_DELAY_CYCLES).toBe(2);
    } catch (error) {
      console.log('constants mismatch');
      throw error;
    }
  });
});

describe('setPlaybackSpeed', () => {
  it.each([
    [6, 6],
    [5, 6],
    [7, 8],
    [2, 2],
    [1, 2],
    [0, 2],
    [-4, 2],
    [Number.NaN, 2],
    [4.9, 4],
  ])('maps speed %s to delay %s', (input, expected) => {
    const driver = new SoundDriver(createYm2149() as unknown as YM2149);
    driver.setPlaybackSpeed(input);
    const events = driver.convertSongToSoundEvents(createSong());
    const firstDelay = events.find((e) => e.type === 'delay');
    try {
      expect(firstDelay?.delay).toBe(expected);
    } catch (error) {
      console.log('speed', input, events.slice(0, 4));
      throw error;
    }
  });
});

describe('convertSongToSoundEvents', () => {
  it('emits silences and the end marker after the playlist', () => {
    const driver = new SoundDriver(createYm2149() as unknown as YM2149);
    const events = driver.convertSongToSoundEvents(createSong());
    const tail = events.slice(-4);
    try {
      expect(tail[0]).toEqual({ type: 'register', register: 0x08, value: 0x00 });
      expect(tail[1]).toEqual({ type: 'register', register: 0x09, value: 0x00 });
      expect(tail[2]).toEqual({ type: 'register', register: 0x0a, value: 0x00 });
      expect(tail[3]).toEqual({ type: 'delay', delay: DOSOUND_END_MARKER });
    } catch (error) {
      console.log('tail', tail);
      throw error;
    }
  });

  it('emits volume-zero rows for empty steps', () => {
    const driver = new SoundDriver(createYm2149() as unknown as YM2149);
    const events = driver.convertSongToSoundEvents(createSong());
    try {
      expect(events[0]).toEqual({ type: 'register', register: 0x08, value: 0x00 });
      expect(events[1]).toEqual({ type: 'delay', delay: 6 });
    } catch (error) {
      console.log('events', events.slice(0, 4));
      throw error;
    }
  });

  it('emits tone period registers and volume for a note', () => {
    const song = createSong({
      pattern: [
        makePattern('00', [
          { note: { note: 'A', octave: 4, instrument: '00' }, volume: 0x0c },
          { note: null, volume: null },
        ]),
      ],
    });
    const driver = new SoundDriver(createYm2149() as unknown as YM2149);
    const events = driver.convertSongToSoundEvents(song);
    try {
      // A4 = 440 Hz; 2 MHz / (16 * 440) = 284.09 -> 284 = 0x11c
      expect(events[0]).toEqual({ type: 'register', register: 0x00, value: 0x1c });
      expect(events[1]).toEqual({ type: 'register', register: 0x01, value: 0x01 });
      expect(events[2]).toEqual({ type: 'register', register: 0x08, value: 0x0c });
    } catch (error) {
      console.log('events', events.slice(0, 5));
      throw error;
    }
  });

  it('halves the tone period at 1 MHz clock', () => {
    const song = createSong({
      pattern: [
        makePattern('00', [
          { note: { note: 'A', octave: 4, instrument: '00' }, volume: null },
          { note: null, volume: null },
        ]),
      ],
    });
    const driver = new SoundDriver(createYm2149(1_000_000) as unknown as YM2149);
    const events = driver.convertSongToSoundEvents(song);
    try {
      expect(events[0]).toEqual({ type: 'register', register: 0x00, value: 142 & 0xff });
      expect(events[1]).toEqual({ type: 'register', register: 0x01, value: 142 >> 8 });
    } catch (error) {
      console.log('events', events.slice(0, 4));
      throw error;
    }
  });

  it('routes channels B and C to their own registers', () => {
    const song = createSong({
      line: [{ A: '--', B: '00', C: '01' }],
      pattern: [
        makePattern('00', [{ note: { note: 'C', octave: 4, instrument: '00' }, volume: 0x0f }]),
        makePattern('01', [{ note: { note: 'D', octave: 4, instrument: '00' }, volume: 0x0e }]),
      ],
    });
    const driver = new SoundDriver(createYm2149() as unknown as YM2149);
    const events = driver.convertSongToSoundEvents(song);
    const channelB = events.find((e) => e.type === 'register' && e.register === 0x09);
    const channelC = events.find((e) => e.type === 'register' && e.register === 0x0a);
    try {
      expect(channelB?.value).toBe(0x0f);
      expect(channelC?.value).toBe(0x0e);
    } catch (error) {
      console.log('events', events);
      throw error;
    }
  });

  it('skips unknown pattern ids and note-off steps', () => {
    const song = createSong({
      line: [
        { A: 'FF', B: '--', C: '--' },
        { A: '00', B: '--', C: '--' },
      ],
      pattern: [
        makePattern('00', [{ note: { note: '===', octave: 0, instrument: '00' }, volume: null }]),
      ],
    });
    const driver = new SoundDriver(createYm2149() as unknown as YM2149);
    const events = driver.convertSongToSoundEvents(song);
    const registers = events.filter((e) => e.type === 'register');
    try {
      // '===' produces a volume-zero write, never a tone write
      expect(registers.every((e) => (e.register ?? 0) >= 0x08)).toBe(true);
      expect(registers[0]).toEqual({ type: 'register', register: 0x08, value: 0x00 });
    } catch (error) {
      console.log('registers', registers);
      throw error;
    }
  });

  it('removes redundant register writes via the optimizer', () => {
    const song = createSong({
      pattern: [
        makePattern('00', [
          { note: { note: 'C', octave: 4, instrument: '00' }, volume: 0x0f },
          { note: { note: 'C', octave: 4, instrument: '00' }, volume: 0x0f },
        ]),
      ],
    });
    const driver = new SoundDriver(createYm2149() as unknown as YM2149);
    const events = driver.convertSongToSoundEvents(song);
    const volumeWrites = events.filter((e) => e.type === 'register' && e.register === 0x08);
    try {
      // second identical VA write inside one run is removed before the delay
      expect(volumeWrites.length).toBeLessThan(4);
    } catch (error) {
      console.log('volumeWrites', volumeWrites);
      throw error;
    }
  });
});

describe('exportToAssembly', () => {
  it('emits dc.b lines with register names and delay comments', () => {
    const driver = new SoundDriver(createYm2149() as unknown as YM2149);
    const asm = driver.exportToAssembly([
      { type: 'register', register: 0x08, value: 0x0c },
      { type: 'delay', delay: 2 },
      { type: 'register', register: 0x40, value: 0x01 },
    ]);
    try {
      expect(asm).toContain('music:');
      expect(asm).toContain('dc.b $08,$0c');
      expect(asm).toContain('; VA');
      expect(asm).toContain('dc.b $ff,2       ; DL 4');
      expect(asm).toContain('dc.b $40,$01');
    } catch (error) {
      console.log(asm);
      throw error;
    }
  });

  it('inserts a blank line every eight events', () => {
    const driver = new SoundDriver(createYm2149() as unknown as YM2149);
    const asm = driver.exportToAssembly(
      Array.from({ length: 8 }, () => ({ type: 'register', register: 0x08, value: 0x0f }) as const),
    );
    try {
      expect(asm.endsWith('; VA\n\n')).toBe(true);
    } catch (error) {
      console.log(JSON.stringify(asm));
      throw error;
    }
  });
});

describe('playEvents and stop', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes register events immediately and stops on the end marker', () => {
    vi.useFakeTimers();
    const ym2149 = createYm2149();
    const driver = new SoundDriver(ym2149 as unknown as YM2149);
    driver.playEvents([
      { type: 'register', register: 0x08, value: 0x0c },
      { type: 'delay', delay: DOSOUND_END_MARKER },
    ]);
    try {
      expect(ym2149.writeRegister).toHaveBeenCalledWith(0x08, 0x0c);
      expect(driver.isCurrentlyPlaying()).toBe(false);
    } catch (error) {
      console.log('calls', ym2149.writeRegister.mock.calls);
      throw error;
    }
  });

  it('advances through delays on the VBLANK schedule', () => {
    vi.useFakeTimers();
    const ym2149 = createYm2149();
    const driver = new SoundDriver(ym2149 as unknown as YM2149);
    driver.playEvents([
      { type: 'register', register: 0x08, value: 0x0c },
      { type: 'delay', delay: 2 },
      { type: 'register', register: 0x08, value: 0x00 },
      { type: 'delay', delay: DOSOUND_END_MARKER },
    ]);
    try {
      expect(driver.isCurrentlyPlaying()).toBe(true);
      vi.advanceTimersByTime((2 * 1000) / VBLANK_RATE);
      expect(ym2149.writeRegister).toHaveBeenLastCalledWith(0x08, 0x00);
      expect(driver.isCurrentlyPlaying()).toBe(false);
    } catch (error) {
      console.log('calls', ym2149.writeRegister.mock.calls);
      throw error;
    }
  });

  it('stop silences all channels', () => {
    const ym2149 = createYm2149();
    const driver = new SoundDriver(ym2149 as unknown as YM2149);
    driver.stop();
    try {
      expect(ym2149.writeRegister).toHaveBeenCalledWith(0x08, 0x00);
      expect(ym2149.writeRegister).toHaveBeenCalledWith(0x09, 0x00);
      expect(ym2149.writeRegister).toHaveBeenCalledWith(0x0a, 0x00);
    } catch (error) {
      console.log('calls', ym2149.writeRegister.mock.calls);
      throw error;
    }
  });
});
