import { describe, it, expect } from 'vitest';
import {
  buildInstrumentColorMap,
  getInstrumentColorForNote,
} from '../../../src/utils/track/trackRendering.ts';
import type { Instrument } from '../../../src/synth/SoundDriver.ts';

const inst = (id: string, color: string | null = '#abc'): Instrument => ({
  id,
  name: '',
  color,
  volume: [15],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
});

describe('buildInstrumentColorMap', () => {
  it('keys colors by the canonical instrument id', () => {
    try {
      const map = buildInstrumentColorMap([inst('5'), inst('$0f'), inst('BASS')]);
      expect(map.get('05')).toBe('#abc');
      expect(map.get('0F')).toBe('#abc');
      // Non-hex ids pass through uppercased, matching the shared contract.
      expect(map.get('BASS')).toBe('#abc');
    } catch (error) {
      console.log('color-map key mismatch');
      throw error;
    }
  });
});

describe('getInstrumentColorForNote', () => {
  it('colors loose and canonical note ids against a loose instrument id', () => {
    try {
      const map = buildInstrumentColorMap([inst('5')]);
      expect(getInstrumentColorForNote({ note: 'C', octave: 4, instrument: '5' }, map)).toBe(
        '#abc',
      );
      expect(getInstrumentColorForNote({ note: 'C', octave: 4, instrument: '05' }, map)).toBe(
        '#abc',
      );
      expect(getInstrumentColorForNote({ note: 'C', octave: 4, instrument: '$05' }, map)).toBe(
        '#abc',
      );
      expect(getInstrumentColorForNote({ note: 'C', octave: 4, instrument: '0f' }, map)).toBeNull();
    } catch (error) {
      console.log('loose-color mismatch');
      throw error;
    }
  });

  it('still refuses to color a non-hex id', () => {
    try {
      const map = buildInstrumentColorMap([inst('BASS')]);
      expect(
        getInstrumentColorForNote({ note: 'C', octave: 4, instrument: 'BASS' }, map),
      ).toBeNull();
      expect(
        getInstrumentColorForNote({ note: 'C', octave: 4, instrument: 'bass' }, map),
      ).toBeNull();
    } catch (error) {
      console.log('non-hex color mismatch');
      throw error;
    }
  });

  it('returns null for note-off and missing notes', () => {
    const map = buildInstrumentColorMap([inst('05')]);
    expect(getInstrumentColorForNote(null, map)).toBeNull();
    expect(getInstrumentColorForNote({ note: '===', octave: 0, instrument: '05' }, map)).toBeNull();
  });
});
