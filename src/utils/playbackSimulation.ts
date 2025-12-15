import type { Song, Instrument } from '../synth/SoundDriver';
import { NOTE_FREQUENCIES, NOTE_BASE_OCTAVE } from '../constants/music';
import { YM_CLOCK } from '../synth/YM2149';

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
}

/**
 * Simulates the playback of a song and emits frames with register states.
 * @param song The song to simulate
 * @param callback Callback function called for each tick
 * @param options Simulation options
 */
export function simulateSong(
  song: Song, 
  callback: PlaybackCallback, 
  options: SimulationOptions = {}
): void {
  const { retriggerBehavior = 'always' } = options;
  const ticksPerRow = song.speed || 6;
  
  // Initialize register state
  let currentRegs: RegisterState = {
    0x07: 0x38, // Mixer: all tones enabled, noise disabled
    0x08: 0x00, // Volume A
    0x09: 0x00, // Volume B
    0x0A: 0x00, // Volume C
  };
  
  const channels: ChannelState[] = [
    { note: null, envelopeStep: 0, subTick: 0, isNewNote: false, volumeModifier: 0x0f, sustainIndex: null, released: false },
    { note: null, envelopeStep: 0, subTick: 0, isNewNote: false, volumeModifier: 0x0f, sustainIndex: null, released: false },
    { note: null, envelopeStep: 0, subTick: 0, isNewNote: false, volumeModifier: 0x0f, sustainIndex: null, released: false },
  ];
  
  let globalLineIndex = 0;
  let hasEmittedFrame = false;

  // Process each playlist entry
  for (let playlistIdx = 0; playlistIdx < song.line.length; playlistIdx++) {
    const playlistEntry = song.line[playlistIdx];
    // Get patterns for each track
    const patterns = [
      song.pattern.find(p => p.id === playlistEntry.A),
      song.pattern.find(p => p.id === playlistEntry.B),
      song.pattern.find(p => p.id === playlistEntry.C),
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
      channelState.envelopeStep = 0;
      channelState.subTick = 0;
      channelState.isNewNote = false;
      channelState.sustainIndex = null;
      channelState.released = false;
    }
    
    // Process each line in the pattern
    const lineCount = song.length || 64;
    
    for (let lineIdx = 0; lineIdx < lineCount; lineIdx++) {
      // Get notes for this line
      const notes = [
        patterns[0]?.step[lineIdx]?.A || null,
        patterns[1]?.step[lineIdx]?.A || null,
        patterns[2]?.step[lineIdx]?.A || null,
      ];
      // Per-line volume modifiers (shared pattern trackA volume)
      const volumes = [
        patterns[0]?.step[lineIdx]?.volume,
        patterns[1]?.step[lineIdx]?.volume,
        patterns[2]?.step[lineIdx]?.volume,
      ];
      
      // Process each tick in this row
      for (let tick = 0; tick < ticksPerRow; tick++) {
        const newRegs: RegisterState = { ...currentRegs };
        const toneMeta: ToneMetaByChannel = {};
        
        // Process each channel
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
                const isNew = !channelState.note ||
                  channelState.note.note !== noteOnRow.note ||
                  channelState.note.octave !== noteOnRow.octave ||
                  channelState.note.instrument !== noteOnRow.instrument;
                shouldRetrigger = isNew;
              }

              if (shouldRetrigger) {
                channelState.note = noteOnRow;
                channelState.envelopeStep = 0;
                channelState.subTick = 0;
                channelState.isNewNote = true; // Mark as new note to ensure tone registers are written

                const instrument = song.instrument.find(i => i.id === noteOnRow.instrument);
                const rawSustain = instrument?.sustain ?? null;
                if (typeof rawSustain === 'number' && Number.isFinite(rawSustain) && rawSustain >= 0) {
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

            // Update per-channel volume modifier when explicitly present on this row.
            if (volumeOnRow !== undefined && volumeOnRow !== null) {
              const clamped = Math.max(0, Math.min(0x0f, (volumeOnRow as number) | 0));
              channelState.volumeModifier = clamped;
            }
          }
          
          // Update channel with current envelope step
          if (channelState.note) {
            const instrument = song.instrument.find(i => i.id === channelState.note!.instrument);
            if (instrument) {
              const rawStep = channelState.envelopeStep;
              const sustainIndex = channelState.sustainIndex;
              const isReleased = channelState.released;

              let step = rawStep;
              const hasSustain =
                sustainIndex !== null &&
                sustainIndex !== undefined &&
                sustainIndex >= 0;

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
                channelState.volumeModifier
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
          channels: channels.map(c => ({ ...c })), // Shallow copy to protect state
          isFirstFrame: !hasEmittedFrame,
        });
        
        currentRegs = newRegs;
        hasEmittedFrame = true;
      }
    }
    
    globalLineIndex += lineCount;
  }
}

export function applyInstrumentToRegisters(
  regs: { [register: number]: number },
  channel: number,
  note: { note: string; octave: number },
  instrument: Instrument,
  envelopeStep: number,
  isNewNote: boolean,
  volumeModifier?: number | null
): void {
  const step = Math.max(0, envelopeStep);
  
  // Get envelope values
  const volumeEnv = instrument.volume || [0x0F];
  const arpeggioEnv = instrument.arpeggio || [0];
  const pitchEnv = instrument.pitch || [0];
  const modeEnv = instrument.mode || [0];
  const noiseEnv = instrument.noise || [0];
  
  const volIdx = Math.min(step, volumeEnv.length - 1);
  const arpIdx = Math.min(step, arpeggioEnv.length - 1);
  const pitchIdx = Math.min(step, pitchEnv.length - 1);
  const modeIdx = Math.min(step, modeEnv.length - 1);
  const noiseIdx = Math.min(step, noiseEnv.length - 1);
  
  let volume = Math.max(0, Math.min(0x0F, volumeEnv[volIdx] || 0));
  const arpeggio = arpeggioEnv[arpIdx] || 0;
  const pitch = (pitchEnv[pitchIdx] || 0) | 0;
  const mode = modeEnv[modeIdx] || 0;
  const noisePeriod = Math.max(0, Math.min(0x1F, noiseEnv[noiseIdx] || 0));
  
  // Apply optional per-step volume modifier (0-15) as attenuation, 15 = no attenuation.
  if (volumeModifier !== undefined && volumeModifier !== null) {
    const mod = Math.max(0, Math.min(0x0f, volumeModifier | 0));
    volume = Math.floor((volume * mod) / 15);
  }

  // Set volume
  regs[0x08 + channel] = volume;
  
  // Calculate frequency with arpeggio (NOTE_FREQUENCIES are defined for NOTE_BASE_OCTAVE)
  const baseFreq = NOTE_FREQUENCIES[note.note] || 440.0;
  let frequency = baseFreq * Math.pow(2, note.octave - NOTE_BASE_OCTAVE);
  if (arpeggio !== 0) {
    frequency = frequency * Math.pow(2, arpeggio / 12);
  }
  let period = Math.floor(YM_CLOCK / (16 * frequency)) & 0x0FFF;
  if (pitch !== 0) {
    // Apply pitch envelope as a direct delta on the divider value.
    period = (period - pitch) & 0x0FFF;
  }
  
  // Update mixer based on mode
  const toneActive = mode === 0 || mode === 2;
  const noiseActive = mode === 1 || mode === 2;
  
  let mixer = regs[0x07] || 0x38;
  if (toneActive) {
    mixer &= ~(1 << channel);
  } else {
    mixer |= (1 << channel);
  }
  if (noiseActive) {
    mixer &= ~(0x08 << channel);
  } else {
    mixer |= (0x08 << channel);
  }
  regs[0x07] = mixer;
  
  // Set tone period if active (always set for new notes, even if not tone-active in current step)
  if (toneActive || isNewNote) {
    regs[channel * 2] = period & 0xFF;
    regs[channel * 2 + 1] = (period >> 8) & 0x0F;
  }
  
  // Set noise period if active
  if (noiseActive && noisePeriod > 0) {
    regs[0x06] = noisePeriod;
  }
}
