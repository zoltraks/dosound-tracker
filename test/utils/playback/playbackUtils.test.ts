import { describe, it, expect, vi } from 'vitest';
import { updateChannelWithInstrument } from '../../../src/utils/playback/playbackUtils.ts';
import type { YM2149 } from '../../../src/synth/YM2149.ts';
import type { Instrument } from '../../../src/synth/SoundDriver.ts';

const createYm = () =>
  ({
    writeRegister: vi.fn(),
    updateChannelWithInstrument: vi.fn(),
  }) as unknown as YM2149;

const inst = (id: string): Instrument => ({
  id,
  name: '',
  volume: [15],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
});

const byId = (...instruments: Instrument[]) =>
  new Map(instruments.map((i) => [i.id.toUpperCase(), i]));

describe('updateChannelWithInstrument', () => {
  it('delegates to the chip with the resolved instrument', () => {
    const ym = createYm();
    const instrument = inst('01');
    updateChannelWithInstrument(
      ym,
      1,
      { note: 'C', octave: 4, instrument: '01' },
      byId(instrument),
      null,
      undefined,
      3,
      12,
    );
    try {
      expect(ym.updateChannelWithInstrument).toHaveBeenCalledWith(
        1,
        instrument,
        {
          note: 'C',
          octave: 4,
        },
        3,
        12,
      );
    } catch (error) {
      console.log(
        'delegate mismatch',
        (ym.updateChannelWithInstrument as ReturnType<typeof vi.fn>).mock.calls,
      );
      throw error;
    }
  });

  it('silences the channel when the note is a release', () => {
    const ym = createYm();
    updateChannelWithInstrument(
      ym,
      2,
      { note: '===', octave: 0, instrument: '01' },
      byId(inst('01')),
      null,
      undefined,
    );
    try {
      expect(ym.writeRegister).toHaveBeenCalledWith(0x0a, 0x00);
      expect(ym.updateChannelWithInstrument).not.toHaveBeenCalled();
    } catch (error) {
      console.log('release mismatch');
      throw error;
    }
  });

  it('silences the channel when the instrument id resolves to nothing', () => {
    const ym = createYm();
    updateChannelWithInstrument(
      ym,
      0,
      { note: 'C', octave: 4, instrument: '09' },
      byId(inst('01')),
      null,
      undefined,
    );
    try {
      expect(ym.writeRegister).toHaveBeenCalledWith(0x08, 0x00);
    } catch (error) {
      console.log('unresolved mismatch');
      throw error;
    }
  });

  it('falls back to the current instrument when the note carries none', () => {
    const ym = createYm();
    const current = inst('02');
    updateChannelWithInstrument(
      ym,
      0,
      { note: 'D', octave: 5, instrument: '' },
      byId(current),
      current,
      undefined,
      0,
    );
    try {
      expect(ym.updateChannelWithInstrument).toHaveBeenCalledWith(
        0,
        current,
        { note: 'D', octave: 5 },
        0,
        undefined,
      );
    } catch (error) {
      console.log(
        'fallback mismatch',
        (ym.updateChannelWithInstrument as ReturnType<typeof vi.fn>).mock.calls,
      );
      throw error;
    }
  });

  it('falls back to the first instrument when no current instrument exists', () => {
    const ym = createYm();
    const first = inst('00');
    updateChannelWithInstrument(
      ym,
      0,
      { note: 'E', octave: 4, instrument: '' },
      byId(first),
      null,
      first,
    );
    try {
      expect(ym.updateChannelWithInstrument).toHaveBeenCalledWith(
        0,
        first,
        { note: 'E', octave: 4 },
        0,
        undefined,
      );
    } catch (error) {
      console.log('first-fallback mismatch');
      throw error;
    }
  });

  it('silences the channel for a null note', () => {
    const ym = createYm();
    updateChannelWithInstrument(ym, 1, null, byId(inst('01')), null, undefined);
    try {
      expect(ym.writeRegister).toHaveBeenCalledWith(0x09, 0x00);
    } catch (error) {
      console.log('null-note mismatch');
      throw error;
    }
  });
});
