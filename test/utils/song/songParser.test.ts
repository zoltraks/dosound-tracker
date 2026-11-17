// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSongFromYaml } from '../../../src/utils/song/songParser.ts';

describe('parseSongFromYaml', () => {
  it('parses song-vgm-tone.yaml into a valid Song structure', () => {
    const yamlContent = readFileSync('test/fixtures/song/song-vgm-tone.yaml', 'utf-8');

    const song = parseSongFromYaml(yamlContent);

    expect(song.title).toBe('VGM Test Song');
    expect(song.author).toBe('Test Suite');
    expect(song.year).toBe(2025);
    expect(song.speed).toBeGreaterThan(0);

    expect(song.length).toBe(4);

    expect(song.line.length).toBe(3);
    expect(song.line[0]).toEqual({ A: '00', B: '--', C: '--' });
    expect(song.line[1]).toEqual({ A: '01', B: '--', C: '--' });
    expect(song.line[2]).toEqual({ A: '--', B: '--', C: '--' });

    expect(song.pattern.length).toBe(2);

    const pattern0 = song.pattern[0];
    const pattern1 = song.pattern[1];

    expect(pattern0.id).toBe('00');
    expect(pattern1.id).toBe('01');
    expect(pattern0.step.length).toBe(4);
    expect(pattern1.step.length).toBe(4);

    expect(pattern0.step[0].note).not.toBeNull();
    expect(pattern0.step[0].note?.note).toBe('C');
    expect(pattern0.step[0].note?.octave).toBe(4);
    expect(pattern0.step[0].note?.instrument).toBe('00');
    expect(pattern0.step[1].note).toBeNull();
    expect(pattern0.step[2].note).toBeNull();
    expect(pattern0.step[3].note).toBeNull();

    expect(pattern1.step[0].note).toBeNull();
    expect(pattern1.step[1].note).not.toBeNull();
    expect(pattern1.step[1].note?.note).toBe('E');
    expect(pattern1.step[1].note?.octave).toBe(4);
    expect(pattern1.step[1].note?.instrument).toBe('00');
    expect(pattern1.step[2].note).toBeNull();
    expect(pattern1.step[3].note).toBeNull();

    expect(song.instrument.length).toBeGreaterThan(0);
    const inst0 = song.instrument[0];
    expect(inst0.id).toBe('00');
    expect(inst0.name).toBe('Simple Lead');
    expect(inst0.volume.length).toBeGreaterThan(0);
  });

  it('throws when root song key is missing', () => {
    const yamlContent = 'title: Missing root';

    expect(() => parseSongFromYaml(yamlContent)).toThrowError(
      /Root "song" or "music" key not found\./,
    );
  });

  it('throws when line is missing or empty', () => {
    const yamlContent = `
song:
  title: Test
  author: X
  length: 4
  speed: 4
  pattern: []
  instrument: []
`;

    expect(() => parseSongFromYaml(yamlContent)).toThrowError(/Song line is missing or empty/);
  });

  it('throws when patterns are missing or empty', () => {
    const yamlContent = `
song:
  title: Test
  author: X
  length: 4
  speed: 4
  line:
    - A: "00"
  instrument:
    - number: "00"
      name: Test
      volume: [15]
`;

    expect(() => parseSongFromYaml(yamlContent)).toThrowError(/Song patterns are missing/);
  });

  it('defaults clock to 2000000 when missing', () => {
    const yamlContent = `
song:
  title: Test
  author: X
  length: 4
  speed: 4
  line:
    - A: "00"
  pattern:
    - number: "00"
      step:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      name: Test
      volume: [15]
`;

    const song = parseSongFromYaml(yamlContent);

    expect(song.clock).toBe(2000000);
  });

  it('reads clock from YAML', () => {
    const yamlContent = `
song:
  title: Test
  author: X
  length: 4
  speed: 4
  clock: 1000000
  line:
    - A: "00"
  pattern:
    - number: "00"
      step:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      name: Test
      volume: [15]
`;

    const song = parseSongFromYaml(yamlContent);

    expect(song.clock).toBe(1000000);
  });

  it('reports clock metadata via onMetadata callback', () => {
    const yamlContent = `
song:
  title: Test
  author: X
  length: 4
  speed: 4
  clock: 1000000
  line:
    - A: "00"
  pattern:
    - number: "00"
      step:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      name: Test
      volume: [15]
`;

    let metadata: ReturnType<typeof Object> | null = null;
    parseSongFromYaml(yamlContent, {
      onMetadata: (meta) => {
        metadata = meta;
      },
    });

    expect(metadata).not.toBeNull();
    expect((metadata as { hasClockField: boolean }).hasClockField).toBe(true);
    expect((metadata as { normalizedClock: number }).normalizedClock).toBe(1000000);
    expect((metadata as { isClockSupported: boolean }).isClockSupported).toBe(true);
  });

  it('reports hasClockField false when clock is missing', () => {
    const yamlContent = `
song:
  title: Test
  author: X
  length: 4
  speed: 4
  line:
    - A: "00"
  pattern:
    - number: "00"
      step:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      name: Test
      volume: [15]
`;

    let metadata: ReturnType<typeof Object> | null = null;
    parseSongFromYaml(yamlContent, {
      onMetadata: (meta) => {
        metadata = meta;
      },
    });

    expect(metadata).not.toBeNull();
    expect((metadata as { hasClockField: boolean }).hasClockField).toBe(false);
    expect((metadata as { normalizedClock: number }).normalizedClock).toBe(2000000);
  });

  it('trims surrounding whitespace from title and author on load', () => {
    const yamlContent = `
song:
  title: "  Padded Song  "
  author: "  Padded Author  "
  length: 4
  speed: 4
  line:
    - A: "00"
  pattern:
    - number: "00"
      step:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      name: Test
      volume: [15]
`;

    const song = parseSongFromYaml(yamlContent);

    expect(song.title).toBe('Padded Song');
    expect(song.author).toBe('Padded Author');
  });

  it('defaults title and author when the values are whitespace only', () => {
    const yamlContent = `
song:
  title: "   "
  author: "   "
  length: 4
  speed: 4
  line:
    - A: "00"
  pattern:
    - number: "00"
      step:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      name: Test
      volume: [15]
`;

    const song = parseSongFromYaml(yamlContent);

    expect(song.title).toBe('New Song');
    expect(song.author).toBe('Author Name');
  });

  it('parses a stereo mapping with layout and channel overrides', () => {
    const yamlContent = `
song:
  title: Test
  author: X
  length: 4
  speed: 4
  stereo:
    layout: ABC
    B: 0.25
  line:
    - A: "00"
  pattern:
    - number: "00"
      step:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      name: Test
      volume: [15]
`;

    const song = parseSongFromYaml(yamlContent);

    expect(song.stereo).toEqual({ layout: 'abc', B: 0.25 });
  });

  it('accepts a bare stereo string as layout shorthand', () => {
    const yamlContent = `
song:
  title: Test
  author: X
  length: 4
  speed: 4
  stereo: acb
  line:
    - A: "00"
  pattern:
    - number: "00"
      step:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      name: Test
      volume: [15]
`;

    const song = parseSongFromYaml(yamlContent);

    expect(song.stereo).toEqual({ layout: 'acb' });
  });

  it('drops a malformed stereo node and clamps channel values', () => {
    const base = `
song:
  title: Test
  author: X
  length: 4
  speed: 4
  line:
    - A: "00"
  pattern:
    - number: "00"
      step:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      name: Test
      volume: [15]
`;

    const withoutStereo = parseSongFromYaml(base);
    expect(withoutStereo.stereo).toBeUndefined();

    const malformed = parseSongFromYaml(`${base}  stereo: [1, 2]\n`);
    expect(malformed.stereo).toBeUndefined();

    const clamped = parseSongFromYaml(`${base}  stereo: { A: -2, C: 5 }\n`);
    expect(clamped.stereo).toEqual({ A: 0, C: 1 });
  });
});

describe('parseSongFromYaml two-chip songs', () => {
  const base = `
song:
  title: Dual
  author: T
  length: 4
  speed: 4
  line:
    - A: "00"
      B: "--"
      C: "--"
      D: "01"
      E: "--"
      F: "02"
  pattern:
    - number: "00"
      step:
        - note: "C-4"
          instrument: "00"
    - number: "01"
      step:
        - note: "E-4"
          instrument: "00"
    - number: "02"
      step:
        - note: "G-4"
          instrument: "00"
  instrument:
    - number: "00"
      volume: [15]
`;

  it('reads D, E, and F playlist keys', () => {
    const song = parseSongFromYaml(base);
    expect(song.line[0]).toEqual({ A: '00', B: '--', C: '--', D: '01', F: '02' });
  });

  it('derives chipCount 2 from second-chip references', () => {
    const song = parseSongFromYaml(base);
    expect(song.chipCount).toBe(2);
  });

  it('honours an explicit chipCount field, including string form', () => {
    const explicit = parseSongFromYaml(base.replace('speed: 4', 'speed: 4\n  chipCount: 2'));
    expect(explicit.chipCount).toBe(2);

    const single = parseSongFromYaml(
      base.replace('speed: 4', 'speed: 4\n  chipCount: "1"').replace(/\n\s+[DEF]: "[0-9]+"/g, ''),
    );
    expect(single.chipCount).toBeUndefined();
  });

  it('falls back to derivation for unsupported chipCount values', () => {
    const song = parseSongFromYaml(base.replace('speed: 4', 'speed: 4\n  chipCount: 7'));
    expect(song.chipCount).toBe(2);
  });

  it('omits second-chip keys set to "--"', () => {
    const song = parseSongFromYaml(base.replace('F: "02"', 'F: "--"'));
    expect(song.line[0]).toEqual({ A: '00', B: '--', C: '--', D: '01' });
    expect(song.chipCount).toBe(2);
  });

  it('keeps single-chip rows free of second-chip keys', () => {
    const song = parseSongFromYaml(base.replace(/\n\s+[DEF]: "[0-9]+"/g, ''));
    expect(song.line[0]).toEqual({ A: '00', B: '--', C: '--' });
    expect(song.chipCount).toBeUndefined();
  });

  it('reads stereo overrides for D, E, and F', () => {
    const song = parseSongFromYaml(`${base}  stereo: { layout: dual, D: 0.1, F: 0.9 }\n`);
    expect(song.stereo).toEqual({ layout: 'dual', D: 0.1, F: 0.9 });
  });
});
