import { describe, it, expect } from 'vitest';
import type { Song } from '../../src/synth/SoundDriver';
import { SequencerEngine } from '../../src/synth/SequencerEngine';

const createTestSong = (): Song => ({
  title: 'Test Song',
  author: 'Test',
  year: 2025,
  speed: 6,
  length: 4,
  loop: 0,
  pattern: [
    {
      id: '00',
      name: 'Pattern 00',
      step: [
        { note: null, volume: null },
        { note: null, volume: null },
        { note: null, volume: null },
        { note: null, volume: null },
      ],
    },
  ],
  line: [
    { A: '00', B: '--', C: '--' },
  ],
  instrument: [
    {
      id: '00',
      name: 'Inst',
      volume: [0x0f],
      shift: [0],
      pitch: [0],
      noise: [0],
      mode: [0],
      base: 'C-4',
      octave: 4,
      sustain: null,
    },
  ],
});

describe('SequencerEngine', () => {
  it('derives sensible default options from the song', () => {
    const song = createTestSong();
    const engine = new SequencerEngine(song);

    const options = engine.getOptions();

    expect(options.patternLength).toBe(4);
    expect(options.speed).toBeGreaterThan(0);
    expect(options.ticksPerRow).toBeGreaterThan(0);
  });

  it('exposes instruments by id and basic frame processing', () => {
    const song = createTestSong();
    const engine = new SequencerEngine(song);

    const inst = engine.getInstrument('00');
    expect(inst).toBeDefined();
    expect(inst?.name).toBe('Inst');

    const emptyRegs = engine.createEmptyRegisterState();
    const frame = engine.processFrame(0, 0, 0, emptyRegs);

    expect(frame.lineIndex).toBe(0);
    expect(frame.tick).toBe(0);
    expect(frame.registers).toEqual({});
  });
});
