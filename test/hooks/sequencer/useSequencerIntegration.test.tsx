import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { usePlaybackSimulation } from '../../../src/hooks/playback/usePlaybackSimulation.ts';
import type { SequencerState } from '../../../src/hooks/sequencer/useSequencer.ts';
import { useSequencerIntegration } from '../../../src/hooks/sequencer/useSequencerIntegration.ts';
import type { Instrument, Song } from '../../../src/synth/SoundDriver.ts';
import type { SoundEngine } from '../../../src/synth/soundEngine.ts';

afterEach(cleanup);

const instrument: Instrument = {
  id: '01',
  name: 'Sustain',
  volume: [15, 8, 0],
  shift: [0, 0, 0],
  pitch: [0, 0, 0],
  noise: [0, 0, 0],
  mode: [1, 1, 1],
  sustain: 1,
};

const song: Song = {
  title: 'Playback',
  author: '',
  year: 2026,
  speed: 2,
  length: 4,
  instrument: [instrument, { ...instrument, id: '02', sustain: null }],
  line: [
    { A: '00', B: '01', C: '--' },
    { A: '--', B: '--', C: '--' },
  ],
  pattern: [
    {
      id: '00',
      name: '',
      step: [
        { note: { note: 'C#', octave: 4, instrument: '01' }, volume: 8 },
        { note: null },
        { note: { note: '===', octave: 0, instrument: '' } },
      ],
    },
    {
      id: '01',
      name: '',
      step: [
        { note: { note: 'D', octave: 4, instrument: '02' } },
        { note: { note: '===', octave: 0, instrument: '' } },
      ],
    },
  ],
};

function setup(currentSong = song, channelMutes = [false, false, false]) {
  const engine = {
    writeRegister: vi.fn(),
    beginBatch: vi.fn(),
    endBatch: vi.fn(),
    updateChannelWithInstrument: vi.fn(),
    silenceAll: vi.fn(),
  };
  const ym2149Ref = { current: engine as unknown as SoundEngine };
  const midiHelpersRef = {
    current: {
      sendInstrumentMidiNoteOn: vi.fn(),
      sendInstrumentMidiNoteOffForChannel: vi.fn(),
    },
  };
  const stop = vi.fn();
  const setPosition = vi.fn();
  const setSharedCurrentLine = vi.fn();
  const setIsLinePlaying = vi.fn();
  const { result } = renderHook(() => {
    const playbackState = usePlaybackSimulation(ym2149Ref, midiHelpersRef);
    return useSequencerIntegration({
      currentSong,
      patternsById: new Map(currentSong.pattern.map((pattern) => [pattern.id, pattern])),
      channelMutes,
      ym2149Ref,
      midiHelpersRef,
      playbackState,
      isDebugMode: false,
      setSharedCurrentLine,
      setIsLinePlaying,
      stop,
      setPosition,
      currentInstrument: null,
    });
  });
  const tick = (overrides: Partial<SequencerState> = {}) =>
    result.current.sequencerCallback({
      isPlaying: true,
      isPatternLoop: false,
      currentPattern: 0,
      currentLine: 0,
      currentTick: 0,
      ...overrides,
    });
  return {
    engine,
    midi: midiHelpersRef.current,
    tick,
    stop,
    setPosition,
    setSharedCurrentLine,
    setIsLinePlaying,
  };
}

it('sends MIDI on the first tick and releases a held envelope at note-off', () => {
  const { engine, midi, tick } = setup();
  tick();
  tick({ currentTick: 1 });
  tick({ currentLine: 1 });
  tick({ currentLine: 1, currentTick: 1 });
  expect(midi.sendInstrumentMidiNoteOn).toHaveBeenCalledTimes(2);
  expect(midi.sendInstrumentMidiNoteOn).toHaveBeenCalledWith(0, instrument, 'C#', 4, 8);
  expect(midi.sendInstrumentMidiNoteOffForChannel).toHaveBeenCalledWith(1);
  expect(engine.updateChannelWithInstrument).toHaveBeenCalledWith(
    0,
    instrument,
    { note: 'C#', octave: 4 },
    1,
    8,
  );

  tick({ currentLine: 2 });
  expect(midi.sendInstrumentMidiNoteOffForChannel).toHaveBeenCalledWith(0);
  expect(engine.updateChannelWithInstrument).toHaveBeenLastCalledWith(
    0,
    instrument,
    { note: 'C#', octave: 4 },
    2,
    8,
  );
});

it('updates the tracker row, keeps muted channels silent, and clears playback on stop', () => {
  const { engine, midi, tick, setSharedCurrentLine, setIsLinePlaying } = setup(song, [
    true,
    false,
    false,
  ]);
  tick({ isPatternLoop: true });
  tick({ isPatternLoop: true, currentTick: 1 });
  tick({ isPatternLoop: true, currentPattern: 1, currentLine: 1 });
  expect(engine.writeRegister).toHaveBeenCalledWith(8, 0);
  expect(setSharedCurrentLine.mock.calls).toEqual([[0], [1]]);
  expect(midi.sendInstrumentMidiNoteOn).toHaveBeenCalledTimes(1);
  tick({ isPlaying: false, currentPattern: 1, currentLine: 1 });
  expect(setIsLinePlaying.mock.calls).toEqual([[true], [false]]);
  expect(engine.silenceAll).toHaveBeenCalledOnce();
  expect(engine.endBatch).toHaveBeenCalledTimes(3);
});

it('rewinds and stops at the end of a song with no loop', () => {
  const { tick, stop, setPosition } = setup();
  tick({ currentPattern: 2 });
  expect(setPosition).toHaveBeenCalledWith(0, 0, 0);
  expect(stop).toHaveBeenCalledOnce();
});

it('stops on an empty playlist without seeking', () => {
  const { tick, stop, setPosition } = setup({ ...song, line: [] });
  tick();
  expect(stop).toHaveBeenCalledOnce();
  expect(setPosition).not.toHaveBeenCalled();
});
