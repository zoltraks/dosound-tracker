import type { Instrument, Song } from '../synth/SoundDriver';
import { MAX_INSTRUMENTS, ENVELOPE_LENGTH } from '../constants/music';
import { DEFAULT_BASE_KEY } from '../utils/songParser';
import { isInstrumentEmpty } from '../utils/instrument';

export interface InstrumentCreationResult {
  updatedSong: Song;
  newInstrument: Instrument;
}

export function createNewInstrumentForSong(song: Song): InstrumentCreationResult {
  const instruments = song.instruments;

  let slotIndex = instruments.findIndex((inst) => isInstrumentEmpty(inst));
  if (slotIndex === -1) {
    slotIndex = instruments.length;
  }

  const slotId = slotIndex.toString(16).padStart(2, '0').toUpperCase();

  const newInstrument: Instrument = {
    id: slotId,
    name: `Instrument ${slotIndex}`,
    volume: Array(32).fill(0x0f),
    arpeggio: Array(32).fill(0),
    pitch: Array(32).fill(0),
    noiseEnvelope: Array(32).fill(0),
    mode: Array(32).fill(0),
    base: DEFAULT_BASE_KEY,
    sustain: null,
  };

  const updatedInstruments = [...instruments];
  if (slotIndex < instruments.length) {
    updatedInstruments[slotIndex] = newInstrument;
  } else {
    updatedInstruments.push(newInstrument);
  }

  const updatedSong: Song = {
    ...song,
    instruments: updatedInstruments,
  };

  return { updatedSong, newInstrument };
}

export interface InstrumentUpdateResult {
  updatedSong: Song;
  updatedInstrument: Instrument;
}

export function updateInstrumentInSong(
  song: Song,
  currentInstrument: Instrument,
  updates: Partial<Instrument>,
): InstrumentUpdateResult {
  const instruments = [...song.instruments];

  let targetIndex = instruments.findIndex((inst) => inst.id === currentInstrument.id);
  const updatedInstrument: Instrument = { ...currentInstrument, ...updates } as Instrument;

  if (targetIndex === -1) {
    const slotFromId = parseInt(currentInstrument.id, 16);
    if (Number.isFinite(slotFromId) && slotFromId >= 0 && slotFromId < MAX_INSTRUMENTS) {
      const clamped = slotFromId;

      for (let i = instruments.length; i <= clamped; i += 1) {
        if (!instruments[i]) {
          const slotId = i.toString(16).padStart(2, '0').toUpperCase();
          instruments[i] = {
            id: slotId,
            name: '',
            volume: Array(ENVELOPE_LENGTH).fill(0),
            arpeggio: Array(ENVELOPE_LENGTH).fill(0),
            pitch: Array(ENVELOPE_LENGTH).fill(0),
            noiseEnvelope: Array(ENVELOPE_LENGTH).fill(0),
            mode: Array(ENVELOPE_LENGTH).fill(0),
            sustain: null,
          };
        }
      }

      targetIndex = clamped;
    }
  }

  if (targetIndex >= 0) {
    instruments[targetIndex] = updatedInstrument;
  } else {
    instruments.push(updatedInstrument);
  }

  const updatedSong: Song = {
    ...song,
    instruments,
  };

  return { updatedSong, updatedInstrument };
}

export function applyLoadedInstrumentToSong(
  song: Song,
  currentInstrumentId: string,
  newInstrument: Instrument,
): Song {
  const instruments = [...song.instruments];

  let targetIndex = instruments.findIndex((inst) => inst.id === currentInstrumentId);

  if (targetIndex === -1) {
    const slotFromId = parseInt(currentInstrumentId, 16);
    if (Number.isFinite(slotFromId) && slotFromId >= 0 && slotFromId < MAX_INSTRUMENTS) {
      const clamped = slotFromId;

      for (let i = instruments.length; i <= clamped; i += 1) {
        if (!instruments[i]) {
          const slotId = i.toString(16).padStart(2, '0').toUpperCase();
          instruments[i] = {
            id: slotId,
            name: '',
            volume: Array(ENVELOPE_LENGTH).fill(0),
            arpeggio: Array(ENVELOPE_LENGTH).fill(0),
            pitch: Array(ENVELOPE_LENGTH).fill(0),
            noiseEnvelope: Array(ENVELOPE_LENGTH).fill(0),
            mode: Array(ENVELOPE_LENGTH).fill(0),
            sustain: null,
          };
        }
      }

      targetIndex = clamped;
    }
  }

  if (targetIndex >= 0) {
    instruments[targetIndex] = newInstrument;
  } else {
    instruments.push(newInstrument);
  }

  return {
    ...song,
    instruments,
  };
}
