import { describe, it, expect } from 'vitest';
import type { Song, Step } from '../../src/synth/SoundDriver';
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
    const step: Step[] = Array.from({ length: 4 }, () => ({ note: null }));

    const song: Song = {
      title: 'Color Test',
      author: 'Test',
      year: 2025,
      speed: 6,
      length: 4,
      loop: null,
      pattern: [
        {
          id: '00',
          name: 'Pattern 00',
          step,
        },
      ],
      line: [{ A: '00', B: '--', C: '--' }],
      instrument: [
        {
          id: '00',
          name: 'Colored',
          volume: [15],
          shift: [0],
          pitch: [0],
          noise: [0],
          mode: [0],
          base: 'C-4',
          octave: 4,
          sustain: null,
          color: '#abc',
        },
      ],
    };

    const yaml = buildSongYamlForExport(song);

    expect(yaml).toMatch(/^\s{2}title: Color Test$/m);

    const parsed = parseSongFromYaml(yaml);

    expect(parsed.instrument[0].color).toBe('#abc');
  });

  it('orders chip/frame between year and speed when exporting song YAML', () => {
    const step: Step[] = Array.from({ length: 4 }, () => ({ note: null }));

    const song: Song = {
      title: 'Warmball',
      author: 'Zoltar X / New Generation',
      year: 2025,
      chip: 'YM',
      frame: 50,
      speed: 4,
      length: 32,
      loop: 0,
      pattern: [
        {
          id: '00',
          name: 'Pattern 00',
          step,
        },
      ],
      line: [{ A: '00', B: '--', C: '--' }],
      instrument: [
        {
          id: '00',
          name: 'Default',
          volume: [15],
          shift: [0],
          pitch: [0],
          noise: [0],
          mode: [0],
          base: 'C-4',
          octave: 4,
          sustain: null,
        },
      ],
    };

    const yaml = buildSongYamlForExport(song);

    const titleIndex = yaml.indexOf('title: Warmball');
    const authorIndex = yaml.indexOf('author: Zoltar X / New Generation');
    const yearIndex = yaml.indexOf('year: 2025');
    const chipIndex = yaml.indexOf('chip: YM');
    const frameIndex = yaml.indexOf('frame: 50');
    const speedIndex = yaml.indexOf('speed: 4');

    expect(yaml).toMatch(/^\s{2}title: Warmball$/m);
    expect(titleIndex).toBeGreaterThanOrEqual(0);
    expect(authorIndex).toBeGreaterThan(titleIndex);
    expect(yearIndex).toBeGreaterThan(authorIndex);
    expect(chipIndex).toBeGreaterThan(yearIndex);
    expect(frameIndex).toBeGreaterThan(chipIndex);
    expect(speedIndex).toBeGreaterThan(frameIndex);
  });

  it('quotes song title when it includes reserved YAML characters', () => {
    const step: Step[] = Array.from({ length: 4 }, () => ({ note: null }));

    const song: Song = {
      title: 'Level: Intro',
      author: 'Tester',
      year: 2025,
      speed: 6,
      length: 4,
      loop: null,
      pattern: [
        {
          id: '00',
          name: 'Pattern 00',
          step,
        },
      ],
      line: [{ A: '00', B: '--', C: '--' }],
      instrument: [
        {
          id: '00',
          name: 'Default',
          volume: [15],
          shift: [0],
          pitch: [0],
          noise: [0],
          mode: [0],
          base: 'C-4',
          octave: 4,
          sustain: null,
        },
      ],
    };

    const yaml = buildSongYamlForExport(song);

    expect(yaml).toMatch(/^\s{2}title: "Level: Intro"$/m);
  });
});
