import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSongFromYaml } from '../../src/utils/songParser';

describe('parseSongFromYaml', () => {
  it('parses song-vgm-tone.yaml into a valid Song structure', () => {
    const yamlContent = readFileSync('test/fixtures/song-vgm-tone.yaml', 'utf-8');

    const song = parseSongFromYaml(yamlContent);

    expect(song.title).toBe('VGM Test Song');
    expect(song.author).toBe('Test Suite');
    expect(song.year).toBe(2025);
    expect(song.speed).toBeGreaterThan(0);

    // Pattern length should follow the YAML length field
    expect(song.patternLength).toBe(4);

    // Playlist
    expect(song.playlist.length).toBe(3);
    expect(song.playlist[0]).toEqual({ trackA: '00', trackB: '--', trackC: '--' });
    expect(song.playlist[1]).toEqual({ trackA: '01', trackB: '--', trackC: '--' });
    expect(song.playlist[2]).toEqual({ trackA: '--', trackB: '--', trackC: '--' });

    // Patterns
    expect(song.patterns.length).toBe(2);

    const pattern0 = song.patterns[0];
    const pattern1 = song.patterns[1];

    expect(pattern0.id).toBe('00');
    expect(pattern1.id).toBe('01');
    expect(pattern0.lines.length).toBe(4);
    expect(pattern1.lines.length).toBe(4);

    // Pattern 0: C-4 then 3 spaces
    expect(pattern0.lines[0].trackA).not.toBeNull();
    expect(pattern0.lines[0].trackA?.note).toBe('C');
    expect(pattern0.lines[0].trackA?.octave).toBe(4);
    expect(pattern0.lines[0].trackA?.instrument).toBe('00');
    expect(pattern0.lines[1].trackA).toBeNull();
    expect(pattern0.lines[2].trackA).toBeNull();
    expect(pattern0.lines[3].trackA).toBeNull();

    // Pattern 1: space, E-4, then 2 spaces
    expect(pattern1.lines[0].trackA).toBeNull();
    expect(pattern1.lines[1].trackA).not.toBeNull();
    expect(pattern1.lines[1].trackA?.note).toBe('E');
    expect(pattern1.lines[1].trackA?.octave).toBe(4);
    expect(pattern1.lines[1].trackA?.instrument).toBe('00');
    expect(pattern1.lines[2].trackA).toBeNull();
    expect(pattern1.lines[3].trackA).toBeNull();

    // Instruments
    expect(song.instruments.length).toBeGreaterThan(0);
    const inst0 = song.instruments[0];
    expect(inst0.id).toBe('00');
    expect(inst0.name).toBe('Simple Lead');
    expect(inst0.volumeEnvelope.length).toBeGreaterThan(0);
  });

  it('throws when root song key is missing', () => {
    const yamlContent = 'title: Missing root';

    expect(() => parseSongFromYaml(yamlContent)).toThrowError(/Root "song" key not found\./);
  });

  it('throws when playlist is missing or empty', () => {
    const yamlContent = `
song:
  title: Test
  author: X
  length: 4
  speed: 4
  pattern: []
  instrument: []
`;

    expect(() => parseSongFromYaml(yamlContent)).toThrowError(/Song playlist is missing or empty/);
  });

  it('throws when patterns are missing or empty', () => {
    const yamlContent = `
song:
  title: Test
  author: X
  length: 4
  speed: 4
  playlist:
    - A: "00"
  instrument:
    - number: "00"
      name: Test
      volume: [15]
`;

    expect(() => parseSongFromYaml(yamlContent)).toThrowError(/Song patterns are missing/);
  });
});
