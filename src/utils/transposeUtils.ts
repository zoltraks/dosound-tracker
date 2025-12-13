import type { Pattern, PatternLine } from '../synth/SoundDriver';
import { MAX_OCTAVE, MIN_OCTAVE, NOTES } from '../constants/music';

export interface ApplyTransposeOptions {
  semitones: number;
  instrumentScope: 'all' | 'selected';
  selectedInstrumentId: string;
  normalizeInstrumentId: (value?: string | number | null) => string;
}

export interface ApplyTransposeResult {
  patternCount: number;
  notesChanged: number;
  clippedLow: number;
  clippedHigh: number;
}

export function transposePatterns(args: {
  patterns: Pattern[];
  patternIds: Set<string>;
  options: ApplyTransposeOptions;
}): { patterns: Pattern[]; result: ApplyTransposeResult } {
  const { patterns, patternIds, options } = args;

  if (patternIds.size === 0) {
    return {
      patterns,
      result: {
        patternCount: 0,
        notesChanged: 0,
        clippedLow: 0,
        clippedHigh: 0,
      },
    };
  }

  const selectedInstrumentIdNorm = options.normalizeInstrumentId(options.selectedInstrumentId);
  const minSemitone = MIN_OCTAVE * 12;
  const maxSemitone = MAX_OCTAVE * 12 + 11;

  let notesChanged = 0;
  let clippedLow = 0;
  let clippedHigh = 0;

  const updatedPatterns = patterns.map((pattern) => {
    if (!patternIds.has(pattern.id)) {
      return pattern;
    }

    const newLines = (pattern.lines || []).map((line) => {
      const newLine = { ...line } as PatternLine;
      const cell = newLine.trackA;

      if (!cell || cell.note === '===') {
        return newLine;
      }

      if (
        options.instrumentScope === 'selected' &&
        options.normalizeInstrumentId(cell.instrument) !== selectedInstrumentIdNorm
      ) {
        return newLine;
      }

      const noteIndex = NOTES.indexOf(String(cell.note).toUpperCase());
      if (noteIndex < 0) {
        return newLine;
      }

      const originalSemitone = cell.octave * 12 + noteIndex;
      let newSemitone = originalSemitone + options.semitones;

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

  return {
    patterns: updatedPatterns,
    result: {
      patternCount: patternIds.size,
      notesChanged,
      clippedLow,
      clippedHigh,
    },
  };
}
