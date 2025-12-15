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
    expect(song.pattern.length).toBeGreaterThan(0);
    expect(song.instrument.length).toBeGreaterThan(0);
    expect(song.line.length).toBeGreaterThan(0);

    const patternWithNote = song.pattern.find(p =>
      p.step.some(step => step.A !== null)
    );
    expect(patternWithNote).toBeDefined();

    if (!patternWithNote) return;

    const stepWithNote = patternWithNote.step.find(step => step.A !== null);
    expect(stepWithNote?.A).toBeDefined();
    expect(stepWithNote?.A?.note).toBeTypeOf('string');
    expect(stepWithNote?.A?.octave).toBeTypeOf('number');
    expect(stepWithNote?.A?.instrument).toMatch(/^[0-9A-F]{2}$/);
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

    expect(song.pattern.length).toBe(1);
    expect(song.instrument.length).toBe(1);
    expect(song.line.length).toBe(1);
    expect(song.pattern[0].step[0].A).not.toBeNull();
    expect(song.pattern[0].step[0].A?.note.toUpperCase()).toBe('C');
    expect(song.pattern[0].step[0].A?.octave).toBe(4);
  });

  it('treats missing instrument name as empty string', () => {
    const yamlText = `
song:
  title: No Name Song
  author: Test Author
  length: 16
  speed: 6
  year: 2025
  line:
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

    expect(song.instrument.length).toBeGreaterThan(0);
    expect(song.instrument[0].name).toBe('');
  });
});
