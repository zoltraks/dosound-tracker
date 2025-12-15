import type { Song, PatternLine } from '../synth/SoundDriver';
import { NOTES, MIN_OCTAVE, MAX_OCTAVE } from '../constants/music';

export interface TransposeOptions {
  semitones: number;
  scope: 'line' | 'song';
  trackScope: 'current' | 'all';
  instrumentScope: 'all' | 'selected';
  currentPatternIndex: number;
  targetTrackId: 'A' | 'B' | 'C';
  selectedInstrumentId: string;
  normalizeInstrumentId: (value?: string | number | null) => string;
}

export interface TransposeResult {
  patternCount: number;
  notesChanged: number;
  clippedLow: number;
  clippedHigh: number;
}

export function performTranspose(
  song: Song,
  options: TransposeOptions,
  updateSong: (patch: Partial<Song>) => void
): TransposeResult | null {
  const {
    semitones,
    scope,
    trackScope,
    instrumentScope,
    currentPatternIndex,
    targetTrackId,
    selectedInstrumentId,
    normalizeInstrumentId,
  } = options;

  const playlistLength = song.playlist.length;
  if (playlistLength === 0) {
    return null;
  }

  const indices: number[] = [];
  if (scope === 'line') {
    const idx = Math.max(0, Math.min(currentPatternIndex, playlistLength - 1));
    indices.push(idx);
  } else {
    for (let i = 0; i < playlistLength; i += 1) {
      indices.push(i);
    }
  }

  const tracksToProcess: Array<'A' | 'B' | 'C'> =
    trackScope === 'current' ? [targetTrackId] : ['A', 'B', 'C'];

  const patternIds = new Set<string>();

  for (const idx of indices) {
    const entry = song.playlist[idx];
    if (!entry) continue;

    for (const track of tracksToProcess) {
      let patternId = '--';
      switch (track) {
        case 'A':
          patternId = entry.trackA;
          break;
        case 'B':
          patternId = entry.trackB;
          break;
        case 'C':
          patternId = entry.trackC;
          break;
      }

      if (!patternId || patternId === '--' || patternId.startsWith('^^')) {
        continue;
      }

      patternIds.add(patternId);
    }
  }

  if (patternIds.size === 0) {
    return {
      patternCount: 0,
      notesChanged: 0,
      clippedLow: 0,
      clippedHigh: 0,
    };
  }

  const selectedInstrumentIdNorm = normalizeInstrumentId(selectedInstrumentId);
  const minSemitone = MIN_OCTAVE * 12;
  const maxSemitone = MAX_OCTAVE * 12 + 11;

  let notesChanged = 0;
  let clippedLow = 0;
  let clippedHigh = 0;

  const updatedPatterns = song.patterns.map(pattern => {
    if (!patternIds.has(pattern.id)) {
      return pattern;
    }

    const newLines = (pattern.lines || []).map(line => {
      const newLine = { ...line } as PatternLine;
      const cell = newLine.trackA;

      if (!cell || cell.note === '===') {
        return newLine;
      }

      if (
        instrumentScope === 'selected' &&
        normalizeInstrumentId(cell.instrument) !== selectedInstrumentIdNorm
      ) {
        return newLine;
      }

      const noteIndex = NOTES.indexOf(String(cell.note).toUpperCase());
      if (noteIndex < 0) {
        return newLine;
      }

      const originalSemitone = cell.octave * 12 + noteIndex;
      let newSemitone = originalSemitone + semitones;

      if (newSemitone < minSemitone) {
        newSemitone = minSemitone;
        clippedLow += 1;
      } else if (newSemitone > maxSemitone) {
        newSemitone = maxSemitone;
        clippedHigh += 1;
      }

      if (newSemitone === originalSemitone) {
        return newLine;
      }

      const newOctave = Math.floor(newSemitone / 12);
      const newNoteIndex = newSemitone % 12;

      newLine.trackA = {
        ...cell,
        note: NOTES[newNoteIndex],
        octave: newOctave,
      };

      notesChanged += 1;
      return newLine;
    });

    return { ...pattern, lines: newLines };
  });

  updateSong({ patterns: updatedPatterns });

  return {
    patternCount: patternIds.size,
    notesChanged,
    clippedLow,
    clippedHigh,
  };
}
