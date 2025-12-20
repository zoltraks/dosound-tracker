import type { Song, Instrument, Pattern, Step } from '../synth/SoundDriver';
import { NOTES, PATTERN_LENGTH } from '../constants/music';
import { YM_CLOCK } from '../synth/YM2149';
import { ensureBaseKey } from '../utils/songFormat';

export { downloadFile, type DownloadFileContent } from '../utils/fileOperations';

export function normalizeSongForExport(song: Song): Song {
  return {
    ...song,
    length: song.length ?? PATTERN_LENGTH,
    line: song.line ?? [],
    pattern: song.pattern ?? [],
    instrument: song.instrument ?? [],
  };
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

export function frequencyToPeriod(frequency: number): number {
  if (frequency <= 0) return 0;
  return Math.floor(YM_CLOCK / (16 * frequency));
}

export function buildInstrumentPreviewSong(instrument: Instrument, sourceSong: Song): Song {
  const normalizedSong = normalizeSongForExport(sourceSong);
  const patternLength = normalizedSong.length || PATTERN_LENGTH;
  const speed = normalizedSong.speed || 6;

  const base = ensureBaseKey(instrument.base || 'C-4');

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
