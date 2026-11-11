import type { Song, Instrument, Pattern } from '../../synth/SoundDriver.ts';
import type { InstrumentId } from '../../types/branded.ts';
import {
  NOTE_FREQUENCIES,
  NOTE_BASE_OCTAVE,
  pow2Octave,
  pow2Semitone,
} from '../../constants/music.ts';
import { YM_CLOCK } from '../../synth/YM2149.ts';
import { clampVolumeNibble } from '../panel/volumeUtils.ts';
import { normalizeInstrumentId } from '../instrument/instrumentSelection.ts';

export interface RegisterState {
  [register: number]: number;
}

export interface ToneMetaByChannel {
  [channel: number]: { note?: string; octave?: number; pitchDelta?: number };
}

export interface ChannelState {
  note: { note: string; octave: number; instrument: string } | null;
  envelopeStep: number;
  subTick: number;
  isNewNote: boolean;
  volumeModifier: number;
  sustainIndex: number | null;
  released: boolean;
}

export interface SimulationFrame {
  registers: RegisterState;
  lineIndex: number;
  playlistIndex: number;
  patternLineIndex: number;
  tick: number;
  toneMeta: ToneMetaByChannel;
  // We expose channels state in case advanced exporters need to inspect it
  channels: ChannelState[];
  isFirstFrame: boolean;
}

export type PlaybackCallback = (frame: SimulationFrame) => void;

export type RetriggerBehavior = 'always' | 'new_note_only';

export interface SimulationOptions {
  retriggerBehavior?: RetriggerBehavior;
  clock?: number;
}

/** Simulates playback of a song, emitting frames with register states for each tick. */
export function simulateSong(
  song: Song,
  callback: PlaybackCallback,
  options: SimulationOptions = {},
): void {
  const { retriggerBehavior = 'always', clock = YM_CLOCK } = options;
  const ticksPerRow = song.speed || 6;

  // Lookup maps built once per simulation. First-wins insertion mirrors the
  // Array.find resolution these replace, including the degenerate '' key an
  // empty-normalizing instrument id would have matched.
  const instrumentsByNormId = new Map<string, Instrument>();
  for (const inst of song.instrument) {
    if (!inst) continue;
    const key = normalizeInstrumentId(inst.id);
    if (!instrumentsByNormId.has(key)) {
      instrumentsByNormId.set(key, inst);
    }
  }

  const patternsByIdMap = new Map<string, Pattern>();
  for (const pattern of song.pattern) {
    if (!pattern) continue;
    if (!patternsByIdMap.has(pattern.id)) {
      patternsByIdMap.set(pattern.id, pattern);
    }
  }

  let currentRegs: RegisterState = {
    0x07: 0x38, // Mixer: all tones enabled, noise disabled
    0x08: 0x00, // Volume A
    0x09: 0x00, // Volume B
    0x0a: 0x00, // Volume C
  };

  const channels: ChannelState[] = [
    {
      note: null,
      envelopeStep: 0,
      subTick: 0,
      isNewNote: false,
      volumeModifier: 0x0f,
      sustainIndex: null,
      released: false,
    },
    {
      note: null,
      envelopeStep: 0,
      subTick: 0,
      isNewNote: false,
      volumeModifier: 0x0f,
      sustainIndex: null,
      released: false,
    },
    {
      note: null,
      envelopeStep: 0,
      subTick: 0,
      isNewNote: false,
      volumeModifier: 0x0f,
      sustainIndex: null,
      released: false,
    },
  ];

  // Normalized instrument id of each channel's active note, maintained at the
  // same sites that assign channelState.note - the held note keeps its id.
  const channelInstrumentIds: (InstrumentId | '')[] = ['', '', ''];

  let globalLineIndex = 0;
  let hasEmittedFrame = false;

  for (let playlistIdx = 0; playlistIdx < song.line.length; playlistIdx++) {
    const playlistEntry = song.line[playlistIdx];
    const patterns = [
      patternsByIdMap.get(playlistEntry.A),
      patternsByIdMap.get(playlistEntry.B),
      patternsByIdMap.get(playlistEntry.C),
    ];

    // Reset channel state if needed
    // At the beginning of each playlist position, only reset playback
    // state for channels that actually reference a pattern. Tracks with
    // "--" should allow any previously playing note to continue
    // sustaining across this playlist position.
    const trackIds = [playlistEntry.A, playlistEntry.B, playlistEntry.C];
    for (let ch = 0; ch < channels.length; ch++) {
      const id = trackIds[ch];
      const hasPattern = typeof id === 'string' && id.trim() !== '' && id !== '--';
      if (!hasPattern) {
        continue;
      }
      const channelState = channels[ch];
      channelState.note = null;
      channelInstrumentIds[ch] = '';
      channelState.envelopeStep = 0;
      channelState.subTick = 0;
      channelState.isNewNote = false;
      channelState.sustainIndex = null;
      channelState.released = false;
    }

    const lineCount = song.length || 64;

    for (let lineIdx = 0; lineIdx < lineCount; lineIdx++) {
      const notes = [
        patterns[0]?.step[lineIdx]?.note || null,
        patterns[1]?.step[lineIdx]?.note || null,
        patterns[2]?.step[lineIdx]?.note || null,
      ];
      const volumes = [
        patterns[0]?.step[lineIdx]?.volume,
        patterns[1]?.step[lineIdx]?.volume,
        patterns[2]?.step[lineIdx]?.volume,
      ];

      for (let tick = 0; tick < ticksPerRow; tick++) {
        const newRegs: RegisterState = { ...currentRegs };
        const toneMeta: ToneMetaByChannel = {};

        for (let ch = 0; ch < 3; ch++) {
          const pattern = patterns[ch];
          const noteOnRow = notes[ch];
          const channelState = channels[ch];
          const volumeOnRow = volumes[ch];

          if (tick === 0) {
            if (!pattern) {
              // No pattern for this channel in this playlist position -
              // leave channelState and newRegs unchanged so any
              // previously playing note keeps sounding.
            } else if (noteOnRow && noteOnRow.note === '===') {
              const sustainIndex = channelState.sustainIndex;

              if (
                sustainIndex === null ||
                sustainIndex === undefined ||
                sustainIndex < 0 ||
                !channelState.note
              ) {
                // No sustain defined (or no active note) - treat as hard mute
                channelState.note = null;
                channelInstrumentIds[ch] = '';
                channelState.envelopeStep = 0;
                channelState.subTick = 0;
                channelState.isNewNote = false;
                channelState.sustainIndex = null;
                channelState.released = false;
                newRegs[0x08 + ch] = 0x00;
                continue;
              }

              // Instrument has a sustain point and a note is active: this
              // note-off acts as a release trigger instead of an immediate
              // mute. Keep holding the last note and allow the envelope to
              // continue past the sustain position.
              channelState.released = true;
            } else if (noteOnRow && noteOnRow.note) {
              let shouldRetrigger = true;

              if (retriggerBehavior === 'new_note_only') {
                const isNew =
                  !channelState.note ||
                  channelState.note.note !== noteOnRow.note ||
                  channelState.note.octave !== noteOnRow.octave ||
                  channelInstrumentIds[ch] !== normalizeInstrumentId(noteOnRow.instrument);
                shouldRetrigger = isNew;
              }

              if (shouldRetrigger) {
                const noteInstrumentId = normalizeInstrumentId(noteOnRow.instrument);
                channelState.note = noteOnRow;
                channelInstrumentIds[ch] = noteInstrumentId;
                channelState.envelopeStep = 0;
                channelState.subTick = 0;
                channelState.isNewNote = true; // Mark as new note to ensure tone registers are written

                const instrument = instrumentsByNormId.get(noteInstrumentId);
                const rawSustain = instrument?.sustain ?? null;
                if (
                  typeof rawSustain === 'number' &&
                  Number.isFinite(rawSustain) &&
                  rawSustain >= 0
                ) {
                  channelState.sustainIndex = Math.floor(rawSustain);
                } else {
                  channelState.sustainIndex = null;
                }
                channelState.released = false;
              } else {
                channelState.isNewNote = false;
              }
            } else {
              channelState.isNewNote = false;
            }

            if (volumeOnRow !== undefined && volumeOnRow !== null) {
              channelState.volumeModifier = clampVolumeNibble(volumeOnRow as number);
            }
          }

          if (channelState.note) {
            const instrument = instrumentsByNormId.get(channelInstrumentIds[ch]);
            if (instrument) {
              const rawStep = channelState.envelopeStep;
              const sustainIndex = channelState.sustainIndex;
              const isReleased = channelState.released;

              let step = rawStep;
              const hasSustain =
                sustainIndex !== null && sustainIndex !== undefined && sustainIndex >= 0;

              if (hasSustain) {
                if (!isReleased && rawStep >= sustainIndex) {
                  // Key is still held: clamp to sustain step.
                  step = sustainIndex;
                } else if (isReleased && rawStep <= sustainIndex) {
                  // Key was just released while held at sustain: jump to the
                  // first post-sustain step immediately for this tick.
                  step = sustainIndex + 1;
                }
              }

              // Capture original note and pitch delta from the instrument's
              // pitch envelope for this channel/frame so TA comments can use
              // "C-4 +N" instead of an inferred note name.
              let pitchDeltaForStep = 0;
              const pitchEnv = instrument.pitch || [];
              if (pitchEnv.length > 0) {
                const pitchIdx = Math.min(Math.max(step, 0), pitchEnv.length - 1);
                const pitchValue = pitchEnv[pitchIdx];
                if (typeof pitchValue === 'number') {
                  pitchDeltaForStep = pitchValue | 0;
                }
              }

              toneMeta[ch] = {
                note: channelState.note.note,
                octave: channelState.note.octave,
                pitchDelta: pitchDeltaForStep,
              };

              applyInstrumentToRegisters(
                newRegs,
                ch,
                channelState.note,
                instrument,
                step,
                channelState.isNewNote,
                channelState.volumeModifier,
                clock,
              );
            }
          }

          // Advance envelope timing (every 2 frames = 40ms)
          if (channelState.note) {
            const sub = (channelState.subTick + 1) % 2;
            channelState.subTick = sub;
            if (sub === 0) {
              const rawStep = channelState.envelopeStep;
              const sustainIndex = channelState.sustainIndex;
              const isReleased = channelState.released;

              if (
                sustainIndex === null ||
                sustainIndex === undefined ||
                sustainIndex < 0 ||
                isReleased ||
                rawStep < sustainIndex
              ) {
                channelState.envelopeStep = rawStep + 1;
              }
            }
          }
        }

        callback({
          registers: newRegs,
          lineIndex: globalLineIndex + lineIdx,
          playlistIndex: playlistIdx,
          patternLineIndex: lineIdx,
          tick: tick,
          toneMeta,
          channels: channels.map((c) => ({ ...c })), // Shallow copy to protect state
          isFirstFrame: !hasEmittedFrame,
        });

        currentRegs = newRegs;
        hasEmittedFrame = true;
      }
    }

    globalLineIndex += lineCount;
  }
}

function applyInstrumentToRegisters(
  regs: { [register: number]: number },
  channel: number,
  note: { note: string; octave: number },
  instrument: Instrument,
  envelopeStep: number,
  isNewNote: boolean,
  volumeModifier?: number | null,
  clock: number = YM_CLOCK,
): void {
  const step = Math.max(0, envelopeStep);

  const volumeEnv = instrument.volume || [0x0f];
  const shiftEnv = instrument.shift || [0];
  const pitchEnv = instrument.pitch || [0];
  const modeEnv = instrument.mode || [0];
  const noiseEnv = instrument.noise || [0];

  const volIdx = Math.min(step, volumeEnv.length - 1);
  const shiftIdx = Math.min(step, shiftEnv.length - 1);
  const pitchIdx = Math.min(step, pitchEnv.length - 1);
  const modeIdx = Math.min(step, modeEnv.length - 1);
  const noiseIdx = Math.min(step, noiseEnv.length - 1);

  let volume = Math.max(0, Math.min(0x0f, volumeEnv[volIdx] || 0));
  const shift = shiftEnv[shiftIdx] || 0;
  const pitch = (pitchEnv[pitchIdx] || 0) | 0;
  const mode = modeEnv[modeIdx] || 0;
  const noisePeriod = Math.max(0, Math.min(0x1f, noiseEnv[noiseIdx] || 0));

  // Apply optional per-step volume modifier (0-15) as attenuation, 15 = no attenuation.
  if (volumeModifier !== undefined && volumeModifier !== null) {
    const mod = clampVolumeNibble(volumeModifier);
    volume = Math.floor((volume * mod) / 15);
  }

  regs[0x08 + channel] = volume;

  // Calculate frequency with shift (NOTE_FREQUENCIES are defined for NOTE_BASE_OCTAVE)
  const baseFreq = NOTE_FREQUENCIES[note.note] || 440.0;
  let frequency = baseFreq * pow2Octave(note.octave - NOTE_BASE_OCTAVE);
  if (shift !== 0) {
    frequency = frequency * pow2Semitone(shift);
  }
  let period = Math.floor(clock / (16 * frequency)) & 0x0fff;
  if (pitch !== 0) {
    // Apply pitch envelope as a direct delta on the divider value.
    period = (period - pitch) & 0x0fff;
  }

  const toneActive = mode === 0 || mode === 2;
  const noiseActive = mode === 1 || mode === 2;

  let mixer = regs[0x07] || 0x38;
  if (toneActive) {
    mixer &= ~(1 << channel);
  } else {
    mixer |= 1 << channel;
  }
  if (noiseActive) {
    mixer &= ~(0x08 << channel);
  } else {
    mixer |= 0x08 << channel;
  }
  regs[0x07] = mixer;

  // Set tone period if active (always set for new notes, even if not tone-active in current step)
  if (toneActive || isNewNote) {
    regs[channel * 2] = period & 0xff;
    regs[channel * 2 + 1] = (period >> 8) & 0x0f;
  }

  if (noiseActive && noisePeriod > 0) {
    regs[0x06] = noisePeriod;
  }
}
