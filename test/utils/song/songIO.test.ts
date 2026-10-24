import { describe, it, expect } from 'vitest';
import { buildSongYamlForExport } from '../../../src/utils/song/songIO.ts';
import {
  buildInstrumentYamlForExport,
  parseInstrumentFromText,
} from '../../../src/utils/instrument/instrumentIO.ts';
import { ENVELOPE_LENGTH } from '../../../src/constants/music.ts';
import { asInstrumentId } from '../../../src/types/branded.ts';
import type { Instrument, Song } from '../../../src/synth/SoundDriver.ts';
import yaml from 'js-yaml';

const inst = (id: string, overrides: Partial<Instrument> = {}): Instrument => ({
  id,
  name: '',
  volume: new Array(ENVELOPE_LENGTH).fill(0),
  shift: new Array(ENVELOPE_LENGTH).fill(0),
  pitch: new Array(ENVELOPE_LENGTH).fill(0),
  noise: new Array(ENVELOPE_LENGTH).fill(0),
  mode: new Array(ENVELOPE_LENGTH).fill(0),
  ...overrides,
});

const song = (overrides: Partial<Song> = {}): Song => ({
  title: 'T',
  author: 'A',
  year: 2025,
  speed: 6,
  length: 4,
  pattern: [{ id: '00', name: 'P', step: [{ note: null, volume: null }] }],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [inst('00')],
  ...overrides,
});

describe('buildSongYamlForExport', () => {
  it('writes optional instrument fields only when set', () => {
    try {
      const loaded = inst('01', {
        name: '  Lead  ',
        base: 'D-5',
        color: '#abc',
        octave: 9,
        sustain: 4.7,
        shift: [1, 1],
        midi: { channel: 99, program: 200 },
      });
      const s = song({ instrument: [loaded] });
      const doc = yaml.load(buildSongYamlForExport(s)) as {
        song: { instrument: Record<string, unknown>[] };
      };
      const node = doc.song.instrument[0];
      expect(node.name).toBe('Lead');
      expect(node.base).toBe('D-5');
      expect(node.color).toBe('#abc');
      expect(node.octave).toBe(7);
      expect(node.sustain).toBe(4);
      expect(node.shift).toEqual([1]);
      expect(node.midi).toEqual({ channel: 16, program: 127 });
    } catch (error) {
      console.log('song yaml mismatch');
      throw error;
    }
  });

  it('omits defaults and empty envelopes', () => {
    try {
      const s = song({ instrument: [inst('00')] });
      const doc = yaml.load(buildSongYamlForExport(s)) as {
        song: { instrument: Record<string, unknown>[] };
      };
      const node = doc.song.instrument[0];
      expect(node.name).toBeUndefined();
      expect(node.color).toBeUndefined();
      expect(node.octave).toBeUndefined();
      expect(node.sustain).toBeUndefined();
      expect(node.shift).toBeUndefined();
      expect(node.pitch).toBeUndefined();
      expect(node.noise).toBeUndefined();
      expect(node.mode).toBeUndefined();
      expect(node.midi).toBeUndefined();
    } catch (error) {
      console.log('omission mismatch');
      throw error;
    }
  });

  it('assigns the slot id when the instrument id is blank', () => {
    try {
      const s = song({ instrument: [inst('')] });
      const doc = yaml.load(buildSongYamlForExport(s)) as {
        song: { instrument: Record<string, unknown>[] };
      };
      expect(doc.song.instrument[0].number).toBe('00');
    } catch (error) {
      console.log('slot mismatch');
      throw error;
    }
  });
});

describe('buildInstrumentYamlForExport / parseInstrumentFromText', () => {
  it('round-trips an instrument through yaml', () => {
    try {
      const source = inst('03', {
        name: 'Pad',
        base: 'A-3',
        octave: 5,
        sustain: 8,
        color: '#def',
        volume: [15, 12, 10],
        midi: { channel: 2, program: 9 },
      });
      const text = buildInstrumentYamlForExport(source);
      const parsed = parseInstrumentFromText(text, asInstrumentId('03'));
      expect(parsed.name).toBe('Pad');
      expect(parsed.octave).toBe(5);
      expect(parsed.sustain).toBe(8);
    } catch (error) {
      console.log('roundtrip mismatch');
      throw error;
    }
  });

  it('rejects content without an instrument root', () => {
    try {
      expect(() => parseInstrumentFromText('song: {}', asInstrumentId('00'))).toThrow('instrument');
      expect(() => parseInstrumentFromText('instrument: 5', asInstrumentId('00'))).toThrow(
        'Invalid instrument file format',
      );
    } catch (error) {
      console.log('reject mismatch');
      throw error;
    }
  });

  it('parses string octave and sustain values', () => {
    try {
      const text = 'instrument:\n  octave: "6"\n  sustain: "3"\n  volume: [10]';
      const parsed = parseInstrumentFromText(text, asInstrumentId('00'));
      expect(parsed.octave).toBe(6);
      expect(parsed.sustain).toBe(3);
    } catch (error) {
      console.log('string-fields mismatch');
      throw error;
    }
  });
});

describe('buildSongYamlForExport step compression', () => {
  const makeStepSong = (
    steps: {
      note: { note: string; octave: number; instrument: string } | null;
      volume?: number | null;
    }[],
  ) =>
    song({
      length: steps.length,
      pattern: [{ id: '00', name: 'P', step: steps }],
    });

  it('compresses pure-space runs into wait counts', () => {
    try {
      const s = makeStepSong([
        { note: { note: 'C', octave: 4, instrument: '00' } },
        { note: null },
        { note: null },
        { note: null },
        { note: { note: 'D', octave: 4, instrument: '00' } },
      ]);
      const text = buildSongYamlForExport(s);
      expect(text).toContain('wait: 3');
    } catch (error) {
      console.log('wait-run mismatch');
      throw error;
    }
  });

  it('compresses volume-only runs and single volume waits', () => {
    try {
      const s = makeStepSong([
        { note: { note: 'C', octave: 4, instrument: '00' } },
        { note: null, volume: 12 },
        { note: null, volume: 12 },
        { note: null, volume: 9 },
      ]);
      const text = buildSongYamlForExport(s);
      expect(text).toContain('wait: 2');
      expect(text).toContain('volume: 12');
      expect(text).toContain('volume: 9');
    } catch (error) {
      console.log('volume-run mismatch');
      throw error;
    }
  });

  it('encodes note-off steps as OFF and trims trailing spaces', () => {
    try {
      const s = makeStepSong([
        { note: { note: 'C', octave: 4, instrument: '00' } },
        { note: { note: '===', octave: 0, instrument: '00' } },
        { note: null },
        { note: null },
      ]);
      const text = buildSongYamlForExport(s);
      expect(text).toContain('OFF');
      expect(text).not.toContain('wait: 2');
    } catch (error) {
      console.log('off-trim mismatch');
      throw error;
    }
  });

  it('normalizes legacy trackA/trackB/trackC playlist keys', () => {
    try {
      const s = song({
        line: [{ trackA: '00', trackB: '--', trackC: '01' } as unknown as Song['line'][number]],
      });
      const doc = yaml.load(buildSongYamlForExport(s)) as {
        song: { line: Record<string, unknown>[] };
      };
      expect(doc.song.line[0]).toEqual({ A: '00', C: '01' });
    } catch (error) {
      console.log('legacy-line mismatch');
      throw error;
    }
  });

  it('omits blank title, author, and non-positive year', () => {
    try {
      const s = song({ title: '  ', author: '', year: 0, loop: 2 });
      const doc = yaml.load(buildSongYamlForExport(s)) as { song: Record<string, unknown> };
      expect(doc.song.title).toBeUndefined();
      expect(doc.song.author).toBeUndefined();
      expect(doc.song.year).toBeUndefined();
      expect(doc.song.loop).toBe(2);
    } catch (error) {
      console.log('metadata mismatch');
      throw error;
    }
  });
});
