import type { Song, Pattern, PatternLine, Note, Instrument } from '../../synth/SoundDriver';
import type { ExportFormat } from '../../constants/export';
import { PATTERN_LENGTH } from '../../constants/music';
import type {
  ISongService,
  SongTemplate,
  ValidationResult,
  SongOptimizationDetails,
} from '../interfaces/ISongService';

export class SongService implements ISongService {
  async createSong(template?: SongTemplate): Promise<Song> {
    const now = new Date();
    const baseYear =
      typeof template?.year === 'number' && Number.isFinite(template.year)
        ? template.year
        : now.getFullYear();

    const speed =
      typeof template?.speed === 'number' && Number.isFinite(template.speed) && template.speed > 0
        ? Math.floor(template.speed)
        : 6;

    const patternLength =
      typeof template?.patternLength === 'number' && Number.isFinite(template.patternLength)
        ? Math.floor(template.patternLength)
        : PATTERN_LENGTH;

    const song: Song = {
      title: template?.title ?? '',
      author: template?.author ?? '',
      year: baseYear,
      speed,
      patternLength,
      loop: template?.loop ?? null,
      patterns: template?.patterns ?? [],
      playlist: template?.playlist ?? [],
      instruments: template?.instruments ?? [],
    };

    return song;
  }

  async updateSong(current: Song, updates: Partial<Song>): Promise<Song> {
    const merged: Song = {
      ...current,
      ...updates,
    };
    return merged;
  }

  async deleteSong(song: Song): Promise<void> {
    void song;
  }

  validateSong(song: Song): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!song.title || !song.title.trim()) {
      warnings.push('Song title is empty.');
    }

    if (!song.patterns || song.patterns.length === 0) {
      errors.push('Song has no patterns.');
    }

    if (!song.playlist || song.playlist.length === 0) {
      warnings.push('Song playlist is empty.');
    }

    if (!song.instruments || song.instruments.length === 0) {
      warnings.push('Song has no instruments.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  optimizeSong(song: Song): SongOptimizationDetails {
    const patternLength = song.patternLength || PATTERN_LENGTH;

    const usedPatternIds = new Set<string>();
    song.playlist.forEach(entry => {
      [entry.trackA, entry.trackB, entry.trackC].forEach(id => {
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

    song.patterns.forEach(pattern => {
      if (!usedPatternIds.has(pattern.id)) {
        removedPatternIds.push(pattern.id);
        return;
      }

      const existingLines = pattern.lines || [];
      const removedCount =
        existingLines.length > patternLength ? existingLines.length - patternLength : 0;

      let newLines = existingLines;

      if (removedCount > 0) {
        newLines = existingLines.slice(0, patternLength);
        trimmedLinesInfo.push({ id: pattern.id, name: pattern.name, removed: removedCount });
      } else if (existingLines.length < patternLength) {
        const emptyLine: PatternLine = { trackA: null, trackB: null, trackC: null };
        const extra = Array.from({ length: patternLength - existingLines.length }, () => ({
          ...emptyLine,
        }));
        newLines = [...existingLines, ...extra];
      }

      newPatterns.push({ ...pattern, lines: newLines });
    });

    const usedInstrumentIds = new Set<string>();
    newPatterns.forEach(pattern => {
      (pattern.lines || []).forEach(line => {
        (['trackA', 'trackB', 'trackC'] as const).forEach(trackKey => {
          type NoteWithLegacyInstrument = Note & { instrument: string | number };
          const note = line[trackKey] as NoteWithLegacyInstrument | null;
          if (note && note.instrument !== undefined && note.instrument !== null) {
            let id = '';
            if (typeof note.instrument === 'string') {
              id = note.instrument.trim().toUpperCase();
            } else if (typeof note.instrument === 'number') {
              id = Math.floor(note.instrument)
                .toString(16)
                .padStart(2, '0')
                .toUpperCase();
            }
            if (id) {
              usedInstrumentIds.add(id);
            }
          }
        });
      });
    });

    const newInstruments: Instrument[] = [];
    const removedInstrumentIds: string[] = [];

    song.instruments.forEach(inst => {
      if (!inst) return;

      const idNorm = (inst.id || '').trim().toUpperCase();
      if (idNorm && usedInstrumentIds.has(idNorm)) {
        newInstruments.push(inst);
      } else {
        removedInstrumentIds.push(inst.id || 'unknown');
      }
    });

    const optimizedSong: Song = {
      ...song,
      patternLength,
      patterns: newPatterns,
      instruments: newInstruments,
    };

    return {
      optimizedSong,
      removedPatternIds,
      removedInstrumentIds,
      trimmedLinesInfo,
    };
  }

  async exportSong(song: Song, format: ExportFormat): Promise<Blob> {
    void song;
    void format;
    return new Blob();
  }
}
