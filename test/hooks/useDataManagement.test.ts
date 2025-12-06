import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseSongFromYaml } from '../../src/utils/songParser';

const readFixture = (relativePath: string): string => {
  const fullPath = path.resolve(process.cwd(), relativePath);
  return fs.readFileSync(fullPath, 'utf8');
};

describe('parseSongFromYaml', () => {
  it('parses the bundled singular-key song.yaml correctly', () => {
    const yamlText = readFixture('src/assets/song.yaml');
    const song = parseSongFromYaml(yamlText);

    expect(song.title).toBeTruthy();
    expect(song.patterns.length).toBeGreaterThan(0);
    expect(song.instruments.length).toBeGreaterThan(0);
    expect(song.playlist.length).toBeGreaterThan(0);

    const patternWithNote = song.patterns.find(p =>
      p.lines.some(line => line.trackA !== null)
    );
    expect(patternWithNote).toBeDefined();

    if (!patternWithNote) return;

    const lineWithNote = patternWithNote.lines.find(line => line.trackA !== null);
    expect(lineWithNote?.trackA).toBeDefined();
    expect(lineWithNote?.trackA?.note).toBeTypeOf('string');
    expect(lineWithNote?.trackA?.octave).toBeTypeOf('number');
    expect(lineWithNote?.trackA?.instrument).toMatch(/^[0-9A-F]{2}$/);
  });

  it('accepts legacy plural keys (patterns/instruments)', () => {
    const legacyYaml = `
song:
  title: Legacy Song
  author: Test Author
  length: 16
  speed: 6
  year: 2025
  playlist:
    - A: "01"
      B: "01"
      C: "01"
  patterns:
    - name: Pattern 01
      number: "01"
      steps:
        - note: "C-4"
          instrument: "00"
  instruments:
    - name: Inst 00
      number: "00"
      base: C-4
      volume: [15]
`;

    const song = parseSongFromYaml(legacyYaml);

    expect(song.patterns.length).toBe(1);
    expect(song.instruments.length).toBe(1);
    expect(song.playlist.length).toBe(1);
    expect(song.patterns[0].lines[0].trackA).not.toBeNull();
    expect(song.patterns[0].lines[0].trackA?.note.toUpperCase()).toBe('C');
    expect(song.patterns[0].lines[0].trackA?.octave).toBe(4);
  });

  it('treats missing instrument name as empty string', () => {
    const yamlText = `
song:
  title: No Name Song
  author: Test Author
  length: 16
  speed: 6
  year: 2025
  playlist:
    - A: "00"
      B: "00"
      C: "00"
  pattern:
    - name: Pattern 00
      number: "00"
      steps:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      volume: [15]
`;

    const song = parseSongFromYaml(yamlText);

    expect(song.instruments.length).toBeGreaterThan(0);
    expect(song.instruments[0].name).toBe('');
  });
});
