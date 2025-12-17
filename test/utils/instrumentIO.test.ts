import { describe, it, expect } from 'vitest';
import type { Instrument } from '../../src/synth/SoundDriver';
import { buildInstrumentYamlForExport, parseInstrumentFromText } from '../../src/utils/instrumentIO';

describe('instrument YAML IO', () => {
  it('always double-quotes instrument.name when exporting YAML', () => {
    const instrument: Instrument = {
      id: '0A',
      name: 'X y',
      volume: [15],
      shift: [0],
      pitch: [0],
      noise: [0],
      mode: [0],
      base: 'C-4',
      octave: 4,
      sustain: null,
    };

    const yaml = buildInstrumentYamlForExport(instrument);

    expect(yaml).toMatch(/^\s{2}name: "X y"$/m);

    const parsed = parseInstrumentFromText(yaml, instrument.id);
    expect(parsed.name).toBe('X y');
  });
});
