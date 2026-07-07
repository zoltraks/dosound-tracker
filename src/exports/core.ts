import type { Song, Instrument, Pattern, Step } from '../synth/SoundDriver';
import { NOTES, PATTERN_LENGTH } from '../constants/music';
import { YM_CLOCK } from '../synth/YM2149';
import { DEFAULT_SONG_FRAME, DEFAULT_SONG_CLOCK } from '../constants/song';
import { parseBaseKey } from '../utils/pianoUtils';

export { downloadFile, type DownloadFileContent } from '../utils/fileOperations';

export function normalizeSongForExport(song: Song): Song {
  return {
    ...song,
    length: song.length ?? PATTERN_LENGTH,
    line: song.line ?? [],
    pattern: song.pattern ?? [],
    instrument: song.instrument ?? [],
    frame: song.frame ?? DEFAULT_SONG_FRAME,
    clock: song.clock ?? DEFAULT_SONG_CLOCK,
  };
}

// Parse base key string like "C-4" or "C#4" into note/octave
export function parseBaseKeyForExport(rawBase?: string): { note: string; octave: number } {
  const fallback = 'C-4';

  const value = (rawBase || fallback).trim();
  const parsed = parseBaseKey(value);
  if (parsed) {
    return parsed;
  }

  const fallbackParsed = parseBaseKey(fallback);
  if (fallbackParsed) {
    return fallbackParsed;
  }

  return { note: 'C', octave: 4 };
}

export function formatNoteLabel(baseNote: string, baseOctave: number, semitoneOffset: number): string {
  const idx = NOTES.indexOf(baseNote);
  if (idx === -1) {
    // Fallback: just use base values
    return baseNote.includes('#') ? `${baseNote}${baseOctave}` : `${baseNote}-${baseOctave}`;
  }

  const total = idx + semitoneOffset;
  const n = NOTES.length;

  let octave = baseOctave;
  let noteIndex = idx;

  if (total >= 0) {
    octave += Math.floor(total / n);
    noteIndex = total % n;
  } else {
    const stepsDown = -total;
    const octaveDelta = Math.floor((stepsDown + n - 1) / n);
    octave -= octaveDelta;
    const mod = ((idx + semitoneOffset) % n + n) % n;
    noteIndex = mod;
  }

  const note = NOTES[noteIndex];
  return note.includes('#') ? `${note}${octave}` : `${note}-${octave}`;
}

export function frequencyToPeriod(frequency: number, clock: number = YM_CLOCK): number {
  if (frequency <= 0) return 0;
  return Math.floor(clock / (16 * frequency));
}

export function formatPitchDelta(delta: number): string {
  return delta ? ` ${delta > 0 ? '+' : ''}${delta}` : '';
}

export function buildInstrumentPreviewSong(instrument: Instrument, sourceSong: Song): Song {
  const normalizedSong = normalizeSongForExport(sourceSong);
  const patternLength = normalizedSong.length || PATTERN_LENGTH;
  const speed = normalizedSong.speed || 6;

  const base = parseBaseKeyForExport(instrument.base || 'C-4');

  const step: Step[] = [];
  for (let i = 0; i < patternLength; i++) {
    step.push({
      note: i === 0 ? { note: base.note, octave: base.octave, instrument: instrument.id } : null,
      volume: undefined,
    });
  }

  const patternId = 'IP';
  const pattern: Pattern = {
    id: patternId,
    name: instrument.name || `Instrument ${instrument.id || ''}`,
    step,
  };

  const titleBase = sourceSong.title || '';
  const suffix = instrument.name
    ? ` - ${instrument.name}`
    : instrument.id
    ? ` - INST ${instrument.id}`
    : ' - Instrument';
  const title = titleBase ? `${titleBase}${suffix}` : `Instrument Preview${suffix}`;

  return {
    ...normalizedSong,
    title,
    speed,
    length: patternLength,
    pattern: [pattern],
    line: [{ A: patternId, B: '--', C: '--' }],
    loop: null,
    instrument: [instrument],
  };
}

export function exportInstrumentWith<T>(
  instrument: Instrument,
  song: Song,
  exporter: (song: Song) => T
): T {
  const previewSong = buildInstrumentPreviewSong(instrument, song);
  return exporter(previewSong);
}
