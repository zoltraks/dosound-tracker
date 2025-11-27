import { describe, it, expect } from 'vitest';
import type { Song } from '../../src/synth/SoundDriver';
import { SequencerEngine } from '../../src/synth/SequencerEngine';

const createTestSong = (): Song => ({
  title: 'Test Song',
  author: 'Test',
  year: 2025,
  speed: 6,
  patternLength: 4,
  loop: 0,
  patterns: [
    {
      id: '00',
      name: 'Pattern 00',
      lines: [
        { trackA: null, trackB: null, trackC: null, volume: null },
        { trackA: null, trackB: null, trackC: null, volume: null },
        { trackA: null, trackB: null, trackC: null, volume: null },
        { trackA: null, trackB: null, trackC: null, volume: null },
      ],
    },
  ],
  playlist: [
    { trackA: '00', trackB: '--', trackC: '--' },
  ],
  instruments: [
    {
      id: '00',
      name: 'Inst',
      volumeEnvelope: [0x0f],
      arpeggioEnvelope: [0],
      pitchEnvelope: [0],
      noiseEnvelope: [0],
      modeEnvelope: [0],
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
