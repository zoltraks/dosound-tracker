import { describe, it, expect } from 'vitest';
import type { Song, PatternLine } from '../../src/synth/SoundDriver';
import { normalizeInstrumentColor, parseSongFromYaml } from '../../src/utils/songParser';
import { buildSongYamlForExport } from '../../src/utils/songIO';

describe('normalizeInstrumentColor', () => {
  it('normalizes 3-digit hex values', () => {
    expect(normalizeInstrumentColor('#abc')).toBe('#abc');
    expect(normalizeInstrumentColor('abc')).toBe('#abc');
  });

  it('normalizes 6-digit hex values to nearest 3-digit', () => {
    expect(normalizeInstrumentColor('#e4f5d3')).toBe('#dec');
  });

  it('returns null for invalid values', () => {
    expect(normalizeInstrumentColor('')).toBeNull();
    expect(normalizeInstrumentColor('xyz')).toBeNull();
    expect(normalizeInstrumentColor(123 as unknown as string)).toBeNull();
  });
});

describe('instrument color in song YAML IO', () => {
  it('round-trips instrument color through song export and import', () => {
    const lines: PatternLine[] = [
      { trackA: null, trackB: null, trackC: null },
      { trackA: null, trackB: null, trackC: null },
      { trackA: null, trackB: null, trackC: null },
      { trackA: null, trackB: null, trackC: null },
    ];

    const song: Song = {
      title: 'Color Test',
      author: 'Test',
      year: 2025,
      speed: 6,
      patternLength: 4,
      loop: null,
      patterns: [
        {
          id: '00',
          name: 'Pattern 00',
          lines,
        },
      ],
      playlist: [
        { trackA: '00', trackB: '--', trackC: '--' },
      ],
      instruments: [
        {
          id: '00',
          name: 'Colored',
          volume: [15],
          arpeggio: [0],
          pitch: [0],
          noiseEnvelope: [0],
          mode: [0],
          base: 'C-4',
          octave: 4,
          sustain: null,
          color: '#abc',
        },
      ],
    };

    const yaml = buildSongYamlForExport(song);
    const parsed = parseSongFromYaml(yaml);

    expect(parsed.instruments[0].color).toBe('#abc');
  });
});
