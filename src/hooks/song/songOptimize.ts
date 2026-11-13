import type { Instrument, Song, Pattern, Step, Note } from '../../synth/SoundDriver.ts';
import { PATTERN_LENGTH } from '../../constants/music.ts';
import { normalizeInstrumentId } from '../../utils/instrument/instrumentSelection.ts';

export interface OptimizeSongResult {
  optimizedSong: Song;
  summary: string;
}

export function optimizeSongData(song: Song): OptimizeSongResult {
  const patternLength = song.length || PATTERN_LENGTH;

  const usedPatternIds = new Set<string>();
  song.line.forEach((entry) => {
    [entry.A, entry.B, entry.C].forEach((id) => {
      if (typeof id === 'string') {
        const trimmed = id.trim();
        if (trimmed && trimmed !== '--') {
          usedPatternIds.add(trimmed);
        }
      }
    });
  });

  const newPatterns: Pattern[] = [];
  const removedPatternIds: string[] = [];
  const trimmedLinesInfo: { id: string; name: string; removed: number }[] = [];

  song.pattern.forEach((pattern) => {
    if (!usedPatternIds.has(pattern.id)) {
      removedPatternIds.push(pattern.id);
      return;
    }

    const existingLines = pattern.step || [];
    const removedCount =
      existingLines.length > patternLength ? existingLines.length - patternLength : 0;

    let newLines = existingLines;

    if (removedCount > 0) {
      newLines = existingLines.slice(0, patternLength);
      trimmedLinesInfo.push({ id: pattern.id, name: pattern.name, removed: removedCount });
    } else if (existingLines.length < patternLength) {
      const emptyLine: Step = { note: null };
      const extra = Array.from({ length: patternLength - existingLines.length }, () => ({
        ...emptyLine,
      }));
      newLines = [...existingLines, ...extra];
    }

    newPatterns.push({ ...pattern, step: newLines });
  });

  const usedInstrumentIds = new Set<string>();
  newPatterns.forEach((pattern) => {
    (pattern.step || []).forEach((line) => {
      type NoteWithLegacyInstrument = Note & { instrument: string | number };
      const note = line.note as NoteWithLegacyInstrument | null;
      if (note && note.instrument !== undefined && note.instrument !== null) {
        let id = '';
        if (typeof note.instrument === 'string') {
          id = normalizeInstrumentId(note.instrument);
        } else if (typeof note.instrument === 'number') {
          id = normalizeInstrumentId(Math.floor(note.instrument));
        }
        if (id) {
          usedInstrumentIds.add(id);
        }
      }
    });
  });

  const newInstruments: Instrument[] = [];
  const removedInstrumentIds: string[] = [];

  song.instrument.forEach((inst) => {
    if (!inst) return;

    const idNorm = normalizeInstrumentId(inst.id);
    if (idNorm && usedInstrumentIds.has(idNorm)) {
      newInstruments.push(inst);
    } else {
      removedInstrumentIds.push(inst.id || 'unknown');
    }
  });

  const optimizedSong: Song = {
    ...song,
    length: patternLength,
    pattern: newPatterns,
    instrument: newInstruments,
  };

  const summaryLines: string[] = [];
  summaryLines.push('Optimization complete.');
  summaryLines.push('');

  const hasRemovedPatterns = removedPatternIds.length > 0;
  const hasRemovedInstruments = removedInstrumentIds.length > 0;
  const hasTrimmedLines = trimmedLinesInfo.length > 0;

  if (hasRemovedPatterns) {
    summaryLines.push(
      `Removed patterns: ${removedPatternIds.length}` + ` (${removedPatternIds.join(', ')})`,
    );
  }

  if (hasRemovedInstruments) {
    summaryLines.push(
      `Removed instruments: ${removedInstrumentIds.length}` +
        ` (${removedInstrumentIds.join(', ')})`,
    );
  }

  if (hasTrimmedLines) {
    if (hasRemovedPatterns || hasRemovedInstruments) {
      summaryLines.push('');
    }
    summaryLines.push('Trimmed pattern lines:');
    trimmedLinesInfo.forEach((info) => {
      summaryLines.push(
        `- Pattern ${info.id} (${info.name || 'unnamed'}): ${info.removed} lines above length ${patternLength}`,
      );
    });
  }

  if (!hasRemovedPatterns && !hasRemovedInstruments && !hasTrimmedLines) {
    summaryLines.push('No patterns or instruments were removed and no pattern lines were trimmed.');
  }

  return {
    optimizedSong,
    summary: summaryLines.join('\n'),
  };
}
