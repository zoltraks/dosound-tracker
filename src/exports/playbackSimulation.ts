import type { Instrument, Song } from '../synth/SoundDriver';
import { NOTE_FREQUENCIES, NOTE_BASE_OCTAVE } from '../constants/music';
import { YM_CLOCK } from '../synth/YM2149';

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

  const volumeEnv = instrument.volume || [0x0f];
  const arpeggioEnv = instrument.arpeggio || [0];
  const pitchEnv = instrument.pitch || [0];
  const modeEnv = instrument.mode || [0];
  const noiseEnv = instrument.noiseEnvelope || [0];

  const volIdx = Math.min(step, volumeEnv.length - 1);
  const arpIdx = Math.min(step, arpeggioEnv.length - 1);
  const pitchIdx = Math.min(step, pitchEnv.length - 1);
  const modeIdx = Math.min(step, modeEnv.length - 1);
  const noiseIdx = Math.min(step, noiseEnv.length - 1);

  let volume = Math.max(0, Math.min(0x0f, volumeEnv[volIdx] || 0));
  const arpeggio = arpeggioEnv[arpIdx] || 0;
  const pitch = (pitchEnv[pitchIdx] || 0) | 0;
  const mode = modeEnv[modeIdx] || 0;
  const noisePeriod = Math.max(0, Math.min(0x1f, noiseEnv[noiseIdx] || 0));

  if (volumeModifier !== undefined && volumeModifier !== null) {
    const mod = Math.max(0, Math.min(0x0f, volumeModifier | 0));
    volume = Math.floor((volume * mod) / 15);
  }

  regs[0x08 + channel] = volume;

  const baseFreq = NOTE_FREQUENCIES[note.note] || 440.0;
  let frequency = baseFreq * Math.pow(2, note.octave - NOTE_BASE_OCTAVE);
  if (arpeggio !== 0) {
    frequency = frequency * Math.pow(2, arpeggio / 12);
  }

  let period = Math.floor(YM_CLOCK / (16 * frequency)) & 0x0fff;
  if (pitch !== 0) {
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

  if (toneActive || isNewNote) {
    regs[channel * 2] = period & 0xff;
    regs[channel * 2 + 1] = (period >> 8) & 0x0f;
  }

  if (noiseActive && noisePeriod > 0) {
    regs[0x06] = noisePeriod;
  }
}

 export type PlaybackRegisterState = { [register: number]: number };

 export interface PlaybackTickContext {
   playlistIdx: number;
   lineIdx: number;
   tick: number;
 }

 interface PlaybackChannelState {
   note: { note: string; octave: number; instrument: string } | null;
   envelopeStep: number;
   subTick: number;
   isNewNote: boolean;
   volumeModifier: number;
   sustainIndex: number | null;
   released: boolean;
 }

 export interface SimulatePlaybackOptions {
   ticksPerRow: number;
   lineCount: number;
   envelopeTickDivider: 1 | 2;
   initialRegs?: PlaybackRegisterState;
 }

 export function simulateSongPlayback(
   song: Song,
   options: SimulatePlaybackOptions,
   onTick: (regs: PlaybackRegisterState, ctx: PlaybackTickContext) => void
 ): void {
   const { ticksPerRow, lineCount, envelopeTickDivider, initialRegs } = options;

   let regs: PlaybackRegisterState =
     initialRegs ??
     ({
       0x07: 0x38,
       0x08: 0x00,
       0x09: 0x00,
       0x0a: 0x00,
     } satisfies PlaybackRegisterState);

   const channels: PlaybackChannelState[] = [
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

   for (let playlistIdx = 0; playlistIdx < song.playlist.length; playlistIdx++) {
     const playlistEntry = song.playlist[playlistIdx];
     const patterns = [
       song.patterns.find((p) => p.id === playlistEntry.trackA),
       song.patterns.find((p) => p.id === playlistEntry.trackB),
       song.patterns.find((p) => p.id === playlistEntry.trackC),
     ];

     for (let lineIdx = 0; lineIdx < lineCount; lineIdx++) {
       const notes = [
         patterns[0]?.lines[lineIdx]?.trackA || null,
         patterns[1]?.lines[lineIdx]?.trackA || null,
         patterns[2]?.lines[lineIdx]?.trackA || null,
       ];

       const volumes = [
         patterns[0]?.lines[lineIdx]?.volume,
         patterns[1]?.lines[lineIdx]?.volume,
         patterns[2]?.lines[lineIdx]?.volume,
       ];

       for (let tick = 0; tick < ticksPerRow; tick++) {
         const newRegs: PlaybackRegisterState = { ...regs };

         for (let ch = 0; ch < 3; ch++) {
           const pattern = patterns[ch];
           const noteOnRow = notes[ch];
           const channelState = channels[ch];
           const volumeOnRow = volumes[ch];

           if (tick === 0) {
             if (!pattern) {
               // sustain/no-op
             } else if (noteOnRow && noteOnRow.note === '===') {
               const sustainIndex = channelState.sustainIndex;

               if (
                 sustainIndex === null ||
                 sustainIndex === undefined ||
                 sustainIndex < 0 ||
                 !channelState.note
               ) {
                 channelState.note = null;
                 channelState.envelopeStep = 0;
                 channelState.subTick = 0;
                 channelState.isNewNote = false;
                 channelState.sustainIndex = null;
                 channelState.released = false;
                 newRegs[0x08 + ch] = 0x00;
                 continue;
               }

               channelState.released = true;
             } else if (noteOnRow && noteOnRow.note) {
               channelState.note = noteOnRow;
               channelState.envelopeStep = 0;
               channelState.subTick = 0;
               channelState.isNewNote = true;

               const instrument = song.instruments.find((i) => i.id === noteOnRow.instrument);
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

             if (volumeOnRow !== undefined && volumeOnRow !== null) {
               const clamped = Math.max(0, Math.min(0x0f, (volumeOnRow as number) | 0));
               channelState.volumeModifier = clamped;
             }
           }

           if (channelState.note) {
             const instrument = song.instruments.find((i) => i.id === channelState.note!.instrument);
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
                   step = sustainIndex;
                 } else if (isReleased && rawStep <= sustainIndex) {
                   step = sustainIndex + 1;
                 }
               }

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

           if (channelState.note) {
             const rawStep = channelState.envelopeStep;
             const sustainIndex = channelState.sustainIndex;
             const isReleased = channelState.released;

             if (envelopeTickDivider === 2) {
               const sub = (channelState.subTick + 1) % 2;
               channelState.subTick = sub;
               if (sub === 0) {
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
             } else {
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

         onTick(newRegs, { playlistIdx, lineIdx, tick });
         regs = newRegs;
       }
     }
   }
 }
