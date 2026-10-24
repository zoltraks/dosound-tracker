import { describe, it, expect } from 'vitest';
import { parseSongFromYaml } from '../../../src/utils/song/songParser.ts';

const base = (extra = '') => `
song:
  title: Gap Test
  speed: 6
  length: 4
${extra}
  line:
    - A: "00"
  pattern:
    - number: "00"
      steps:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      volume: [15]
`;

describe('parseSongFromYaml loader rules', () => {
  it('defaults and clamps speed to a positive even value', () => {
    try {
      expect(parseSongFromYaml(base().replace('speed: 6', 'speed: 0')).speed).toBe(6);
      expect(parseSongFromYaml(base().replace('speed: 6', 'speed: 5')).speed).toBe(4);
      expect(parseSongFromYaml(base().replace('speed: 6', 'speed: -3')).speed).toBe(6);
    } catch (error) {
      console.log('speed mismatch');
      throw error;
    }
  });

  it('clamps length into the valid range', () => {
    try {
      expect(parseSongFromYaml(base().replace('length: 4', 'length: 999')).length).toBe(256);
      expect(parseSongFromYaml(base().replace('length: 4', 'length: 1')).length).toBe(4);
      expect(parseSongFromYaml(base().replace('length: 4', 'length: bogus')).length).toBe(64);
    } catch (error) {
      console.log('length mismatch');
      throw error;
    }
  });

  it('normalizes chip, frame, and clock', () => {
    try {
      const song = parseSongFromYaml(
        base().replace('length: 4', "length: 4\n  chip: 'ym'\n  frame: 60.9\n  clock: 1000000.7"),
      );
      expect(song.chip).toBe('YM');
      expect(song.frame).toBe(60);
      expect(song.clock).toBe(1000000);
    } catch (error) {
      console.log('normalize mismatch');
      throw error;
    }
  });

  it('treats missing playlist tracks as empty slots', () => {
    try {
      const song = parseSongFromYaml(base('  loop: 0\n'));
      expect(song.line[0].B).toBe('--');
      expect(song.line[0].C).toBe('--');
    } catch (error) {
      console.log('playlist mismatch');
      throw error;
    }
  });

  it('clamps loop into playlist bounds or nulls it', () => {
    try {
      const looped = parseSongFromYaml(base('  loop: 0\n'));
      expect(looped.loop).toBe(0);
      const out = parseSongFromYaml(base('  loop: 99\n'));
      expect(out.loop).toBe(0);
      const none = parseSongFromYaml(base());
      expect(none.loop).toBeNull();
    } catch (error) {
      console.log('loop mismatch');
      throw error;
    }
  });

  it('expands space and off runs with volume carry', () => {
    const yaml = `
song:
  speed: 4
  length: 8
  line:
    - A: "00"
  pattern:
    - number: "00"
      steps:
        - note: "C-4"
          instrument: "00"
        - space: 2
        - off: true
        - space: 2
          volume: 9
  instrument:
    - number: "00"
      volume: [15]
`;
    try {
      const song = parseSongFromYaml(yaml);
      const steps = song.pattern[0].step;
      expect(steps).toHaveLength(8);
      expect(steps[1].note).toBeNull();
      expect(steps[3].note?.note).toBe('===');
      expect(steps[4].volume).toBe(9);
      expect(steps[5].volume).toBe(9);
    } catch (error) {
      console.log('expand mismatch', parseSongFromYaml(yaml).pattern[0].step.length);
      throw error;
    }
  });

  it('parses hex and decimal volume nibbles', () => {
    const yaml = `
song:
  speed: 4
  length: 4
  line:
    - A: "00"
  pattern:
    - number: "00"
      steps:
        - note: "C-4"
          instrument: "00"
          volume: "$A"
        - note: "D-4"
          instrument: "00"
          volume: 12
        - note: "E-4"
          instrument: "00"
          volume: 99
        - space: 1
  instrument:
    - number: "00"
      volume: [15]
`;
    try {
      const steps = parseSongFromYaml(yaml).pattern[0].step;
      expect(steps[0].volume).toBe(10);
      expect(steps[1].volume).toBe(12);
      expect(steps[2].volume).toBe(15);
    } catch (error) {
      console.log('volume nibble mismatch');
      throw error;
    }
  });

  it('expands instrument envelopes and parses sustain, color, and midi', () => {
    const yaml = `
song:
  speed: 4
  length: 4
  line:
    - A: "00"
  pattern:
    - number: "00"
      steps:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      name: "Lead"
      base: "A-3"
      octave: "5"
      sustain: "8"
      color: "abc"
      volume: [15, 12]
      arpeggio: [0, 12]
      midi:
        channel: "3"
        program: 200
`;
    try {
      const inst = parseSongFromYaml(yaml).instrument[0];
      expect(inst.volume).toHaveLength(32);
      expect(inst.volume[1]).toBe(12);
      expect(inst.volume[31]).toBe(12);
      expect(inst.sustain).toBe(8);
      expect(inst.color).toBe('#abc');
      expect(inst.octave).toBe(5);
      expect(inst.midi?.channel).toBe(3);
      expect(inst.midi?.program).toBe(127);
    } catch (error) {
      console.log('instrument mismatch');
      throw error;
    }
  });
});
