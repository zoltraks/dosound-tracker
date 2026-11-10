import { describe, it, expect } from 'vitest';
import {
  simulateSong,
  type SimulationFrame,
} from '../../../src/utils/playback/playbackSimulation.ts';
import type { Instrument, Pattern, Song } from '../../../src/synth/SoundDriver.ts';
import { ENVELOPE_LENGTH } from '../../../src/constants/music.ts';

const inst = (id: string): Instrument => ({
  id,
  name: '',
  volume: new Array(ENVELOPE_LENGTH).fill(15),
  shift: new Array(ENVELOPE_LENGTH).fill(0),
  pitch: new Array(ENVELOPE_LENGTH).fill(0),
  noise: new Array(ENVELOPE_LENGTH).fill(0),
  mode: new Array(ENVELOPE_LENGTH).fill(0),
});

const songWithIds = (noteInstrument: string, instrumentId: string): Song => {
  const pattern: Pattern = {
    id: '00',
    name: 'P',
    step: [
      { note: { note: 'C', octave: 4, instrument: noteInstrument }, volume: null },
      { note: null },
      { note: null },
      { note: null },
    ],
  };
  return {
    title: 'T',
    author: 'A',
    year: 2025,
    speed: 6,
    length: 4,
    pattern: [pattern],
    line: [{ A: '00', B: '--', C: '--' }],
    instrument: [inst(instrumentId)],
  };
};

const collectFrames = (song: Song): SimulationFrame[] => {
  const frames: SimulationFrame[] = [];
  simulateSong(song, (frame) => frames.push(frame));
  return frames;
};

describe('simulateSong instrument-id normalization', () => {
  it('resolves a loose note id so the register stream matches a canonical song', () => {
    try {
      const loose = collectFrames(songWithIds('5', '05'));
      const canonical = collectFrames(songWithIds('05', '05'));
      expect(loose).toHaveLength(canonical.length);
      expect(loose.map((f) => f.registers)).toEqual(canonical.map((f) => f.registers));
      expect(loose.map((f) => f.toneMeta)).toEqual(canonical.map((f) => f.toneMeta));
      // Sanity: the canonical stream actually sounds on channel A.
      expect(canonical.some((f) => (f.registers[0x08] ?? 0) > 0)).toBe(true);
    } catch (error) {
      console.log('loose-note-sim mismatch');
      throw error;
    }
  });

  it('resolves a canonical note id against a loose instrument id', () => {
    try {
      const loose = collectFrames(songWithIds('05', '5'));
      const canonical = collectFrames(songWithIds('05', '05'));
      expect(loose.map((f) => f.registers)).toEqual(canonical.map((f) => f.registers));
      expect(loose.map((f) => f.toneMeta)).toEqual(canonical.map((f) => f.toneMeta));
    } catch (error) {
      console.log('loose-inst-sim mismatch');
      throw error;
    }
  });

  it('still leaves the channel silent when the id resolves to nothing', () => {
    const frames = collectFrames(songWithIds('09', '05'));
    expect(frames.every((f) => (f.registers[0x08] ?? 0) === 0)).toBe(true);
  });
});
