// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  buildInstrumentColorMap,
  buildTrackRowAnnouncement,
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

describe('buildTrackRowAnnouncement', () => {
  it('announces a note row with column context', () => {
    const text = buildTrackRowAnnouncement(
      'A',
      10,
      'note',
      { note: 'C', octave: 4, instrument: '00' },
      15,
    );
    try {
      expect(text).toBe('Track A row 0A, note column, C-4 instrument 00, volume 0F');
    } catch (error) {
      console.log('announcement:', text);
      throw error;
    }
  });

  it('leads with the volume cell when the volume column is active', () => {
    const text = buildTrackRowAnnouncement(
      'B',
      3,
      'volume',
      { note: 'G', octave: 2, instrument: '0B' },
      7,
    );
    try {
      expect(text).toBe('Track B row 03, volume column, volume 07, G-2 instrument 0B');
    } catch (error) {
      console.log('announcement:', text);
      throw error;
    }
  });

  it('announces note-off and empty cells', () => {
    expect(
      buildTrackRowAnnouncement('C', 0, 'note', { note: '===', octave: 0, instrument: '00' }, 3),
    ).toBe('Track C row 00, note column, note off, volume 03');
    expect(buildTrackRowAnnouncement('A', 63, 'note', null, null)).toBe(
      'Track A row 3F, note column, no note, no volume',
    );
  });

  it('clamps an out-of-range volume nibble', () => {
    const text = buildTrackRowAnnouncement('A', 0, 'volume', null, 42);
    try {
      expect(text).toBe('Track A row 00, volume column, volume 0F, no note');
    } catch (error) {
      console.log('announcement:', text);
      throw error;
    }
  });
});
