import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePlaybackSimulation } from '../../../src/hooks/playback/usePlaybackSimulation.ts';
import type { SequencerState } from '../../../src/hooks/sequencer/useSequencer.ts';
import { useSequencerIntegration } from '../../../src/hooks/sequencer/useSequencerIntegration.ts';
import {
  simulateSong,
  type SimulationFrame,
} from '../../../src/utils/playback/playbackSimulation.ts';
import { updateChannelWithInstrument as applyChannelInstrument } from '../../../src/synth/channelInstrument.ts';
import { YM_CLOCK } from '../../../src/synth/YM2149.ts';
import type { Instrument, Note, Pattern, Song } from '../../../src/synth/SoundDriver.ts';
import type { SoundEngine } from '../../../src/synth/soundEngine.ts';
import { ENVELOPE_LENGTH } from '../../../src/constants/music.ts';

// Live/offline playback parity contract (change record
// docs/change/1.6.8/live-offline-parity-contract.md, audit finding
// FND-ARC-001). The live tick/envelope machine in
// useSequencerIntegration and the export simulation in
// playbackSimulation implement the same register-driving logic twice -
// deliberately, so exports stay deterministic and independent of the
// AudioWorklet clock. This suite pins the parity: for an identical song,
// clock, and initial register state, both paths must produce the same
// per-tick register stream and the same per-channel playback state.
//
// Seam: the live hook is driven through renderHook with a
// register-capture SoundEngine - a fake that stores writes in a plain
// 16-register file and delegates updateChannelWithInstrument to the
// shared channelInstrument translation, exactly as YM2149 and
// AyumiEngine do. After every sequencerCallback tick the register file
// and the playback-state refs are snapshotted and diffed against the
// SimulationFrame stream of simulateSong on the same song.
//
// Contract preconditions (documented in the implementation plan):
// - channel mutes off (mute is a live-only UI concept exports ignore),
// - a single non-looping pass (simulateSong never loops; song.loop is
//   live-only),
// - the register file starts from the simulation's own initial state
//   (mixer 0x38 = tones enabled, noise disabled),
// - pattern channels open each playlist position after the first with
//   an explicit note: the live path deliberately carries released and
//   sustained notes across positions while the simulation resets
//   pattern-channel state, so boundary-sustain songs sit outside the
//   contract until that drift is resolved.

afterEach(cleanup);

const REGISTER_COUNT = 16;
const MIXER_REGISTER = 0x07;
const INITIAL_MIXER = 0x38;
const MAX_REPORTED_MISMATCHES = 100;

const REGISTER_LABELS = [
  'R0',
  'R1',
  'R2',
  'R3',
  'R4',
  'R5',
  'R6',
  'R7',
  'R8',
  'R9',
  'R10',
  'R11',
  'R12',
  'R13',
  'R14',
  'R15',
];

const envelope = (steps: number[]): number[] => {
  const filled = new Array<number>(ENVELOPE_LENGTH).fill(steps[steps.length - 1] ?? 0);
  steps.forEach((value, index) => {
    filled[index] = value;
  });
  return filled;
};

const instrument = (id: string, overrides: Partial<Instrument> = {}): Instrument => ({
  id,
  name: `Instrument ${id}`,
  volume: envelope([15, 15, 12, 12, 8, 8, 4, 4, 0]),
  shift: envelope([0]),
  pitch: envelope([0]),
  noise: envelope([0]),
  mode: envelope([0]),
  sustain: null,
  ...overrides,
});

const noteOn = (noteName: string, octave: number, instrumentId: string): Note => ({
  note: noteName,
  octave,
  instrument: instrumentId,
});

const noteOff = (): Note => ({ note: '===', octave: 0, instrument: '' });

interface StepSpec {
  note?: Note | null;
  volume?: number | null;
}

const makePattern = (id: string, rows: (StepSpec | null)[]): Pattern => ({
  id,
  name: `Pattern ${id}`,
  step: rows.map((row) => ({
    note: row?.note ?? null,
    volume: row?.volume ?? undefined,
  })),
});

// A SoundEngine backed by a plain register file that mirrors the shared
// RegisterFile semantics the real engines use (8-bit masking, read-your-
// writes) and delegates instrument translation to the same
// channelInstrument module YM2149 and AyumiEngine call. Batching is a
// no-op because the contract compares register state, not flush timing.
const createRegisterEngine = (clock: number) => {
  const registers = new Array<number>(REGISTER_COUNT).fill(0);
  registers[MIXER_REGISTER] = INITIAL_MIXER;

  const io = {
    readRegister: (register: number) => registers[register] ?? 0,
    writeRegister: (register: number, value: number) => {
      registers[register] = value & 0xff;
    },
    beginBatch: () => {},
    endBatch: () => {},
  };

  const engine = {
    writeRegister: io.writeRegister,
    beginBatch: io.beginBatch,
    endBatch: io.endBatch,
    silenceAll: () => {
      for (let channel = 0; channel < 3; channel++) {
        registers[8 + channel] = 0;
      }
    },
    updateChannelWithInstrument: (
      channel: number,
      inst: Instrument,
      noteData?: { note: string; octave: number },
      envelopeTick?: number,
      volumeModifier?: number | null,
    ) => applyChannelInstrument(io, clock, channel, inst, noteData, envelopeTick, volumeModifier),
  } as unknown as SoundEngine;

  return { registers, engine };
};

interface LiveTickSnapshot {
  chip1Registers: number[];
  chip2Registers: number[] | null;
  envelopeStep: number[];
  subTick: number[];
  sustainIndex: (number | null)[];
  released: boolean[];
  volumeModifier: number[];
  notes: (Note | null)[];
}

const driveLivePlayback = (song: Song, channelCount: number, clock: number): LiveTickSnapshot[] => {
  const chip1 = createRegisterEngine(clock);
  const chip2 = channelCount === 6 ? createRegisterEngine(clock) : null;
  const ym2149Ref = { current: chip1.engine };
  const ym2149Ref2 = { current: chip2 ? chip2.engine : null };
  const midiHelpersRef = {
    current: {
      sendInstrumentMidiNoteOn: vi.fn(),
      sendInstrumentMidiNoteOffForChannel: vi.fn(),
    },
  };

  const { result } = renderHook(() => {
    const playbackState = usePlaybackSimulation(ym2149Ref, midiHelpersRef, ym2149Ref2);
    const integration = useSequencerIntegration({
      currentSong: song,
      patternsById: new Map(song.pattern.map((pattern) => [pattern.id, pattern])),
      channelMutes: Array.from({ length: channelCount }, () => false),
      channelCount,
      ym2149Ref,
      ym2149Ref2,
      midiHelpersRef,
      playbackState,
      isDebugMode: false,
      setSharedCurrentLine: vi.fn(),
      setIsLinePlaying: vi.fn(),
      stop: vi.fn(),
      setPosition: vi.fn(),
      currentInstrument: null,
    });
    return { integration, playbackState };
  });

  // Mirror the sequencer worklet's emission order: playlist position outer,
  // pattern line middle, tick inner - the same nesting simulateSong uses.
  const ticksPerRow = song.speed || 6;
  const lineCount = song.length || 64;
  const snapshots: LiveTickSnapshot[] = [];

  for (let playlistIndex = 0; playlistIndex < song.line.length; playlistIndex++) {
    for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
      for (let tick = 0; tick < ticksPerRow; tick++) {
        const state: SequencerState = {
          isPlaying: true,
          isPatternLoop: false,
          currentPattern: playlistIndex,
          currentLine: lineIndex,
          currentTick: tick,
        };
        result.current.integration.sequencerCallback(state);

        const playback = result.current.playbackState;
        snapshots.push({
          chip1Registers: chip1.registers.slice(),
          chip2Registers: chip2 ? chip2.registers.slice() : null,
          envelopeStep: playback.channelEnvelopeStepRef.current.slice(),
          subTick: playback.channelSubTickRef.current.slice(),
          sustainIndex: playback.channelSustainRef.current.slice(),
          released: playback.channelReleasedRef.current.slice(),
          volumeModifier: playback.channelVolumeModifierRef.current.slice(),
          notes: playback.lastNotesRef.current.slice(),
        });
      }
    }
  }

  return snapshots;
};

const collectSimulationFrames = (song: Song, clock: number): SimulationFrame[] => {
  const frames: SimulationFrame[] = [];
  simulateSong(song, (frame) => frames.push(frame), { clock });
  return frames;
};

const noteLabel = (value: Note | null): string =>
  value ? `${value.note}${value.octave}:${value.instrument}` : 'null';

// Diff the live tick snapshots against the simulation frames and return a
// readable mismatch list. Register comparison covers the full 16-register
// file on both chips; the simulation's sparse RegisterState reads absent
// keys as 0, matching a zeroed register file. Channel state comparison
// covers the fields both machines maintain - sim's isNewNote flag has no
// live counterpart and is excluded.
const collectParityMismatches = (song: Song, channelCount: number, clock: number): string[] => {
  const live = driveLivePlayback(song, channelCount, clock);
  const frames = collectSimulationFrames(song, clock);
  const mismatches: string[] = [];

  const report = (message: string) => {
    if (mismatches.length < MAX_REPORTED_MISMATCHES) {
      mismatches.push(message);
    }
  };

  if (live.length !== frames.length) {
    report(`frame count: live=${live.length} simulation=${frames.length}`);
  }

  const frameCount = Math.min(live.length, frames.length);
  for (let index = 0; index < frameCount; index++) {
    const snapshot = live[index];
    const frame = frames[index];
    const where = `frame ${index} (playlist ${frame.playlistIndex}, line ${frame.patternLineIndex}, tick ${frame.tick})`;

    const ticksPerRow = song.speed || 6;
    const rowsPerPosition = song.length || 64;
    const ticksPerPosition = ticksPerRow * rowsPerPosition;
    const expectedPlaylist = Math.floor(index / ticksPerPosition);
    const expectedLine = Math.floor((index % ticksPerPosition) / ticksPerRow);
    const expectedTick = index % ticksPerRow;
    if (
      frame.playlistIndex !== expectedPlaylist ||
      frame.patternLineIndex !== expectedLine ||
      frame.tick !== expectedTick
    ) {
      report(
        `${where}: unexpected frame coordinates (expected playlist ${expectedPlaylist}, line ${expectedLine}, tick ${expectedTick})`,
      );
    }

    for (let register = 0; register < REGISTER_COUNT; register++) {
      const simulated = frame.registers[register] ?? 0;
      const actual = snapshot.chip1Registers[register] ?? 0;
      if (actual !== simulated) {
        report(`${where}: chip1 ${REGISTER_LABELS[register]} live=${actual} sim=${simulated}`);
      }
      if (frame.registers2) {
        const simulated2 = frame.registers2[register] ?? 0;
        const actual2 = snapshot.chip2Registers?.[register] ?? 0;
        if (actual2 !== simulated2) {
          report(`${where}: chip2 ${REGISTER_LABELS[register]} live=${actual2} sim=${simulated2}`);
        }
      }
    }

    for (let channel = 0; channel < channelCount; channel++) {
      const state = frame.channels[channel];
      const liveNote = snapshot.notes[channel] ?? null;
      if (noteLabel(liveNote) !== noteLabel(state.note)) {
        report(
          `${where}: channel ${channel} note live=${noteLabel(liveNote)} sim=${noteLabel(state.note)}`,
        );
      }
      if (snapshot.envelopeStep[channel] !== state.envelopeStep) {
        report(
          `${where}: channel ${channel} envelopeStep live=${snapshot.envelopeStep[channel]} sim=${state.envelopeStep}`,
        );
      }
      if (snapshot.subTick[channel] !== state.subTick) {
        report(
          `${where}: channel ${channel} subTick live=${snapshot.subTick[channel]} sim=${state.subTick}`,
        );
      }
      if (snapshot.sustainIndex[channel] !== state.sustainIndex) {
        report(
          `${where}: channel ${channel} sustainIndex live=${snapshot.sustainIndex[channel]} sim=${state.sustainIndex}`,
        );
      }
      if (snapshot.released[channel] !== state.released) {
        report(
          `${where}: channel ${channel} released live=${snapshot.released[channel]} sim=${state.released}`,
        );
      }
      if (snapshot.volumeModifier[channel] !== state.volumeModifier) {
        report(
          `${where}: channel ${channel} volumeModifier live=${snapshot.volumeModifier[channel]} sim=${state.volumeModifier}`,
        );
      }
    }
  }

  return mismatches;
};

const expectParity = (song: Song, channelCount: number, clock: number = YM_CLOCK) => {
  const mismatches = collectParityMismatches(song, channelCount, clock);
  try {
    expect(mismatches).toEqual([]);
  } catch (error) {
    console.log(mismatches.join('\n'));
    throw error;
  }
};

// Song fixtures stay inside the documented contract domain: every note
// carries a resolvable instrument id, envelope arrays are fully populated,
// noise-mode steps keep nonzero noise values, pitch/shift deltas stay small
// enough that periods remain in the 12-bit range, and playlist positions
// after the first open with explicit notes on every pattern channel.

const paritySongSingleChip = (): Song => ({
  title: 'Parity single chip',
  author: 'Contract',
  year: 2026,
  speed: 4,
  length: 8,
  instrument: [
    instrument('00', {
      volume: envelope([15, 15, 12, 12, 8, 8, 4, 4, 0, 0, 0, 0, 6, 6, 9, 9]),
      pitch: envelope([0, 0, 2, 2, -2, -2, 0]),
    }),
    instrument('01', {
      volume: envelope([15, 12, 9, 6, 3, 0, 0, 0, 4, 8, 12]),
      sustain: 3,
    }),
    instrument('02', {
      volume: envelope([15, 10, 5, 0, 10, 15]),
      mode: envelope([2, 2, 2, 1, 1, 0]),
      noise: envelope([7, 11, 15, 19, 23, 27]),
    }),
  ],
  pattern: [
    makePattern('00', [
      { note: noteOn('C', 4, '00'), volume: 15 },
      { note: null },
      { note: null, volume: 8 },
      { note: noteOn('D', 4, '00'), volume: 12 },
      { note: noteOff() },
      { note: null },
      { note: null },
      { note: null },
    ]),
    makePattern('01', [
      { note: noteOn('E', 3, '01') },
      { note: noteOff(), volume: 5 },
      { note: null },
      { note: null },
      { note: noteOn('F', 3, '01'), volume: 9 },
      { note: noteOff() },
      { note: null },
      { note: null },
    ]),
    makePattern('02', [
      { note: noteOn('G', 4, '02'), volume: 7 },
      { note: null },
      { note: noteOn('A', 4, '02') },
      { note: null },
      { note: noteOff() },
      { note: noteOn('B', 3, '02'), volume: 3 },
      { note: null },
      { note: null },
    ]),
  ],
  line: [{ A: '00', B: '01', C: '02' }],
});

const paritySongTwoChips = (): Song => ({
  title: 'Parity two chips',
  author: 'Contract',
  year: 2026,
  speed: 3,
  length: 6,
  chipCount: 2,
  instrument: [
    instrument('00'),
    instrument('01', {
      sustain: 2,
      volume: envelope([15, 10, 5, 0, 8, 12]),
    }),
    instrument('02', {
      mode: envelope([2, 2, 0, 0]),
      noise: envelope([9, 17, 25, 31]),
    }),
  ],
  pattern: [
    makePattern('00', [
      { note: noteOn('C', 4, '00') },
      { note: null },
      { note: noteOn('E', 4, '00'), volume: 6 },
      { note: null },
      { note: noteOff() },
      { note: null },
    ]),
    makePattern('01', [
      { note: noteOn('G', 3, '01') },
      { note: noteOff() },
      { note: null },
      { note: null },
      { note: null },
      { note: null },
    ]),
    makePattern('10', [
      { note: noteOn('D', 4, '02') },
      { note: null },
      { note: null },
      { note: noteOff() },
      { note: null },
      { note: null },
    ]),
    makePattern('11', [
      { note: noteOn('A', 3, '00'), volume: 4 },
      { note: null },
      { note: noteOn('C', 4, '01') },
      { note: null },
      { note: null },
      { note: null },
    ]),
    makePattern('12', [
      { note: noteOn('F', 4, '02') },
      { note: noteOff() },
      { note: null },
      { note: noteOn('B', 3, '00') },
      { note: null },
      { note: null },
    ]),
    makePattern('13', [
      { note: noteOn('E', 4, '01'), volume: 11 },
      { note: null },
      { note: null },
      { note: null },
      { note: noteOff() },
      { note: null },
    ]),
  ],
  // Position two re-opens every channel with an explicit note on row 0 so
  // both machines retrigger from identical state at the boundary.
  line: [
    { A: '00', B: '01', C: '--', D: '10', E: '11', F: '--' },
    { A: '00', B: '01', C: '10', D: '12', E: '13', F: '11' },
  ],
});

const paritySongSustained = (): Song => ({
  title: 'Parity sustained note',
  author: 'Contract',
  year: 2026,
  speed: 6,
  length: 6,
  instrument: [instrument('00')],
  // The pattern carries two steps while the song length is six: rows past
  // the step array read as rests, so the note sustains to the end while
  // the '--' channels stay silent on both paths.
  pattern: [makePattern('00', [{ note: noteOn('C', 4, '00'), volume: 10 }, { note: null }])],
  line: [{ A: '00', B: '--', C: '--' }],
});

const paritySongEmpty = (): Song => ({
  title: 'Parity empty playlist',
  author: 'Contract',
  year: 2026,
  speed: 6,
  length: 4,
  instrument: [instrument('00')],
  pattern: [makePattern('00', [{ note: null }, { note: null }])],
  line: [{ A: '--', B: '--', C: '--' }],
});

describe('live/offline playback parity', () => {
  it('produces identical register streams and channel state for a single-chip song', () => {
    expectParity(paritySongSingleChip(), 3);
  });

  it('produces identical register streams on both chips across playlist positions', () => {
    expectParity(paritySongTwoChips(), 6);
  });

  it('keeps a sustained note and rest rows identical on a short pattern', () => {
    expectParity(paritySongSustained(), 3);
  });

  it('produces identical silent streams for an empty playlist', () => {
    expectParity(paritySongEmpty(), 3);
  });

  it('produces identical register streams at a non-default chip clock', () => {
    expectParity(paritySongSingleChip(), 3, 1000000);
  });
});
