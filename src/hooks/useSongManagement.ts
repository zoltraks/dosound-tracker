import type { Instrument, Song, Pattern, Step, Note } from '../synth/SoundDriver';
import { PATTERN_LENGTH } from '../constants/music';
import defaultSongYaml from '../assets/song.yaml?raw';
import {
  DEFAULT_BASE_KEY,
  DEFAULT_SONG_TITLE,
  DEFAULT_SONG_AUTHOR,
  parseSongFromYaml,
} from '../utils/songParser';

export type TrackKey = 'A' | 'B' | 'C';

export type StoredInstrumentForMigration = {
  volume?: unknown;
  volumeEnvelope?: unknown;
};

export type StoredSongForMigration = {
  instruments?: StoredInstrumentForMigration[] | undefined;
  speed?: unknown;
  [key: string]: unknown;
};

export const SONG_STORAGE_KEY = 'dosound-tracker-song';

function normalizeStoredSongToCurrentSchema(rawSong: unknown): Song {
  const song = (rawSong || {}) as Record<string, unknown>;

  const lengthRaw = song.length;
  const legacyLengthRaw = song.patternLength;
  const length =
    typeof lengthRaw === 'number' && Number.isFinite(lengthRaw)
      ? Math.floor(lengthRaw)
      : typeof legacyLengthRaw === 'number' && Number.isFinite(legacyLengthRaw)
        ? Math.floor(legacyLengthRaw)
        : PATTERN_LENGTH;

  const rawPatterns = (song.pattern ?? song.patterns) as unknown;
  const patternSource = Array.isArray(rawPatterns) ? rawPatterns : [];
  const pattern = patternSource.map((raw) => {
    const p = (raw || {}) as Record<string, unknown>;
    const rawSteps = (p.step ?? p.lines) as unknown;
    const stepSource = Array.isArray(rawSteps) ? rawSteps : [];
    const step = stepSource.map((rawStep) => {
      const s = (rawStep || {}) as Record<string, unknown>;
      const legacyNote = (
        (s.note ??
          s.A ??
          s.trackA ??
          s.B ??
          s.trackB ??
          s.C ??
          s.trackC ??
          null) as Note | null
      );
      return {
        note: legacyNote,
        volume: (s.volume as number | null | undefined) ?? undefined,
      } as Step;
    });

    return {
      ...(p as unknown as Pattern),
      step,
    };
  });

  const rawLine = (song.line ?? song.playlist) as unknown;
  const lineSource = Array.isArray(rawLine) ? rawLine : [];
  const line = lineSource.map((rawEntry) => {
    const entry = (rawEntry || {}) as Record<string, unknown>;
    return {
      A: String((entry.A ?? entry.trackA ?? '--') as string),
      B: String((entry.B ?? entry.trackB ?? '--') as string),
      C: String((entry.C ?? entry.trackC ?? '--') as string),
    };
  });

  const rawInstruments = (song.instrument ?? song.instruments) as unknown;
  const instrumentSource = Array.isArray(rawInstruments) ? rawInstruments : [];
  const instrument = instrumentSource.map((rawInst) => {
    const inst = (rawInst || {}) as Record<string, unknown>;
    const noise = (inst.noise ?? inst.noiseEnvelope ?? []) as number[];
    return {
      ...(inst as unknown as Instrument),
      noise,
    };
  });

  return {
    ...(song as unknown as Song),
    length,
    pattern,
    line,
    instrument,
  };
}

export const createDefaultSong = (): Song => {
  const defaultPatternLength = PATTERN_LENGTH;

  const defaultPatternA: Pattern = {
    id: '01',
    name: 'Pattern 01',
    step: Array.from({ length: defaultPatternLength }, (_, i) => {
      const line: Step = { note: null };

      if (i % 8 === 0) line.note = { note: 'C', octave: 4, instrument: '00' };
      if (i % 8 === 2) line.note = { note: 'E', octave: 4, instrument: '00' };
      if (i % 8 === 4) line.note = { note: 'G', octave: 4, instrument: '00' };
      if (i % 8 === 6) line.note = { note: 'E', octave: 4, instrument: '00' };

      return line;
    }),
  };

  const defaultPatternB: Pattern = {
    id: '02',
    name: 'Pattern 02',
    step: Array.from({ length: defaultPatternLength }, (_, i) => {
      const line: Step = { note: null };

      if (i % 4 === 0) line.note = { note: 'C', octave: 3, instrument: '00' };

      return line;
    }),
  };

  const defaultPatternC: Pattern = {
    id: '03',
    name: 'Pattern 03',
    step: Array.from({ length: defaultPatternLength }, (_, i) => {
      const line: Step = { note: null };

      if (i % 8 === 1) line.note = { note: 'G', octave: 5, instrument: '00' };
      if (i % 8 === 3) line.note = { note: 'E', octave: 5, instrument: '00' };
      if (i % 8 === 5) line.note = { note: 'C', octave: 5, instrument: '00' };
      if (i % 8 === 7) line.note = { note: 'E', octave: 5, instrument: '00' };

      return line;
    }),
  };

  return {
    title: DEFAULT_SONG_TITLE,
    author: DEFAULT_SONG_AUTHOR,
    year: new Date().getFullYear(),
    speed: 6,
    length: defaultPatternLength,
    loop: null,
    pattern: [defaultPatternA, defaultPatternB, defaultPatternC],
    line: [{ A: '01', B: '02', C: '03' }],
    instrument: [
      {
        id: '00',
        name: 'Default Instrument',
        volume: Array(32).fill(0x0f),
        arpeggio: [
          0, 4, 8, 12, 16, 20, 24, 20, 16, 12, 8, 4, 0, -4, -8, -12, -16, -20, -24, -20,
          -16, -12, -8, -4, ...Array(8).fill(0),
        ],
        pitch: Array(32).fill(0),
        noise: Array(32).fill(0),
        mode: Array(32).fill(0),
        base: DEFAULT_BASE_KEY,
        sustain: null,
      },
      {
        id: '01',
        name: 'Bass Instrument',
        volume: [15, 15, 12, 8, 4, 0, ...Array(26).fill(0)],
        arpeggio: [
          12, 8, 4, 0, -4, -8, -12, -8, -4, 0, 4, 8, 12, ...Array(19).fill(0),
        ],
        pitch: Array(32).fill(0),
        noise: Array(32).fill(0),
        mode: Array(32).fill(0),
        base: DEFAULT_BASE_KEY,
        sustain: null,
      },
      {
        id: '02',
        name: 'Lead Instrument',
        volume: [8, 12, 15, 12, 8, 4, ...Array(26).fill(0)],
        arpeggio: [
          24, 20, 16, 12, 8, 4, 0, -4, -8, -12, -16, -20, -24, ...Array(19).fill(0),
        ],
        pitch: Array(32).fill(0),
        noise: Array(32).fill(0),
        mode: Array(32).fill(0),
        base: DEFAULT_BASE_KEY,
        sustain: null,
      },
    ],
  };
};

export function loadInitialSong(): Song {
  try {
    const savedSong = localStorage.getItem(SONG_STORAGE_KEY);
    if (savedSong) {
      const parsedSong = JSON.parse(savedSong) as StoredSongForMigration;
      const instruments = parsedSong.instruments;
      const hasLegacyInstruments =
        Array.isArray(instruments) &&
        instruments.some(
          (inst) => inst && !Array.isArray(inst.volume) && Array.isArray(inst.volumeEnvelope),
        );

      if (!hasLegacyInstruments) {
        const rawSpeed = Number(parsedSong.speed);
        const baseSpeed = Number.isFinite(rawSpeed) && rawSpeed > 0 ? Math.floor(rawSpeed) : 6;
        const clampedSpeed = Math.max(2, baseSpeed);
        const evenSpeed = clampedSpeed & ~1;
        const normalized = normalizeStoredSongToCurrentSchema(parsedSong);
        return {
          ...normalized,
          speed: evenSpeed,
        };
      }

      localStorage.removeItem(SONG_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to load song from localStorage:', error);
  }

  try {
    return parseSongFromYaml(defaultSongYaml);
  } catch (error) {
    console.error('Failed to parse bundled default song YAML:', error);
    return createDefaultSong();
  }
}

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

  const newInstruments: Instrument[] = [];
  const removedInstrumentIds: string[] = [];

  song.instrument.forEach((inst) => {
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
      `Removed patterns: ${removedPatternIds.length}` +
        ` (${removedPatternIds.join(', ')})`,
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

export interface RenumberSongResult {
  renumberedSong: Song;
  nextCurrentInstrument: Instrument | null;
  summary: string;
}

export function renumberSongData(song: Song, currentInstrument: Instrument | null): RenumberSongResult {
  const patternById = new Map<string, Pattern>();
  song.pattern.forEach((pattern) => {
    if (pattern && typeof pattern.id === 'string') {
      patternById.set(pattern.id.trim().toUpperCase(), pattern);
    }
  });

  const orderedPatternIds: string[] = [];
  const seenPatternIds = new Set<string>();

  const addPatternId = (rawId: string) => {
    const trimmed = rawId.trim().toUpperCase();
    if (!trimmed || trimmed === '--') {
      return;
    }
    if (!patternById.has(trimmed) || seenPatternIds.has(trimmed)) {
      return;
    }

    seenPatternIds.add(trimmed);
    orderedPatternIds.push(trimmed);
  };

  song.line.forEach((entry) => {
    if (!entry) return;
    if (typeof entry.A === 'string') addPatternId(entry.A);
    if (typeof entry.B === 'string') addPatternId(entry.B);
    if (typeof entry.C === 'string') addPatternId(entry.C);
  });

  song.pattern.forEach((pattern) => {
    if (!pattern || typeof pattern.id !== 'string') return;
    const idNorm = pattern.id.trim().toUpperCase();
    if (!patternById.has(idNorm) || seenPatternIds.has(idNorm)) {
      return;
    }
    seenPatternIds.add(idNorm);
    orderedPatternIds.push(idNorm);
  });

  const patternIdMap: Record<string, string> = {};
  orderedPatternIds.forEach((oldId, index) => {
    patternIdMap[oldId] = index.toString(16).padStart(2, '0').toUpperCase();
  });

  const remapPatternId = (rawId: string): string => {
    const trimmed = rawId.trim();
    if (!trimmed) return rawId;
    if (trimmed === '--') return trimmed;
    const mapped = patternIdMap[trimmed.toUpperCase()];
    return mapped || trimmed;
  };

  const newPlaylist = song.line.map((entry) => {
    if (!entry) return entry;
    return {
      A: typeof entry.A === 'string' ? remapPatternId(entry.A) : entry.A,
      B: typeof entry.B === 'string' ? remapPatternId(entry.B) : entry.B,
      C: typeof entry.C === 'string' ? remapPatternId(entry.C) : entry.C,
    };
  });

  const remappedPatterns: Pattern[] = orderedPatternIds
    .map<Pattern | null>((oldId) => {
      const original = patternById.get(oldId);
      if (!original) {
        return null;
      }

      const newId = patternIdMap[oldId];
      const newSteps: Step[] = (original.step || []).map((line) => ({
        note: line.note ? { ...line.note } : null,
        ...(line.volume !== undefined ? { volume: line.volume } : {}),
      }));

      return {
        ...original,
        id: newId,
        step: newSteps,
      };
    })
    .filter((pattern): pattern is Pattern => Boolean(pattern));

  const instruments = song.instrument || [];
  const instrumentsSorted = [...instruments].sort((a, b) => {
    const nameA = (a?.name || '').toLowerCase();
    const nameB = (b?.name || '').toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    const idA = parseInt(a?.id || '0', 16);
    const idB = parseInt(b?.id || '0', 16);
    return idA - idB;
  });

  const instrumentIdMap: Record<string, string> = {};

  const newInstruments: Instrument[] = instrumentsSorted.map((inst, index) => {
    const oldIdNorm = (inst.id || '').trim().toUpperCase();
    const newId = index.toString(16).padStart(2, '0').toUpperCase();
    if (oldIdNorm) {
      instrumentIdMap[oldIdNorm] = newId;
    }
    return {
      ...inst,
      id: newId,
    };
  });

  const remappedPatternsWithInstruments: Pattern[] = remappedPatterns.map((pattern) => {
    const steps = (pattern.step || []).map((line) => {
      const newLine: Step = { ...line };

      const note = newLine.note;
      if (note && typeof note.instrument === 'string') {
        const raw = note.instrument.trim().toUpperCase();
        const mapped = instrumentIdMap[raw];
        if (mapped) {
          newLine.note = {
            ...note,
            instrument: mapped,
          };
        }
      }

      return newLine;
    });

    return {
      ...pattern,
      step: steps,
    };
  });

  let nextCurrentInstrument = currentInstrument;
  if (currentInstrument) {
    const currentIdNorm = (currentInstrument.id || '').trim().toUpperCase();
    const mappedId = instrumentIdMap[currentIdNorm];
    if (mappedId) {
      const updatedFromList = newInstruments.find((inst) => inst.id === mappedId);
      nextCurrentInstrument = updatedFromList || { ...currentInstrument, id: mappedId };
    }
  }

  const renumberedSong: Song = {
    ...song,
    pattern: remappedPatternsWithInstruments,
    line: newPlaylist,
    instrument: newInstruments,
  };

  const summaryLines: string[] = [];
  summaryLines.push('Renumbering complete.');
  summaryLines.push('');

  const patternMappingLines: string[] = [];
  orderedPatternIds.forEach((oldId) => {
    const newId = patternIdMap[oldId];
    if (!newId || newId === oldId) {
      return;
    }
    const pattern = patternById.get(oldId);
    const name = pattern && pattern.name ? pattern.name : '';
    patternMappingLines.push(`- ${oldId} -> ${newId}${name ? ` (${name})` : ''}`);
  });

  const instrumentMappingLines: string[] = [];
  instrumentsSorted.forEach((inst) => {
    const oldIdRaw = inst.id || '';
    const oldIdNorm = oldIdRaw.trim().toUpperCase();
    const mapped = oldIdNorm ? instrumentIdMap[oldIdNorm] : '';
    if (!mapped || mapped === oldIdNorm) {
      return;
    }
    const name = inst.name || '';
    instrumentMappingLines.push(`- ${oldIdRaw} -> ${mapped}${name ? ` (${name})` : ''}`);
  });

  const hasPatternChanges = patternMappingLines.length > 0;
  const hasInstrumentChanges = instrumentMappingLines.length > 0;

  if (hasPatternChanges || hasInstrumentChanges) {
    summaryLines.push(`Patterns: ${song.pattern.length} -> ${renumberedSong.pattern.length}`);
    summaryLines.push(
      `Instruments: ${song.instrument.length} -> ${renumberedSong.instrument.length}`,
    );

    if (hasPatternChanges) {
      summaryLines.push('');
      summaryLines.push('Pattern ID mapping (old -> new):');
      patternMappingLines.forEach((line) => summaryLines.push(line));
    }
    if (hasInstrumentChanges) {
      summaryLines.push('');
      summaryLines.push('Instrument ID mapping (old -> new):');
      instrumentMappingLines.forEach((line) => summaryLines.push(line));
    }
  } else {
    summaryLines.push('No pattern or instrument IDs were renumbered.');
  }

  return {
    renumberedSong,
    nextCurrentInstrument,
    summary: summaryLines.join('\n'),
  };
}
